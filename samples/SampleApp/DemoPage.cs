namespace SampleApp;

/// <summary>A tiny stand-in "application screen" that sends messages.</summary>
internal static class DemoPage
{
    internal const string Html = """
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Demo application</title>
<style>
  :root { --bg:#f6f7f9; --panel:#fff; --border:#e2e5ea; --text:#1a1d21; --muted:#6b7280; --accent:#2563eb; }
  @media (prefers-color-scheme: dark) {
    :root { --bg:#14161a; --panel:#1c1f25; --border:#2c313a; --text:#e6e8ec; --muted:#9aa3b0; --accent:#5b8cff; }
  }
  * { box-sizing:border-box }
  body { margin:0; background:var(--bg); color:var(--text);
         font:14px/1.6 ui-sans-serif,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; }
  .wrap { max-width:620px; margin:40px auto; padding:0 16px }
  .card { background:var(--panel); border:1px solid var(--border); border-radius:12px; padding:22px }
  h1 { font-size:19px; margin:0 0 4px }
  p.sub { color:var(--muted); margin:0 0 20px }
  label { display:block; font-size:12px; text-transform:uppercase; letter-spacing:.04em;
          color:var(--muted); margin:14px 0 5px; font-weight:600 }
  input, textarea { width:100%; font:inherit; color:var(--text); background:var(--bg);
                    border:1px solid var(--border); border-radius:8px; padding:9px 11px }
  button { margin-top:18px; width:100%; font:inherit; font-weight:600; cursor:pointer;
           background:var(--accent); color:#fff; border:0; border-radius:8px; padding:11px }
  pre { background:var(--bg); border:1px solid var(--border); border-radius:8px;
        padding:12px; overflow:auto; font-size:12.5px; margin-top:16px }
  a { color:var(--accent) }
  .tip { margin-top:20px; font-size:13px; color:var(--muted) }
</style>
</head>
<body>
<div class="wrap">
  <div class="card">
    <h1>Demo application</h1>
    <p class="sub">Stands in for the system that sends SMS. Nothing here knows the toolkit exists.</p>

    <label for="to">To</label>
    <input id="to" value="+61412345678">

    <label for="from">From</label>
    <input id="from" value="+15005550006">

    <label for="body">Body</label>
    <textarea id="body" rows="3">Your inspection is booked for Tuesday at 9am.</textarea>

    <label for="cb">Status callback (optional)</label>
    <input id="cb" placeholder="http://localhost:5199/twilio/status">

    <button id="send">Send message</button>
    <pre id="out" hidden></pre>

    <p class="tip">Then open the <a href="/_twilio" target="_blank">SMS Inspector</a> to see what happened.</p>
  </div>
</div>
<script>
document.getElementById("send").addEventListener("click", function () {
  var out = document.getElementById("out");
  out.hidden = false;
  out.textContent = "sending…";
  fetch("/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to: document.getElementById("to").value,
      from: document.getElementById("from").value,
      body: document.getElementById("body").value,
      statusCallback: document.getElementById("cb").value
    })
  })
  .then(function (r) { return r.json(); })
  .then(function (j) { out.textContent = JSON.stringify(j, null, 2); })
  .catch(function (e) { out.textContent = String(e); });
});
</script>
</body>
</html>
""";
}
