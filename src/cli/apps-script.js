// Apps Script commands. All of them call Google's official CLI, clasp.
//   npm run as:init   -- --site <name>   create the Apps Script project, save its scriptId
//   npm run as:push   -- --site <name>   build and upload files (test them at the /dev URL)
//   npm run as:deploy -- --site <name>   build, upload and publish. Keeps the same /exec URL every time
//   npm run as:urls   -- --site <name>   print the public URLs, the XML sitemap URL and any skipped drafts
// Add --drafts to push/deploy/list draft pages too (only for a test; normally only approved pages go live).
// Add --user <name> to use a named Google login (npx clasp login --user <name>).
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { args, siteName, loadSite, saveSite, sitePaths, loadPages, fail, ROOT, execUrl, shortExecUrl } from "../lib/project.js";
import { build, sitePagesFor } from "../lib/build.js";
import { href } from "../lib/render.js";

const flags = args();
const command = flags._[0];
const site = siteName(flags);
const CLASP = path.join(ROOT, "node_modules", ".bin", "clasp");

function clasp(claspArgs, cwd, { capture = false } = {}) {
  if (!fs.existsSync(CLASP)) fail('clasp is not installed. Run "npm install".');
  // --user <name> picks a named clasp login, so one machine can manage several Google accounts.
  if (flags.user && flags.user !== true) claspArgs = ["--user", flags.user, ...claspArgs];
  const r = spawnSync(CLASP, claspArgs, { cwd, encoding: "utf8", stdio: capture ? ["inherit", "pipe", "inherit"] : "inherit" });
  if (r.status !== 0) {
    fail(`clasp ${claspArgs.join(" ")} failed.${capture && r.stdout ? `\n${r.stdout}` : ""}
Check: you ran "npm run as:login", the Apps Script API is ON at https://script.google.com/home/usersettings,
and you are logged in with the Google account that owns this project.`);
  }
  return r.stdout || "";
}

const lastJson = (out) => {
  const m = out.match(/\{[\s\S]*\}\s*$/);
  if (!m) fail(`Could not read clasp output:\n${out}`);
  return JSON.parse(m[0]);
};

function buildOrFail() {
  try {
    const r = build(site, { includeDrafts: Boolean(flags.drafts) });
    if (!r.pages.length) fail(`No approved pages for "${site}". Set "status": "approved" after review, or pass --drafts.`);
    return r;
  } catch (e) {
    fail(e.message);
  }
}

function init() {
  const config = loadSite(site);
  if (config.appsScript.scriptId) fail(`sites/${site}/site.json already has a scriptId (${config.appsScript.scriptId}).`);
  const tmp = path.join(sitePaths(site).dist, "_init");
  fs.rmSync(tmp, { recursive: true, force: true });
  fs.mkdirSync(tmp, { recursive: true });
  clasp(["create-script", "--type", "webapp", "--title", config.appsScript.projectTitle || config.name], tmp);
  const claspFile = path.join(tmp, ".clasp.json");
  if (!fs.existsSync(claspFile)) fail("clasp did not create .clasp.json.");
  const { scriptId } = JSON.parse(fs.readFileSync(claspFile, "utf8"));
  config.appsScript.scriptId = scriptId;
  saveSite(site, config);
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`\n✔ Created Apps Script project. scriptId saved to sites/${site}/site.json.
  Editor: https://script.google.com/d/${scriptId}/edit
  Next: npm run as:deploy -- --site ${site}`);
}

function push() {
  const config = loadSite(site);
  if (!config.appsScript.scriptId) fail(`Run "npm run as:init -- --site ${site}" first.`);
  const r = buildOrFail();
  clasp(["push", "--force"], r.asDir);
  // The /dev URL belongs to the @HEAD deployment (the one with no version), not to the scriptId.
  const list = JSON.parse(clasp(["--json", "list-deployments"], r.asDir, { capture: true }).match(/\[[\s\S]*\]\s*$/)?.[0] || "[]");
  const head = list.find((d) => d.versionNumber === undefined);
  console.log(`\n✔ Pushed ${r.pages.length} page(s).`);
  if (r.skipped) console.log(`  ⚠ Skipped ${r.skipped} draft page(s). Only "status": "approved" pages are published.`);
  if (head) console.log(`  Private test URL (works only when signed in as the owner, never share it):\n  https://script.google.com/macros/s/${head.deploymentId}/dev`);
  return r;
}

function deploy() {
  let config = loadSite(site);
  if (!config.appsScript.scriptId) fail(`Run "npm run as:init -- --site ${site}" first.`);
  const description = `${new Date().toISOString()} apps-script-launch-kit`;

  if (!config.appsScript.deploymentId) {
    // First deploy: create the deployment to get its /exec URL, then rebuild so internal links use it.
    const r = push();
    const out = clasp(["--json", "create-deployment", "--description", description], r.asDir, { capture: true });
    config = loadSite(site);
    config.appsScript.deploymentId = lastJson(out).deploymentId;
    saveSite(site, config);
    console.log(`\n✔ Created deployment ${config.appsScript.deploymentId}. Rebuilding with the real URL…`);
  }

  const r = push();
  const out = clasp(["--json", "update-deployment", config.appsScript.deploymentId, "--description", description], r.asDir, { capture: true });
  const { versionNumber } = lastJson(out);
  console.log(`\n✔ Published version ${versionNumber}. PUBLIC URLs (share these):`);
  urls();
}

function urls() {
  const config = loadSite(site);
  const base = execUrl(config);
  if (!base) fail(`No deployment yet. Run "npm run as:deploy -- --site ${site}".`);
  // List exactly the pages this site serves (depends on its mode).
  const { entries, pages, skipped } = sitePagesFor(site, { includeDrafts: Boolean(flags.drafts) });
  const ctx = { site: config, target: "apps-script", pages: [], slug: "" };
  const short = shortExecUrl(config);
  console.log(`  mode: ${config.mode}`);
  if (base !== short) console.log(`  url form: /a/${config.appsScript.urlDomain}/ (the form Google indexes; site.json appsScript.urlDomain)`);
  for (const e of entries) console.log(`  ${e.key || "home"}: ${href(ctx, e.key)}`);
  // The XML sitemap. Opening it gives a one-time 302 to script.googleusercontent.com; that is normal.
  // Always share and submit this stable /exec URL, never the redirect target.
  if (config.sitemap !== false) console.log(`  sitemap.xml: ${base}?page=sitemap.xml`);
  else console.log("  sitemap.xml: off (site.json sitemap: false)");
  if (skipped) {
    const drafts = loadPages(site).filter((p) => !p.error && p.meta.status !== "approved").map((p) => p.slug);
    console.log(`\n⚠ ${skipped} draft page(s) are NOT live (set "status": "approved" and deploy again): ${drafts.join(", ")}`);
  }
  if (base !== short) console.log(`\nOriginal short form (same pages, not used in links or the sitemap): ${short}[?page=<slug>]`);
  console.log(`\n${pages.length} page(s) listed. These /exec URLs are public. Never share a /dev URL: it works only for the owner.`);
  console.log(`Open one in a private window to check that anyone can see it without signing in.`);
}

const commands = { init, push, deploy, urls };
if (!commands[command]) fail(`Unknown command "${command}". Use init, push, deploy or urls.`);
commands[command]();
