// npm run build -- --site <name> [--drafts]
import path from "node:path";
import { args, siteName, ROOT, fail } from "../lib/project.js";
import { build } from "../lib/build.js";

const flags = args();
const site = siteName(flags);
try {
  const r = build(site, { includeDrafts: Boolean(flags.drafts) });
  console.log(`Built ${r.pages.length} page(s) for "${site}".`);
  if (r.skipped) console.log(`Skipped ${r.skipped} draft page(s). Set "status": "approved" after review, or pass --drafts.`);
  console.log(`  static:      ${path.relative(ROOT, r.staticDir)}/`);
  console.log(`  apps script: ${path.relative(ROOT, r.asDir)}/`);
  if (!r.execUrl) console.log(`  Note: no Apps Script deployment yet, so links between Apps Script pages are placeholders until "npm run as:deploy".`);
} catch (e) {
  fail(e.message);
}
