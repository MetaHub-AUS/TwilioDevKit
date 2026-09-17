using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.Json;

namespace TwilioDevKit.Recording
{
    /// <summary>
    /// A bounded, thread-safe store of recent messages, optionally mirrored to a
    /// newline-delimited JSON file so history survives a restart.
    /// </summary>
    /// <remarks>
    /// The buffer is capped at <see cref="TwilioDevKitOptions.MaxRecords"/>; the oldest
    /// record is dropped when it is full, so a long-running test environment cannot grow
    /// without bound.
    /// </remarks>
    public sealed class InMemorySmsRecordStore : ISmsRecordStore
    {
        private readonly LinkedList<SmsRecord> _records = new LinkedList<SmsRecord>();
        private readonly Dictionary<string, LinkedListNode<SmsRecord>> _bySid =
            new Dictionary<string, LinkedListNode<SmsRecord>>(StringComparer.OrdinalIgnoreCase);
        private readonly Dictionary<string, LinkedListNode<SmsRecord>> _byId =
            new Dictionary<string, LinkedListNode<SmsRecord>>(StringComparer.OrdinalIgnoreCase);

        private readonly object _gate = new object();
        private readonly int _maxRecords;
        private readonly string? _persistPath;

        private static readonly JsonSerializerOptions PersistJson = new JsonSerializerOptions
        {
            WriteIndented = false,
            DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull,
        };

        /// <summary>Creates a store.</summary>
        /// <param name="maxRecords">Ring-buffer capacity; values below 1 are treated as 1.</param>
        /// <param name="persistPath">Optional newline-delimited JSON file to append to.</param>
        public InMemorySmsRecordStore(int maxRecords = 500, string? persistPath = null)
        {
            _maxRecords = Math.Max(1, maxRecords);
            _persistPath = string.IsNullOrWhiteSpace(persistPath) ? null : persistPath;
        }

        /// <inheritdoc />
        public event EventHandler<SmsRecord>? RecordChanged;

        /// <inheritdoc />
        public int Count
        {
            get { lock (_gate) return _records.Count; }
        }

        /// <inheritdoc />
        public void Add(SmsRecord record)
        {
            if (record == null) throw new ArgumentNullException(nameof(record));

            lock (_gate)
            {
                var node = _records.AddFirst(record);
                _byId[record.Id] = node;
                if (!string.IsNullOrEmpty(record.Sid)) _bySid[record.Sid!] = node;

                while (_records.Count > _maxRecords)
                {
                    var oldest = _records.Last;
                    if (oldest == null) break;
                    _records.RemoveLast();
                    _byId.Remove(oldest.Value.Id);
                    if (!string.IsNullOrEmpty(oldest.Value.Sid)) _bySid.Remove(oldest.Value.Sid!);
                }
            }

            Persist(record);
            RecordChanged?.Invoke(this, record);
        }

        /// <inheritdoc />
        public SmsRecord? UpdateBySid(string sid, Action<SmsRecord> mutate)
        {
            if (string.IsNullOrWhiteSpace(sid) || mutate == null) return null;

            SmsRecord? record;
            lock (_gate)
            {
                if (!_bySid.TryGetValue(sid, out var node)) return null;
                record = node.Value;
                mutate(record);
            }

            RecordChanged?.Invoke(this, record);
            return record;
        }

        /// <inheritdoc />
        public SmsRecord? GetById(string id)
        {
            if (string.IsNullOrWhiteSpace(id)) return null;
            lock (_gate)
            {
                return _byId.TryGetValue(id, out var node) ? node.Value : null;
            }
        }

        /// <inheritdoc />
        public IReadOnlyList<SmsRecord> Query(SmsRecordQuery query)
        {
            query ??= new SmsRecordQuery();

            lock (_gate)
            {
                IEnumerable<SmsRecord> results = _records; // already newest-first

                if (query.Since.HasValue)
                    results = results.Where(r => r.Timestamp > query.Since!.Value);

                if (!string.IsNullOrWhiteSpace(query.Status))
                    results = results.Where(r => string.Equals(r.Status, query.Status, StringComparison.OrdinalIgnoreCase));

                if (!string.IsNullOrWhiteSpace(query.Action))
                    results = results.Where(r => string.Equals(r.Action.ToString(), query.Action, StringComparison.OrdinalIgnoreCase));

                if (query.FailuresOnly)
                    results = results.Where(r => r.IsFailure);

                if (!string.IsNullOrWhiteSpace(query.Search))
                {
                    var term = query.Search!.Trim();
                    results = results.Where(r => Contains(r.To, term)
                                              || Contains(r.EffectiveTo, term)
                                              || Contains(r.From, term)
                                              || Contains(r.Body, term)
                                              || Contains(r.Sid, term)
                                              || Contains(r.MatchedRule, term));
                }

                return results
                    .Skip(Math.Max(0, query.Offset))
                    .Take(Math.Max(1, query.Limit))
                    .ToList();
            }
        }

        /// <inheritdoc />
        public void Clear()
        {
            lock (_gate)
            {
                _records.Clear();
                _bySid.Clear();
                _byId.Clear();
            }
        }

        /// <summary>Aggregate counts for the header strip on the inspector screen.</summary>
        public SmsRecordStats Stats()
        {
            lock (_gate)
            {
                return new SmsRecordStats
                {
                    Total = _records.Count,
                    Delivered = _records.Count(r => string.Equals(r.Status, "delivered", StringComparison.OrdinalIgnoreCase)),
                    Failed = _records.Count(r => r.IsFailure),
                    Simulated = _records.Count(r => !r.ReachedTwilio),
                    ReachedTwilio = _records.Count(r => r.ReachedTwilio),
                    Rewritten = _records.Count(r => !string.Equals(r.To, r.EffectiveTo, StringComparison.OrdinalIgnoreCase)),
                    Segments = _records.Sum(r => r.Segments),
                    LastMessageAt = _records.First?.Value.Timestamp,
                };
            }
        }

        private static bool Contains(string? haystack, string needle) =>
            haystack != null && haystack.IndexOf(needle, StringComparison.OrdinalIgnoreCase) >= 0;

        private void Persist(SmsRecord record)
        {
            if (_persistPath == null) return;

            try
            {
                var directory = Path.GetDirectoryName(_persistPath);
                if (!string.IsNullOrEmpty(directory) && !Directory.Exists(directory))
                    Directory.CreateDirectory(directory!);

                var line = JsonSerializer.Serialize(record, PersistJson);
                File.AppendAllText(_persistPath, line + Environment.NewLine, Encoding.UTF8);
            }
            catch (Exception)
            {
                // Persistence is a convenience. A full disk or a locked file must never
                // break the application's ability to send messages.
            }
        }
    }

    /// <summary>Aggregate counts shown across the top of the inspector.</summary>
    public sealed class SmsRecordStats
    {
        /// <summary>Records held.</summary>
        public int Total { get; set; }

        /// <summary>Records whose last status was "delivered".</summary>
        public int Delivered { get; set; }

        /// <summary>Records that failed or were undelivered.</summary>
        public int Failed { get; set; }

        /// <summary>Records that never reached Twilio.</summary>
        public int Simulated { get; set; }

        /// <summary>Records that did reach Twilio.</summary>
        public int ReachedTwilio { get; set; }

        /// <summary>Records whose recipient was mapped or redirected.</summary>
        public int Rewritten { get; set; }

        /// <summary>Total billable segments across all held records.</summary>
        public int Segments { get; set; }

        /// <summary>Timestamp of the most recent message.</summary>
        public DateTimeOffset? LastMessageAt { get; set; }
    }
}
