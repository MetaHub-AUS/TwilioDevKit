namespace TwilioDevKit.AspNetCore.Inspector
{
    /// <summary>The inspector screen: one self-contained HTML document, no build step.</summary>
    /// <remarks>
    /// Deliberately a single string with no framework, bundler, CDN or static-file
    /// dependency. It renders wherever the application runs - including an air-gapped build
    /// agent - and adds nothing to the host application's asset pipeline.
    /// </remarks>
    internal static class InspectorPage
    {
        /// <summary>Renders the page, pointing its API calls at <paramref name="basePath"/>.</summary>
        internal static string Html(string basePath) => Template.Replace("__BASE__", basePath);

        private const string Template = """
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>SMS Inspector</title>
<link rel="icon" href="data:,">
<style>
  :root {
    --bg: #f6f7f9; --panel: #ffffff; --border: #e2e5ea; --text: #1a1d21; --muted: #6b7280;
    --accent: #2563eb; --ok: #12805c; --warn: #b45309; --bad: #c0362c; --sim: #7c3aed;
    --chip: #eef1f5; --shadow: 0 1px 2px rgba(0,0,0,.06), 0 4px 12px rgba(0,0,0,.04);
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #14161a; --panel: #1c1f25; --border: #2c313a; --text: #e6e8ec; --muted: #9aa3b0;
      --accent: #5b8cff; --ok: #35c692; --warn: #e2a33c; --bad: #ef6a5e; --sim: #a780f5;
      --chip: #262a32; --shadow: none;
    }
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; background: var(--bg); color: var(--text);
    font: 14px/1.5 ui-sans-serif, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }
  header {
    display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
    padding: 14px 20px; background: var(--panel); border-bottom: 1px solid var(--border);
    position: sticky; top: 0; z-index: 20;
  }
  h1 { font-size: 16px; margin: 0; font-weight: 650; letter-spacing: -0.01em; }
  .sub { color: var(--muted); font-size: 12px; }
  .spacer { flex: 1; }
  .pill {
    display: inline-flex; align-items: center; gap: 6px; padding: 3px 9px; border-radius: 999px;
    background: var(--chip); font-size: 12px; font-weight: 550; white-space: nowrap;
  }
  .dot { width: 7px; height: 7px; border-radius: 50%; background: var(--muted); }
  .dot.live { background: var(--ok); animation: pulse 2s infinite; }
  @keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: .35 } }
  main { padding: 18px 20px 60px; max-width: 1400px; margin: 0 auto; }
  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; margin-bottom: 16px; }
  .stat { background: var(--panel); border: 1px solid var(--border); border-radius: 10px; padding: 10px 12px; box-shadow: var(--shadow); }
  .stat .n { font-size: 20px; font-weight: 650; font-variant-numeric: tabular-nums; }
  .stat .l { color: var(--muted); font-size: 11px; text-transform: uppercase; letter-spacing: .04em; }
  .tabs { display: flex; gap: 4px; margin-bottom: 14px; flex-wrap: wrap; }
  .tab {
    padding: 7px 13px; border-radius: 8px; border: 1px solid transparent; background: transparent;
    color: var(--muted); font: inherit; font-weight: 550; cursor: pointer;
  }
  .tab:hover { background: var(--chip); }
  .tab[aria-selected="true"] { background: var(--panel); border-color: var(--border); color: var(--text); box-shadow: var(--shadow); }
  .panel { background: var(--panel); border: 1px solid var(--border); border-radius: 12px; box-shadow: var(--shadow); overflow: hidden; }
  .toolbar { display: flex; gap: 8px; padding: 12px; border-bottom: 1px solid var(--border); flex-wrap: wrap; align-items: center; }
  input, select, textarea, button {
    font: inherit; color: var(--text); background: var(--bg);
    border: 1px solid var(--border); border-radius: 8px; padding: 7px 10px;
  }
  input:focus, select:focus, textarea:focus { outline: 2px solid var(--accent); outline-offset: -1px; }
  input[type=search] { flex: 1; min-width: 180px; }
  button { cursor: pointer; background: var(--chip); font-weight: 550; }
  button:hover { border-color: var(--accent); }
  button.primary { background: var(--accent); color: #fff; border-color: var(--accent); }
  button.danger:hover { border-color: var(--bad); color: var(--bad); }
  label.check { display: inline-flex; align-items: center; gap: 6px; color: var(--muted); font-size: 13px; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: var(--muted); padding: 9px 12px; border-bottom: 1px solid var(--border); font-weight: 600; }
  td { padding: 9px 12px; border-bottom: 1px solid var(--border); vertical-align: top; }
  tbody tr { cursor: pointer; }
  tbody tr:hover { background: var(--chip); }
  tbody tr.sel { background: color-mix(in srgb, var(--accent) 10%, transparent); }
  .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12.5px; }
  .num { white-space: nowrap; }
  .arrow { color: var(--muted); }
  .body-cell { max-width: 320px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--muted); }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 11.5px; font-weight: 600; white-space: nowrap; }
  .b-allow { background: color-mix(in srgb, var(--ok) 18%, transparent); color: var(--ok); }
  .b-sim   { background: color-mix(in srgb, var(--sim) 18%, transparent); color: var(--sim); }
  .b-map   { background: color-mix(in srgb, var(--accent) 18%, transparent); color: var(--accent); }
  .b-red   { background: color-mix(in srgb, var(--warn) 20%, transparent); color: var(--warn); }
  .b-fail  { background: color-mix(in srgb, var(--bad) 18%, transparent); color: var(--bad); }
  .b-muted { background: var(--chip); color: var(--muted); }
  .empty { padding: 44px 20px; text-align: center; color: var(--muted); }
  .empty code { background: var(--chip); padding: 2px 6px; border-radius: 5px; }
  dialog {
    border: 1px solid var(--border); border-radius: 14px; background: var(--panel); color: var(--text);
    max-width: 720px; width: calc(100% - 32px); padding: 0; box-shadow: 0 16px 48px rgba(0,0,0,.28);
  }
  dialog::backdrop { background: rgba(0,0,0,.45); }
  .dlg-head { display: flex; align-items: center; gap: 10px; padding: 14px 18px; border-bottom: 1px solid var(--border); }
  .dlg-body { padding: 16px 18px; max-height: 68vh; overflow: auto; }
  .kv { display: grid; grid-template-columns: 150px 1fr; gap: 7px 14px; }
  .kv dt { color: var(--muted); font-size: 12.5px; }
  .kv dd { margin: 0; word-break: break-word; }
  .bubble { background: var(--chip); border-radius: 10px; padding: 11px 13px; white-space: pre-wrap; word-break: break-word; margin: 6px 0 14px; }
  .section-title { font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: var(--muted); font-weight: 600; margin: 18px 0 7px; }
  .timeline { list-style: none; margin: 0; padding: 0; }
  .timeline li { display: flex; gap: 10px; align-items: baseline; padding: 5px 0; border-bottom: 1px dashed var(--border); }
  .timeline li:last-child { border-bottom: 0; }
  .note { background: color-mix(in srgb, var(--accent) 8%, transparent); border-left: 3px solid var(--accent); padding: 9px 12px; border-radius: 0 8px 8px 0; margin: 10px 0; font-size: 13px; }
  .note.warn { background: color-mix(in srgb, var(--warn) 10%, transparent); border-left-color: var(--warn); }
  .grid2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px; }
  .pad { padding: 16px; }
  .rule-row { display: grid; grid-template-columns: 1.4fr 1fr 1fr auto; gap: 8px; align-items: center; margin-bottom: 8px; }
  .hint { color: var(--muted); font-size: 12px; margin: 4px 0 12px; }
  .result { margin-top: 12px; }
  @media (max-width: 760px) {
    .hide-sm { display: none; }
    .kv { grid-template-columns: 1fr; gap: 2px 0; }
    .kv dt { margin-top: 8px; }
    .rule-row { grid-template-columns: 1fr; }
    main { padding: 14px 16px 50px; }
    header { padding: 12px 16px; }
  }
</style>
</head>
<body>
<header>
  <h1>SMS Inspector</h1>
  <span class="sub" id="modeLine">loading…</span>
  <span class="spacer"></span>
  <span class="pill"><span class="dot" id="liveDot"></span><span id="liveText">connecting</span></span>
</header>

<main>
  <section class="stats" id="stats"></section>

  <nav class="tabs" role="tablist">
    <button class="tab" role="tab" aria-selected="true"  data-tab="messages">Messages</button>
    <button class="tab" role="tab" aria-selected="false" data-tab="rules">Number rules</button>
    <button class="tab" role="tab" aria-selected="false" data-tab="try">Try a number</button>
    <button class="tab" role="tab" aria-selected="false" data-tab="reference">Reference</button>
  </nav>

  <!-- ------------------------------------------------------- messages -->
  <section class="panel" id="tab-messages">
    <div class="toolbar">
      <input type="search" id="search" placeholder="Search recipient, body, SID or rule…">
      <select id="statusFilter">
        <option value="">Any status</option>
        <option>queued</option><option>sent</option><option>delivered</option>
        <option>failed</option><option>undelivered</option>
      </select>
      <select id="actionFilter">
        <option value="">Any action</option>
        <option>Allow</option><option>Simulate</option><option>MapToTestNumber</option>
        <option>Redirect</option><option>Fail</option>
      </select>
      <label class="check"><input type="checkbox" id="failOnly"> Failures only</label>
      <span class="spacer"></span>
      <button id="refresh">Refresh</button>
      <button id="clear" class="danger">Clear</button>
    </div>
    <div id="tableWrap"></div>
  </section>

  <!-- ------------------------------------------------------- rules -->
  <section class="panel pad" id="tab-rules" hidden>
    <div class="grid2">
      <div>
        <div class="section-title">Send behaviour</div>
        <p class="hint">
          Rules are evaluated top to bottom and the first match wins. Numbers under
          “Always deliver for real” are checked before every rule below.
        </p>
        <label class="check" style="margin-bottom:10px">
          <input type="checkbox" id="cfgEnabled"> Interception enabled
        </label>
        <div class="rule-row" style="grid-template-columns: 1fr 1fr;">
          <label>Default action
            <select id="cfgDefault" style="width:100%;margin-top:4px">
              <option>Simulate</option><option>Allow</option><option>MapToTestNumber</option>
              <option>Redirect</option><option>Fail</option>
            </select>
          </label>
          <label>Redirect target
            <input id="cfgRedirect" placeholder="+61499999999" style="width:100%;margin-top:4px">
          </label>
        </div>

        <div class="section-title">Always deliver for real</div>
        <p class="hint">One number per line. These are the handsets you actually want to ring.</p>
        <textarea id="cfgAllowed" rows="4" style="width:100%" placeholder="+61412345678"></textarea>
      </div>

      <div>
        <div class="section-title">Rules</div>
        <div id="ruleList"></div>
        <button id="addRule">Add rule</button>
        <p class="hint" style="margin-top:12px">
          Match forms: <code>+61412345678</code> exact · <code>+614*</code> prefix ·
          <code>country:AU</code> · <code>regex:^\+614\d{8}$</code> · <code>*</code> everything.
        </p>
        <button class="primary" id="saveRules">Save changes</button>
        <span id="saveMsg" class="hint"></span>
      </div>
    </div>
  </section>

  <!-- ------------------------------------------------------- try -->
  <section class="panel pad" id="tab-try" hidden>
    <div class="grid2">
      <div>
        <div class="section-title">What would happen to this number?</div>
        <p class="hint">Resolves the rules without sending anything.</p>
        <div style="display:flex;gap:8px">
          <input id="previewTo" placeholder="+61412345678 or 0412 345 678" style="flex:1">
          <button id="previewBtn">Check</button>
        </div>
        <div class="result" id="previewOut"></div>
      </div>
      <div>
        <div class="section-title">Send a test message</div>
        <p class="hint">Goes through the same pipeline as the application, rules and all.</p>
        <div style="display:grid;gap:8px">
          <input id="sendTo" placeholder="To: +61412345678">
          <input id="sendFrom" placeholder="From: +15005550006 (optional)">
          <textarea id="sendBody" rows="3" placeholder="Message body"></textarea>
          <button class="primary" id="sendBtn">Send test</button>
        </div>
        <div class="result" id="sendOut"></div>
      </div>
    </div>
  </section>

  <!-- ------------------------------------------------------- reference -->
  <section class="panel pad" id="tab-reference" hidden>
    <div class="note">
      With <strong>test credentials</strong> Twilio only accepts the magic numbers below. That is the
      restriction this toolkit removes: point a rule at <code>MapToTestNumber</code> and any number you
      like is tested against the real API, while the record keeps the number your code actually asked for.
    </div>
    <div class="section-title">Magic test numbers</div>
    <div id="refNumbers"></div>
    <div class="section-title">Reproducible error codes</div>
    <p class="hint">
      2xxxx codes fail the send and throw. 3xxxx codes succeed at send time and fail later on the
      status callback — the failures that normal tests never reach.
    </p>
    <div id="refErrors"></div>
  </section>
</main>

<dialog id="detail">
  <div class="dlg-head">
    <strong id="dTitle">Message</strong>
    <span class="spacer"></span>
    <button onclick="document.getElementById('detail').close()">Close</button>
  </div>
  <div class="dlg-body" id="dBody"></div>
</dialog>

<datalist id="errorCodes"></datalist>

<script>
(function () {
  "use strict";
  var BASE = "__BASE__";
  var token = new URLSearchParams(location.search).get("token");
  var rows = [];
  var rules = [];
  var selectedId = null;

  function url(path) { return BASE + path + (token ? (path.indexOf("?") >= 0 ? "&" : "?") + "token=" + encodeURIComponent(token) : ""); }

  function api(path, options) {
    options = options || {};
    options.headers = Object.assign({ "Content-Type": "application/json" }, options.headers || {});
    if (token) options.headers["X-DevKit-Token"] = token;
    return fetch(url(path), options).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (body) {
        if (!r.ok) throw new Error(body.error || ("Request failed with " + r.status));
        return body;
      });
    });
  }

  function esc(value) {
    return String(value === null || value === undefined ? "" : value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function time(iso) {
    var d = new Date(iso);
    return isNaN(d) ? "" : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }

  var ACTION_CLASS = {
    Allow: "b-allow", Simulate: "b-sim", MapToTestNumber: "b-map", Redirect: "b-red", Fail: "b-fail"
  };
  var ACTION_LABEL = {
    Allow: "Sent for real", Simulate: "Simulated", MapToTestNumber: "Mapped to test number",
    Redirect: "Redirected", Fail: "Forced failure"
  };

  function statusBadge(record) {
    var s = record.status || "";
    var cls = s === "delivered" ? "b-allow"
            : (s === "failed" || s === "undelivered") ? "b-fail"
            : (s === "sent" || s === "queued") ? "b-muted" : "b-muted";
    var text = esc(s);
    if (record.errorCode) text += " · " + record.errorCode;
    return '<span class="badge ' + cls + '">' + text + "</span>";
  }

  // ------------------------------------------------------------ messages

  function renderStats(stats) {
    if (!stats) return;
    var cells = [
      ["Messages", stats.total],
      ["Sent to Twilio", stats.reachedTwilio],
      ["Simulated", stats.simulated],
      ["Rewritten", stats.rewritten],
      ["Failed", stats.failed],
      ["Segments", stats.segments]
    ];
    document.getElementById("stats").innerHTML = cells.map(function (c) {
      return '<div class="stat"><div class="n">' + (c[1] || 0) + '</div><div class="l">' + c[0] + "</div></div>";
    }).join("");
  }

  function renderTable() {
    var wrap = document.getElementById("tableWrap");
    if (!rows.length) {
      wrap.innerHTML = '<div class="empty">No messages recorded yet.<br><br>' +
        'Send one from your application, or use <code>Try a number</code> above.</div>';
      return;
    }

    var html = '<table><thead><tr>' +
      "<th>Time</th><th>To</th><th class='hide-sm'>From</th><th class='hide-sm'>Body</th>" +
      "<th>Handling</th><th>Status</th></tr></thead><tbody>";

    rows.forEach(function (r) {
      var to = '<span class="mono num">' + esc(r.to || "") + "</span>";
      if (r.rewritten) {
        to += '<br><span class="mono num arrow">→ ' + esc(r.effectiveTo || "") + "</span>";
      }
      var seg = r.segments > 1 ? ' <span class="badge b-muted">' + r.segments + "×</span>" : "";
      html += '<tr data-id="' + esc(r.id) + '"' + (r.id === selectedId ? ' class="sel"' : "") + ">" +
        "<td class='mono num'>" + time(r.timestamp) + "</td>" +
        "<td>" + to + "</td>" +
        "<td class='mono num hide-sm'>" + esc(r.from || r.messagingServiceSid || "") + "</td>" +
        "<td class='body-cell hide-sm'>" + esc(r.body || "") + seg + "</td>" +
        '<td><span class="badge ' + (ACTION_CLASS[r.action] || "b-muted") + '">' +
          esc(ACTION_LABEL[r.action] || r.action) + "</span></td>" +
        "<td>" + statusBadge(r) + "</td></tr>";
    });

    wrap.innerHTML = html + "</tbody></table>";
    Array.prototype.forEach.call(wrap.querySelectorAll("tr[data-id]"), function (tr) {
      tr.addEventListener("click", function () { showDetail(tr.getAttribute("data-id")); });
    });
  }

  function showDetail(id) {
    var r = rows.filter(function (x) { return x.id === id; })[0];
    if (!r) return;
    selectedId = id;

    var kv = [
      ["Requested recipient", '<span class="mono">' + esc(r.to) + "</span>"],
      r.rewritten ? ["Actually sent to", '<span class="mono">' + esc(r.effectiveTo) + "</span>"] : null,
      ["From", '<span class="mono">' + esc(r.from || r.messagingServiceSid || "—") + "</span>"],
      ["Message SID", '<span class="mono">' + esc(r.sid || "—") + "</span>"],
      ["Status", statusBadge(r)],
      ["Handling", '<span class="badge ' + (ACTION_CLASS[r.action] || "b-muted") + '">' +
        esc(ACTION_LABEL[r.action] || r.action) + "</span>"],
      ["Reached Twilio", r.reachedTwilio ? "Yes" : "No — handled locally"],
      ["Segments", r.segments + " × " + esc(r.encoding) +
        (r.forcedUnicodeBy ? ' <span class="badge b-red">' + esc(r.forcedUnicodeBy) + " forced UCS-2</span>" : "")],
      r.durationMs ? ["Round trip", Math.round(r.durationMs) + " ms"] : null,
      r.matchedRule ? ["Matched rule", '<span class="mono">' + esc(r.matchedRule) + "</span>"] : null,
      r.statusCallbackUrl ? ["Status callback", '<span class="mono">' + esc(r.statusCallbackUrl) + "</span>"] : null
    ].filter(Boolean);

    var html = '<div class="section-title">Message</div><div class="bubble">' +
      (r.body ? esc(r.body) : "<em>(empty body)</em>") + "</div>";

    html += '<dl class="kv">' + kv.map(function (p) {
      return "<dt>" + p[0] + "</dt><dd>" + p[1] + "</dd>";
    }).join("") + "</dl>";

    if (r.reason) {
      html += '<div class="note">' + esc(r.reason) + "</div>";
    }
    if (r.errorCode) {
      html += '<div class="note warn"><strong>Error ' + esc(r.errorCode) + "</strong>" +
        (r.errorMessage ? "<br>" + esc(r.errorMessage) : "") + "</div>";
    }

    if (r.history && r.history.length) {
      html += '<div class="section-title">Delivery timeline</div><ul class="timeline">' +
        r.history.map(function (h) {
          return "<li><span class='mono num'>" + time(h.at) + "</span>" +
            "<strong>" + esc(h.status) + "</strong>" +
            (h.errorCode ? '<span class="badge b-fail">' + esc(h.errorCode) + "</span>" : "") +
            '<span class="spacer"></span><span class="sub">' + esc(h.source) + "</span></li>";
        }).join("") + "</ul>";
    }

    if (r.parameters && Object.keys(r.parameters).length) {
      html += '<div class="section-title">Parameters posted to Twilio</div><dl class="kv">' +
        Object.keys(r.parameters).map(function (k) {
          return "<dt class='mono'>" + esc(k) + "</dt><dd class='mono'>" + esc(r.parameters[k]) + "</dd>";
        }).join("") + "</dl>";
    }

    document.getElementById("dTitle").textContent = "Message to " + (r.to || "");
    document.getElementById("dBody").innerHTML = html;
    document.getElementById("detail").showModal();
    renderTable();
  }

  function load() {
    var params = new URLSearchParams();
    var search = document.getElementById("search").value.trim();
    var status = document.getElementById("statusFilter").value;
    var action = document.getElementById("actionFilter").value;
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    if (action) params.set("action", action);
    if (document.getElementById("failOnly").checked) params.set("failuresOnly", "true");
    params.set("limit", "200");

    return api("/api/messages?" + params.toString()).then(function (data) {
      rows = data.messages || [];
      renderStats(data.stats);
      renderTable();
    }).catch(function (err) {
      document.getElementById("tableWrap").innerHTML =
        '<div class="empty">Could not load messages: ' + esc(err.message) + "</div>";
    });
  }

  // ------------------------------------------------------------ config

  function renderRules() {
    var host = document.getElementById("ruleList");
    if (!rules.length) {
      host.innerHTML = '<p class="hint">No rules yet — the default action applies to everything.</p>';
      return;
    }
    host.innerHTML = rules.map(function (rule, i) {
      var actions = ["Simulate", "Allow", "MapToTestNumber", "Redirect", "Fail"].map(function (a) {
        return '<option' + (a === rule.action ? " selected" : "") + ">" + a + "</option>";
      }).join("");

      // A Fail rule is only meaningful with an error code, so surface it inline.
      var third = rule.action === "Fail"
        ? '<input class="mono" data-i="' + i + '" data-f="errorCode" value="' + esc(rule.errorCode || "") +
          '" placeholder="21610" list="errorCodes" title="Twilio error code to raise">'
        : '<input data-i="' + i + '" data-f="note" value="' + esc(rule.note || "") + '" placeholder="note">';

      return '<div class="rule-row">' +
        '<input class="mono" data-i="' + i + '" data-f="match" value="' + esc(rule.match) + '" placeholder="+614*">' +
        '<select data-i="' + i + '" data-f="action">' + actions + "</select>" +
        third +
        '<button data-del="' + i + '" title="Remove">✕</button></div>';
    }).join("");

    Array.prototype.forEach.call(host.querySelectorAll("[data-f]"), function (el) {
      el.addEventListener("change", function () {
        var rule = rules[+el.getAttribute("data-i")];
        rule[el.getAttribute("data-f")] = el.value;
        // Switching to or from Fail swaps the third field, so redraw.
        if (el.getAttribute("data-f") === "action") renderRules();
      });
    });
    Array.prototype.forEach.call(host.querySelectorAll("[data-del]"), function (el) {
      el.addEventListener("click", function () {
        rules.splice(+el.getAttribute("data-del"), 1);
        renderRules();
      });
    });
  }

  function loadConfig() {
    return api("/api/config").then(function (cfg) {
      rules = (cfg.rules || []).map(function (r) {
        return { match: r.match, action: r.action, note: r.note, mapTo: r.mapTo, redirectTo: r.redirectTo, errorCode: r.errorCode, enabled: true };
      });
      document.getElementById("cfgEnabled").checked = !!cfg.enabled;
      document.getElementById("cfgDefault").value = cfg.defaultAction;
      document.getElementById("cfgRedirect").value = cfg.redirectTo || "";
      document.getElementById("cfgAllowed").value = (cfg.allowedNumbers || []).join("\n");
      renderRules();

      var mode = cfg.enabled
        ? "intercepting · default " + cfg.defaultAction
        : "disabled — everything is sent normally";
      var problems = (cfg.problems || []).length ? " · " + cfg.problems.length + " config warning(s)" : "";
      document.getElementById("modeLine").textContent = mode + problems;

      if (!cfg.inspector.allowRuntimeChanges) {
        Array.prototype.forEach.call(
          document.querySelectorAll("#tab-rules input, #tab-rules select, #tab-rules textarea, #tab-rules button"),
          function (el) { el.disabled = true; });
        document.getElementById("saveMsg").textContent = "Runtime changes are disabled for this inspector.";
      }
    }).catch(function (err) {
      document.getElementById("modeLine").textContent = "config unavailable: " + err.message;
    });
  }

  function saveConfig() {
    var allowed = document.getElementById("cfgAllowed").value
      .split("\n").map(function (s) { return s.trim(); }).filter(Boolean);

    var payload = {
      enabled: document.getElementById("cfgEnabled").checked,
      defaultAction: document.getElementById("cfgDefault").value,
      redirectTo: document.getElementById("cfgRedirect").value.trim(),
      allowedNumbers: allowed,
      rules: rules.map(function (r) {
        return {
          match: r.match, action: r.action, note: r.note,
          mapTo: r.mapTo || null, redirectTo: r.redirectTo || null,
          errorCode: r.errorCode ? +r.errorCode : null, enabled: true
        };
      })
    };

    var msg = document.getElementById("saveMsg");
    msg.textContent = "saving…";
    api("/api/config", { method: "POST", body: JSON.stringify(payload) })
      .then(function () { msg.textContent = "Saved. New sends use these rules immediately."; return loadConfig(); })
      .catch(function (err) { msg.textContent = "Could not save: " + err.message; });
  }

  // ------------------------------------------------------------ try / reference

  function preview() {
    var to = document.getElementById("previewTo").value.trim();
    var out = document.getElementById("previewOut");
    if (!to) { out.innerHTML = ""; return; }

    api("/api/preview?to=" + encodeURIComponent(to)).then(function (p) {
      out.innerHTML = '<dl class="kv">' +
        "<dt>Normalised</dt><dd class='mono'>" + esc(p.normalized) +
          (p.country ? " (" + esc(p.country) + ")" : "") +
          (p.valid ? "" : ' <span class="badge b-red">not valid E.164</span>') + "</dd>" +
        "<dt>Handling</dt><dd><span class='badge " + (ACTION_CLASS[p.action] || "b-muted") + "'>" +
          esc(ACTION_LABEL[p.action] || p.action) + "</span></dd>" +
        (p.rewritten ? "<dt>Sent to</dt><dd class='mono'>" + esc(p.effectiveTo) + "</dd>" : "") +
        (p.errorCode ? "<dt>Fails with</dt><dd>" + esc(p.errorCode) + "</dd>" : "") +
        "<dt>Why</dt><dd>" + esc(p.reason) + "</dd></dl>";
    }).catch(function (err) { out.innerHTML = '<div class="note warn">' + esc(err.message) + "</div>"; });
  }

  function sendTest() {
    var out = document.getElementById("sendOut");
    out.textContent = "sending…";
    api("/api/test-send", {
      method: "POST",
      body: JSON.stringify({
        to: document.getElementById("sendTo").value.trim(),
        from: document.getElementById("sendFrom").value.trim(),
        body: document.getElementById("sendBody").value
      })
    }).then(function (res) {
      out.innerHTML = res.sent
        ? '<div class="note">Accepted as <span class="mono">' + esc(res.sid) + "</span> — status " + esc(res.status) + ".</div>"
        : '<div class="note warn">Failed with Twilio error <strong>' + esc(res.errorCode) + "</strong><br>" + esc(res.error) + "</div>";
      load();
    }).catch(function (err) { out.innerHTML = '<div class="note warn">' + esc(err.message) + "</div>"; });
  }

  function loadReference() {
    api("/api/reference").then(function (ref) {
      document.getElementById("refNumbers").innerHTML =
        "<table><thead><tr><th>Number</th><th>Field</th><th>Result</th></tr></thead><tbody>" +
        ref.testNumbers.map(function (n) {
          return "<tr><td class='mono num'>" + esc(n.number) + "</td><td>" + esc(n.field) + "</td><td>" +
            (n.errorCode ? '<span class="badge b-fail">' + n.errorCode + "</span> " : '<span class="badge b-allow">ok</span> ') +
            esc(n.description) + "</td></tr>";
        }).join("") + "</tbody></table>";

      document.getElementById("refErrors").innerHTML =
        "<table><thead><tr><th>Code</th><th>When</th><th>Message</th></tr></thead><tbody>" +
        ref.errors.map(function (e) {
          return "<tr><td class='mono'>" + e.code + "</td><td>" +
            (e.isDeliveryTime ? '<span class="badge b-red">on callback</span>' : '<span class="badge b-muted">at send</span>') +
            "</td><td>" + esc(e.message) + "</td></tr>";
        }).join("") + "</tbody></table>";

      // Feed the rule editor's error-code picker.
      document.getElementById("errorCodes").innerHTML = ref.errors.map(function (e) {
        return '<option value="' + e.code + '">' + esc(e.message) + "</option>";
      }).join("");
    }).catch(function () { /* reference is decorative; ignore */ });
  }

  // ------------------------------------------------------------ live stream

  function connect() {
    if (!window.EventSource) return;
    var source = new EventSource(url("/api/events"));

    source.addEventListener("open", function () {
      document.getElementById("liveDot").className = "dot live";
      document.getElementById("liveText").textContent = "live";
    });

    source.addEventListener("message", function (event) {
      try {
        var record = JSON.parse(event.data);
        var existing = rows.filter(function (x) { return x.id === record.id; })[0];
        if (existing) {
          rows[rows.indexOf(existing)] = record;
        } else {
          rows.unshift(record);
          if (rows.length > 200) rows.pop();
        }
        renderTable();
        api("/api/stats").then(renderStats).catch(function () {});
      } catch (e) { /* ignore a malformed frame */ }
    });

    source.addEventListener("error", function () {
      document.getElementById("liveDot").className = "dot";
      document.getElementById("liveText").textContent = "reconnecting";
    });
  }

  // ------------------------------------------------------------ wiring

  Array.prototype.forEach.call(document.querySelectorAll(".tab"), function (tab) {
    tab.addEventListener("click", function () {
      Array.prototype.forEach.call(document.querySelectorAll(".tab"), function (t) {
        t.setAttribute("aria-selected", String(t === tab));
      });
      ["messages", "rules", "try", "reference"].forEach(function (name) {
        document.getElementById("tab-" + name).hidden = name !== tab.getAttribute("data-tab");
      });
    });
  });

  var debounce;
  document.getElementById("search").addEventListener("input", function () {
    clearTimeout(debounce);
    debounce = setTimeout(load, 220);
  });
  document.getElementById("statusFilter").addEventListener("change", load);
  document.getElementById("actionFilter").addEventListener("change", load);
  document.getElementById("failOnly").addEventListener("change", load);
  document.getElementById("refresh").addEventListener("click", load);
  document.getElementById("clear").addEventListener("click", function () {
    if (!confirm("Clear every recorded message?")) return;
    api("/api/messages", { method: "DELETE" }).then(load);
  });

  document.getElementById("addRule").addEventListener("click", function () {
    rules.push({ match: "", action: "Simulate", note: "" });
    renderRules();
  });
  document.getElementById("saveRules").addEventListener("click", saveConfig);
  document.getElementById("previewBtn").addEventListener("click", preview);
  document.getElementById("previewTo").addEventListener("keydown", function (e) { if (e.key === "Enter") preview(); });
  document.getElementById("sendBtn").addEventListener("click", sendTest);

  load();
  loadConfig();
  loadReference();
  connect();
})();
</script>
</body>
</html>
""";
    }
}
