// Paths, CLI flags, .env loading and reading/writing site files.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SiteSchema, MetaSchema, BriefSchema } from "./schema.js";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

export function args(argv = process.argv.slice(2)) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) { out._.push(a); continue; }
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith("--")) out[key] = true;
    else { out[key] = next; i++; }
  }
  return out;
}

export function loadEnv() {
  const file = path.join(ROOT, ".env");
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

export function fail(msg) {
  console.error(`\n✖ ${msg}\n`);
  process.exit(1);
}

export function slugify(s) {
  return String(s).toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_-]+/g, "-");
}

export const today = () => new Date().toISOString().slice(0, 10);

export function sitePaths(site) {
  const dir = path.join(ROOT, "sites", site);
  return {
    dir,
    config: path.join(dir, "site.json"),
    pages: path.join(dir, "pages"),
    briefs: path.join(dir, "briefs"),
    research: path.join(dir, "research"),
    dist: path.join(ROOT, "dist", site),
  };
}

export function siteName(flags) {
  const site = flags.site || process.env.SITE;
  if (!site) fail('Pass a site, e.g. "--site blog". Sites live in sites/<name>/.');
  if (!fs.existsSync(sitePaths(site).config)) fail(`No site config at sites/${site}/site.json.`);
  return site;
}

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
export const writeJson = (file, data) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
};

export function loadSite(site) {
  const file = sitePaths(site).config;
  const parsed = SiteSchema.safeParse(readJson(file));
  if (!parsed.success) fail(`sites/${site}/site.json is invalid:\n${parsed.error.message}`);
  const dup = parsed.data.hubs.map((h) => h.slug).filter((s, i, a) => a.indexOf(s) !== i);
  if (dup.length) fail(`sites/${site}/site.json has duplicate hub slugs: ${dup.join(", ")}`);
  const bad = parsed.data.hubs.filter((h) => RESERVED.has(h.slug) || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(h.slug));
  if (bad.length) fail(`sites/${site}/site.json hub slugs must be lowercase-with-hyphens and not reserved: ${bad.map((h) => h.slug).join(", ")}`);
  // _name lets the theme loader find sites/<site>/theme.css. It is not part of the schema.
  Object.defineProperty(parsed.data, "_name", { value: site, enumerable: false });
  return parsed.data;
}

export function saveSite(site, data) {
  writeJson(sitePaths(site).config, data);
}

// Slugs the site shell uses itself. Hub slugs from site.json are reserved too.
// "sitemap.xml" and "sitemap-xml" are the XML sitemap on Apps Script (?page=sitemap.xml).
export const RESERVED = new Set(["guides", "about", "sitemap", "sitemap-xml", "sitemap.xml", "styleguide", "templates"]);

// Each page is a folder: pages/<slug>/ with meta.json + page.html (freeform HTML).
// Returns [{ slug, dir, kind, meta, html?, data?, error? }].
export function loadPages(site) {
  const root = sitePaths(site).pages;
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort().map((slug) => {
    const dir = path.join(root, slug);
    const has = (f) => fs.existsSync(path.join(dir, f));
    try {
      if (!has("meta.json") || !has("page.html")) return { slug, dir, error: "needs meta.json + page.html" };
      const parsed = MetaSchema.safeParse(readJson(path.join(dir, "meta.json")));
      if (!parsed.success) return { slug, dir, error: `meta.json is invalid:\n${parsed.error.message}` };
      return { slug, dir, kind: "html", meta: parsed.data, html: fs.readFileSync(path.join(dir, "page.html"), "utf8") };
    } catch (e) {
      return { slug, dir, error: `Not valid JSON: ${e.message}` };
    }
  });
}

export function loadAbout(site) {
  const file = path.join(sitePaths(site).dir, "about.html");
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
}

// Optional hub intro: sites/<site>/hubs/<slug>.html (an HTML fragment shown under the hub description).
export function loadHubIntro(site, slug) {
  const file = path.join(sitePaths(site).dir, "hubs", `${slug}.html`);
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
}

export function loadBrief(site, slug) {
  const file = path.join(sitePaths(site).briefs, `${slug}.json`);
  if (!fs.existsSync(file)) fail(`No brief at sites/${site}/briefs/${slug}.json. Create one with "npm run new".`);
  const parsed = BriefSchema.safeParse(readJson(file));
  if (!parsed.success) fail(`Brief ${slug} is invalid:\n${parsed.error.message}`);
  return parsed.data;
}

// The public /exec URL the kit writes everywhere. With appsScript.urlDomain set (default "viral") it is
// the /a/<urlDomain>/ form, which is the form Google indexes. Both forms serve the same page.
export function execUrl(siteConfig) {
  const id = siteConfig.appsScript.deploymentId;
  if (!id) return "";
  const domain = siteConfig.appsScript.urlDomain;
  return domain ? `https://script.google.com/a/${domain}/macros/s/${id}/exec` : shortExecUrl(siteConfig);
}

// The original short form that clasp and the Apps Script editor show. Same page.
export function shortExecUrl(siteConfig) {
  const id = siteConfig.appsScript.deploymentId;
  return id ? `https://script.google.com/macros/s/${id}/exec` : "";
}
