// Telemetry List data relay (Azure Static Web Apps managed function, served at /api/telemetry).
// Passes the page's request on to the Telemetry Feed web app (HWM Call-ins Apps Script project) from Azure's servers,
// so STW's browsers only ever talk to this site. The access key (k) is checked by Apps Script.
// Paste the web app address (ending /exec) below, or set it in Azure: Static Web App > Environment variables > TELEMETRY_URL.
const DEFAULT_URL = 'PASTE_TELEMETRY_WEB_APP_URL_ENDING_/exec';
const ALLOWED = ['k']; // the only parameter the page sends

module.exports = async function (context, req) {
  const target = process.env.TELEMETRY_URL || DEFAULT_URL;
  if (!/^https:\/\/script\.google\.com\//.test(target)) {
    context.res = { status: 500, body: JSON.stringify({ error: 'The relay has no web app address yet' }),
      headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } };
    return;
  }
  const url = new URL(target);
  ALLOWED.forEach(function (p) { const v = req.query && req.query[p]; if (v != null && v !== '') url.searchParams.set(p, String(v).slice(0, 200)); });
  try {
    const r = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(40000) });
    context.res = { status: r.status, body: await r.text(),
      headers: { 'content-type': r.headers.get('content-type') || 'application/json; charset=utf-8', 'cache-control': 'no-store' } };
  } catch (e) {
    context.log.error('Relay failed: ' + (e && e.message || e));
    context.res = { status: 502, body: JSON.stringify({ error: 'Could not reach the data source' }),
      headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } };
  }
};
