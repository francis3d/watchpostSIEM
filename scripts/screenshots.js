// Regenerates the UI screenshots in docs/screenshots/ (see docs/UI_TOUR.md).
//
// Not part of the app or the test suite, and not a project dependency: it needs Node 18+ and Playwright,
// installed anywhere outside the repo, e.g.
//   mkdir /tmp/shots && cd /tmp/shots && npm i playwright && npx playwright install chromium
//   NODE_PATH=/tmp/shots/node_modules node scripts/screenshots.js /tmp/shots/out
//
// Point it at a FRESH Watchpost started with known passwords and rate limiting off, for example:
//   SIEM_DB=/tmp/shots.db SIEM_PORT=8099 SIEM_RATE_LIMIT=0 SIEM_ADMIN_PASSWORD=... SIEM_VIEWER_PASSWORD=... ./start.sh
// It loads the demo data, runs the storyline at real speed (about 2.5 minutes), makes a few analyst changes so
// every view has something to show, then captures each view at 1280x800 (2x) plus two phone-width views.
// Optional env: WATCHPOST_URL, WATCHPOST_ADMIN_PASSWORD, WATCHPOST_VIEWER_PASSWORD, CHROMIUM_PATH.
const { chromium } = require("playwright");
const fs = require("fs");

const BASE = process.env.WATCHPOST_URL || "http://127.0.0.1:8099";
const ADMIN_PW = process.env.WATCHPOST_ADMIN_PASSWORD;
const VIEWER_PW = process.env.WATCHPOST_VIEWER_PASSWORD;
const OUT = process.argv[2];
if (!OUT || !ADMIN_PW || !VIEWER_PW) {
  console.error("usage: WATCHPOST_ADMIN_PASSWORD=... WATCHPOST_VIEWER_PASSWORD=... node scripts/screenshots.js OUT_DIR");
  process.exit(2);
}
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const errors = [];

async function login(page, user, pass) {
  await page.goto(BASE + "/");
  await page.waitForSelector("#login-form");
  await page.fill("input[name=username]", user);
  await page.fill("input[name=password]", pass);
  await page.click("#login-form button[type=submit]");
  await page.waitForSelector("#rail:not([hidden])");
  return (await (await page.request.get(BASE + "/api/auth/me")).json()).csrf_token;
}

async function api(page, csrf, method, path, body) {
  const r = await page.request.fetch(BASE + path, {
    method, headers: { "X-CSRF-Token": csrf, "Content-Type": "application/json" },
    data: body ? JSON.stringify(body) : undefined,
  });
  if (r.status() >= 400) throw new Error(`${method} ${path} -> ${r.status()} ${await r.text()}`);
  return r.json();
}

async function shot(page, name, hash, wait = 2500) {
  if (hash) await page.evaluate((h) => { location.hash = h; }, hash);
  await sleep(wait);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log("saved", name);
}

async function newPage(browser, who, opts) {
  const page = await (await browser.newContext({ colorScheme: "dark", ...opts })).newPage();
  page.on("pageerror", (e) => errors.push(`${who}: ${e.message}`));
  page.on("console", (m) => { if (m.type() === "error" && !/401/.test(m.text())) errors.push(`${who}: ${m.text()}`); });
  return page;
}

(async () => {
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const desktop = { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 };
  const page = await newPage(browser, "admin", desktop);

  await page.goto(BASE + "/");
  await page.waitForSelector("#login-form");
  await shot(page, "login", null, 500);

  // Demo data, then the live storyline captured mid-run (the stage tile reads foothold/escalation).
  const csrf = await login(page, "admin", ADMIN_PW);
  await api(page, csrf, "POST", "/api/demo/load", {});
  await api(page, csrf, "POST", "/api/storyline/start", { speed: 1 });
  await page.evaluate(() => { location.hash = "dashboard"; });
  await sleep(64000);
  await shot(page, "storyline-running", null, 0);
  await shot(page, "admin", "admin", 2000);
  while ((await (await page.request.get(BASE + "/api/storyline/status")).json()).running) await sleep(2000);

  // Analyst activity so each view shows real states: triage, notes, verdicts, a proposal, an evaluation.
  const incidents = await api(page, csrf, "GET", "/api/incidents");
  const story = incidents.filter((i) => /203\.0\.113\.80/.test(JSON.stringify(i.entities) + i.title))
    .sort((a, b) => b.stages.length - a.stages.length)[0];
  await api(page, csrf, "POST", `/api/incidents/${story.id}/status`,
    { status: "investigating", note: "Multi-stage intrusion confirmed; containing dave and svc-deploy-tmp." });
  const alerts = await api(page, csrf, "GET", "/api/alerts?limit=200");
  const esc = alerts.find((a) => a.rule_id === "privilege_escalation_after_login" && /dave/.test(a.title));
  await api(page, csrf, "POST", `/api/alerts/${esc.id}/status`, { status: "investigating" });
  await api(page, csrf, "POST", `/api/alerts/${esc.id}/notes`,
    { body: "Sudo to root on web01 three minutes after the VPN login from 203.0.113.80. Session killed, dave's credentials reset." });
  await api(page, csrf, "POST", `/api/alerts/${esc.id}/notes`,
    { body: "Escalated to incident; pulling auditd process records for the TTY session." });
  for (const a of alerts.filter((a) => /svc_scan/.test(a.title + JSON.stringify(a.group_key || "")))) {
    await api(page, csrf, "POST", `/api/alerts/${a.id}/status`,
      { status: "resolved", disposition: "false_positive", note: "Authorized internal scanner (svc_scan from 10.0.50.5)." });
  }
  const bf = alerts.find((a) => a.rule_id === "brute_force_ip" && /203\.0\.113\.45/.test(a.title));
  if (bf) await api(page, csrf, "POST", `/api/alerts/${bf.id}/status`, { status: "resolved", disposition: "true_positive" });
  await api(page, csrf, "POST", "/api/rules/suggestions", {});
  await api(page, csrf, "POST", "/api/evaluations", {});

  await shot(page, "dashboard", "dashboard", 4000);
  await page.evaluate(() => { window.scrollTo(0, document.body.scrollHeight); });
  await shot(page, "dashboard-board", null, 1200);
  await page.evaluate(() => { window.scrollTo(0, 0); });
  await shot(page, "incidents-board", "incidents", 3000);
  await shot(page, "incident-detail", `incidents/${story.id}`);
  await shot(page, "alerts", "alerts");
  await shot(page, "alert-detail", `alerts/${esc.id}`);
  await shot(page, "events", "events");
  await page.click("#view table tbody tr");
  await shot(page, "event-detail", null, 1500);
  await page.keyboard.press("Escape");
  await shot(page, "metrics", "overview");
  await shot(page, "ingest", "ingest");
  await shot(page, "rules-review", "rules");
  await shot(page, "health", "health");
  const pdf = await page.request.get(`${BASE}/api/incidents/${story.id}/report.pdf`);
  fs.writeFileSync(`${OUT}/incident-report.pdf`, await pdf.body());
  console.log("saved incident-report.pdf");

  const viewer = await newPage(browser, "viewer", desktop);
  await login(viewer, "viewer", VIEWER_PW);
  await shot(viewer, "viewer-read-only", `incidents/${story.id}`, 3000);

  const phone = await newPage(browser, "phone",
    { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await login(phone, "viewer", VIEWER_PW);
  await shot(phone, "mobile-dashboard", "dashboard", 4000);
  await shot(phone, "mobile-incident", `incidents/${story.id}`);

  await browser.close();
  if (errors.length) { console.error("page errors:\n" + errors.join("\n")); process.exit(1); }
})();
