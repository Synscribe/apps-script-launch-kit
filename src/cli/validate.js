// npm run validate -- --site <name>
import { args, siteName, loadSite, loadPages, RESERVED } from "../lib/project.js";
import { lintHtml, checkMeta, checkLinks } from "../lib/checks.js";

const flags = args();
const site = siteName(flags);
const config = loadSite(site);
const pages = loadPages(site);

let errorCount = 0;
if (!pages.length) console.log(`No pages in sites/${site}/pages/ yet.`);
const pageSlugs = new Set(pages.filter((p) => !p.error).map((p) => p.slug));
const hubSlugs = new Set(config.hubs.map((h) => h.slug));

for (const p of pages) {
  if (p.error) {
    errorCount++;
    console.log(`\n✖ pages/${p.slug}/\n  ${p.error.replace(/\n/g, "\n  ")}`);
    continue;
  }
  const errors = [];
  const warnings = [];
  const add = (r) => { errors.push(...r.errors); warnings.push(...r.warnings); };
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(p.slug)) errors.push("folder name must be lowercase words joined by hyphens");
  if (RESERVED.has(p.slug)) errors.push(`"${p.slug}" is reserved for the site shell`);
  if (hubSlugs.has(p.slug)) errors.push(`"${p.slug}" is a hub slug in site.json; pick another folder name`);
  if (p.meta.hub && !hubSlugs.has(p.meta.hub)) errors.push(`hub "${p.meta.hub}" is not in site.json hubs (${[...hubSlugs].join(", ") || "none defined"})`);
  if (config.mode === "single" && /\{\{(link|hub):/.test(p.html)) errors.push(`this is a "single" site: there are no other pages, so {{link:…}} and {{hub:…}} cannot resolve`);
  if (config.mode === "hub" && /\{\{hub:/.test(p.html)) errors.push(`this is a "hub" site: it has no hub pages, so {{hub:…}} cannot resolve`);
  if (config.mode !== "site") for (const k of ["guides", "about", "sitemap"]) if (p.html.includes(`{{${k}}}`)) errors.push(`this is a "${config.mode}" site: there is no ${k} page, so {{${k}}} cannot resolve. Use {{home}} instead`);
  if (config.mode === "site" && !p.meta.hub && hubSlugs.size) warnings.push("no hub. Set \"hub\" so the page shows on a topic page and in its breadcrumbs");
  for (const r of p.meta.related) if (!pageSlugs.has(r)) errors.push(`related slug "${r}" does not exist`);
  add(checkMeta(p.meta));
  // Site-specific banned wording (site.json "forbid"), checked on the page text and links.
  for (const rule of config.forbid) { const m = p.html.match(new RegExp(rule.pattern, "i")); if (m) errors.push(`site rule: ${rule.message} (found "${m[0].trim()}")`); }
  let detail = "";
  const r = lintHtml(p.html, p.meta, config);
  add(r);
  const links = checkLinks(p.html, p.slug, { pageSlugs, hubSlugs });
  // In hub and single sites the footer links every page, so a page without in-text links is fine.
  if (config.mode !== "site") links.warnings = links.warnings.filter((w) => !w.startsWith("no {{link"));
  add(links);
  detail = `html, ${r.words} words`;
  errorCount += errors.length;
  console.log(`\n${errors.length ? "✖" : "✔"} pages/${p.slug}/  [${p.meta.status}]  ${p.meta.type}${p.meta.hub ? ` in ${p.meta.hub}` : ""}  "${p.meta.keyword}"  (${detail})`);
  errors.forEach((e) => console.log(`  error: ${e}`));
  warnings.forEach((w) => console.log(`  warn:  ${w}`));
}

const approved = pages.filter((p) => !p.error && p.meta.status === "approved").length;
if (config.mode === "single" && approved !== 1) { errorCount++; console.log(`\n✖ a "single" site needs exactly 1 approved page (found ${approved})`); }
console.log(errorCount ? `\n${errorCount} error(s). Fix them before you publish.\n` : "\nAll pages pass.\n");
process.exit(errorCount ? 1 : 0);
