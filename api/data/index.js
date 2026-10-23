// MOT dashboard data relay (Azure Static Web Apps managed function, served at /api/data).
// Passes the page's request on to the Apps Script web app from Azure's servers and returns the answer unchanged,
// so the viewer's browser only ever talks to this site. The access key (k) is checked by Apps Script as before.
// The web app address can be changed in Azure: Static Web App > Environment variables > APPS_SCRIPT_URL.
const DEFAULT_URL = 'https://script.google.com/macros/s/AKfycbxXVV6KU5LthNMI5rnWDi4axt0xYcUMqQ71hRzukFBy1hMNhzc562dOJZ3kJXL9USIV4g/exec';
const ALLOWED = ['k', 'format', 'export', 'from', 'to']; // the only parameters the page sends

module.exports = async function (context, req) {
  const url = new URL(process.env.APPS_SCRIPT_URL || DEFAULT_URL);
  ALLOWED.forEach(function (p) { const v = req.query && req.query[p]; if (v != null && v !== '') url.searchParams.set(p, String(v).slice(0, 200)); });
  try {
    const r = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(40000) });
    context.res = { status: r.status, body: await r.text(),
      headers: { 'content-type': r.headers.get('content-type') || 'text/plain; charset=utf-8', 'cache-control': 'no-store' } };
  } catch (e) {
    context.log.error('Relay failed: ' + (e && e.message || e));
    context.res = { status: 502, body: 'Could not reach the data source', headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' } };
  }
};
