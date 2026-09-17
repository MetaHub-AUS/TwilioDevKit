using System;
using System.Linq;

namespace TwilioDevKit.Recording
{
    /// <summary>
    /// Works out how many SMS segments a body will be billed as, and in which encoding.
    /// </summary>
    /// <remarks>
    /// Worth surfacing on the inspector screen: a single "smart quote" or emoji pasted into
    /// a template silently drops the message from GSM-7 to UCS-2 and cuts the per-segment
    /// budget from 160 characters to 70, tripling the cost of a long message. That is
    /// invisible until the bill arrives, so the screen shows it per message.
    /// </remarks>
    public static class SegmentCalculator
    {
        // The GSM 03.38 basic alphabet.
        private const string GsmBasic =
            "@£$¥èéùìòÇ\nØø\rÅå" +
            "Δ_ΦΓΛΩΠΨΣΘΞÆæßÉ" +
            " !\"#¤%&'()*+,-./0123456789:;<=>?" +
            "¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§" +
            "¿abcdefghijklmnopqrstuvwxyzäöñüà";

        // Characters that are sendable in GSM-7 but cost two septets (escape + char).
        private const string GsmExtended = "\f^{}\\[~]|€";

        /// <summary>The result of measuring a message body.</summary>
        public sealed class SegmentInfo
        {
            /// <summary>"GSM-7" or "UCS-2".</summary>
            public string Encoding { get; set; } = "GSM-7";

            /// <summary>Number of billable segments (at least 1).</summary>
            public int Segments { get; set; } = 1;

            /// <summary>Characters used, counting GSM extended characters twice.</summary>
            public int Length { get; set; }

            /// <summary>Characters still available before another segment is billed.</summary>
            public int RemainingInLastSegment { get; set; }

            /// <summary>
            /// The first character that forced UCS-2, when applicable. This is the one piece of
            /// information that turns "why is this message 3 segments?" into a one-second fix.
            /// </summary>
            public string? ForcedUnicodeBy { get; set; }
        }

        /// <summary>Measures <paramref name="body"/>.</summary>
        public static SegmentInfo Measure(string? body)
        {
            var text = body ?? string.Empty;

            char? offender = null;
            var septets = 0;
            foreach (var ch in text)
            {
                if (GsmBasic.IndexOf(ch) >= 0) { septets += 1; continue; }
                if (GsmExtended.IndexOf(ch) >= 0) { septets += 2; continue; }
                offender ??= ch;
            }

            var isUnicode = offender.HasValue;

            if (!isUnicode)
            {
                // GSM-7: 160 septets alone, 153 per part once concatenated.
                var segments = septets <= 160 ? 1 : (int)Math.Ceiling(septets / 153.0);
                var capacity = segments == 1 ? 160 : segments * 153;
                return new SegmentInfo
                {
                    Encoding = "GSM-7",
                    Segments = Math.Max(1, segments),
                    Length = septets,
                    RemainingInLastSegment = Math.Max(0, capacity - septets),
                };
            }

            // UCS-2: counted in UTF-16 code units, 70 alone, 67 per concatenated part.
            var units = text.Sum(c => 1);
            var ucsSegments = units <= 70 ? 1 : (int)Math.Ceiling(units / 67.0);
            var ucsCapacity = ucsSegments == 1 ? 70 : ucsSegments * 67;

            return new SegmentInfo
            {
                Encoding = "UCS-2",
                Segments = Math.Max(1, ucsSegments),
                Length = units,
                RemainingInLastSegment = Math.Max(0, ucsCapacity - units),
                ForcedUnicodeBy = offender.HasValue ? DescribeChar(offender.Value) : null,
            };
        }

        private static string DescribeChar(char c)
        {
            var codePoint = "U+" + ((int)c).ToString("X4");
            return char.IsControl(c) || char.IsWhiteSpace(c)
                ? codePoint
                : $"'{c}' ({codePoint})";
        }
    }
}
