using System;
using System.Collections.Generic;

namespace TwilioDevKit.Recording
{
    /// <summary>Where the inspector reads its messages from.</summary>
    /// <remarks>
    /// Implement this to point the screen at somewhere durable - a table, Redis, or a log
    /// sink - without changing anything else. The shipped in-memory store is enough for
    /// local and shared test environments.
    /// </remarks>
    public interface ISmsRecordStore
    {
        /// <summary>Adds a record.</summary>
        void Add(SmsRecord record);

        /// <summary>
        /// Applies <paramref name="mutate"/> to the record with the given SID, if present.
        /// Used when a delivery callback arrives after the send.
        /// </summary>
        /// <returns>The updated record, or <c>null</c> when no record has that SID.</returns>
        SmsRecord? UpdateBySid(string sid, Action<SmsRecord> mutate);

        /// <summary>Returns matching records, newest first.</summary>
        IReadOnlyList<SmsRecord> Query(SmsRecordQuery query);

        /// <summary>Returns one record by its local id.</summary>
        SmsRecord? GetById(string id);

        /// <summary>Removes every record.</summary>
        void Clear();

        /// <summary>Total records currently held.</summary>
        int Count { get; }

        /// <summary>Raised whenever a record is added or updated, so the screen can live-update.</summary>
        event EventHandler<SmsRecord>? RecordChanged;
    }

    /// <summary>Filter and paging options for <see cref="ISmsRecordStore.Query"/>.</summary>
    public sealed class SmsRecordQuery
    {
        /// <summary>Free-text match across recipient, sender, body, SID and rule.</summary>
        public string? Search { get; set; }

        /// <summary>Restrict to one status.</summary>
        public string? Status { get; set; }

        /// <summary>Restrict to one override action.</summary>
        public string? Action { get; set; }

        /// <summary>Only failures.</summary>
        public bool FailuresOnly { get; set; }

        /// <summary>Only records newer than this instant.</summary>
        public DateTimeOffset? Since { get; set; }

        /// <summary>Maximum records to return. Default 100.</summary>
        public int Limit { get; set; } = 100;

        /// <summary>Records to skip, for paging.</summary>
        public int Offset { get; set; }
    }
}
