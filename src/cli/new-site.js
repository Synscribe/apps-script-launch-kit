// npm run new-site -- --name <site> [--mode hub|single|site] [--brand "Name"] [--brand-url https://…]
//   Default mode: hub. A new site starts with the warm paper theme (templates/theme-warm.css).
// npm run new-site -- --name <site> [--mode site|hub|single] --from <existing-site>
// npm run new-site -- --name <site> --mode single --layout landing|article [--slug <slug>]
//   --layout also writes a starter page (pages/<slug>/) from templates/landing.html or
//   templates/blog-article.html with "layout" set in meta.json. Replace every [[placeholder]].
// Creates sites/<site>/ with a site.json you then edit. Each site is its own Apps Script project and URL.
//
// --from <site> copies an existing site's setup: site.json (brand, CTA, navCta, ownDomains, theme,
// disclosure, author, home copy), theme.css and RULES.md. It copies no pages, briefs or research.
// It clears scriptId and deploymentId (the new site gets its own Apps Script project) and sets a
// new utm.campaign and projectTitle, so clicks from the new site are counted apart.
import fs from "node:fs";
import path from "node:path";
import { args, fail, slugify, sitePaths, writeJson, loadSite, ROOT, today } from "../lib/project.js";

const LAYOUT_TEMPLATES = { landing: "landing.html", article: "blog-article.html", guide: "top-n.html" };

const flags = args();
if (!flags.name || flags.name === true) fail('Pass a site name, e.g. --name best-geo-course --mode single.');
const name = slugify(flags.name);
const paths = sitePaths(name);
if (fs.existsSync(paths.dir)) fail(`sites/${name}/ already exists.`);
const from = flags.from && flags.from !== true ? flags.from : "";
if (flags.from === true) fail("Pass the site to copy, e.g. --from blog.");
if (from && !fs.existsSync(sitePaths(from).config)) fail(`No site to copy at sites/${from}/site.json.`);
const layout = flags.layout && flags.layout !== true ? flags.layout : "";
if (flags.layout === true || (layout && !LAYOUT_TEMPLATES[layout])) fail('--layout must be "landing", "article" or "guide".');

let mode;
let config;
const copied = [];

if (from) {
  const src = loadSite(from);
  mode = flags.mode && flags.mode !== true ? flags.mode : src.mode;
  if (!["site", "hub", "single"].includes(mode)) fail('--mode must be "site", "hub" or "single".');
  config = JSON.parse(JSON.stringify(src));
  config.mode = mode;
  config.appsScript = { ...config.appsScript, projectTitle: name, scriptId: "", deploymentId: "" };
  config.utm = { ...config.utm, campaign: name };
  config.static = { baseUrl: "" };
  config.hubs = [];
  if (mode === "single") config.name = "Your site name";
  config.home = { title: "Home page title", headline: "Home page headline", intro: "Two short sentences about the site." };
  for (const f of ["theme.css", "RULES.md"]) {
    const file = path.join(sitePaths(from).dir, f);
    if (fs.existsSync(file)) {
      fs.mkdirSync(paths.dir, { recursive: true });
      fs.copyFileSync(file, path.join(paths.dir, f));
      copied.push(f);
    }
  }
} else {
  mode = flags.mode && flags.mode !== true ? flags.mode : "hub";
  if (!["site", "hub", "single"].includes(mode)) fail('--mode must be "site", "hub" or "single".');
  const brand = flags.brand && flags.brand !== true ? flags.brand : "Your product";
  const brandUrl = flags["brand-url"] && flags["brand-url"] !== true ? flags["brand-url"] : "https://example.com/";
  config = {
    mode,
    name: mode === "single" ? "Your site name" : "Your Guides",
    tagline: "One line about what this site covers.",
    language: "en",
    brand: { name: brand, url: brandUrl },
    author: { name: "", url: "", bio: "" },
    // Optional. Leave "" for no disclosure line. Fill it if the site's rules want one.
    disclosure: "",
    ownDomains: (() => { try { const h = new URL(brandUrl).hostname.replace(/^www\./, ""); return [h, `www.${h}`]; } catch { return []; } })(),
    navCta: { label: `Visit ${brand}`, url: brandUrl },
    cta: { label: `Visit ${brand}`, url: brandUrl, text: `One sentence about what ${brand} does.`, sticky: true },
    home: { title: "Home page title", headline: "Home page headline", intro: "Two short sentences about the site." },
    static: { baseUrl: "" },
    appsScript: { projectTitle: name, scriptId: "", deploymentId: "", urlDomain: "viral", timeZone: "Etc/UTC", urlStyle: "query" },
    utm: { medium: "listicle", campaign: name },
    // The look of the sites we launched: warm paper theme, Instrument Sans, light only.
    theme: { name: "default", accent: "#41603a", scheme: "light", fontsUrl: "https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400..700;1,400..700&display=swap", serifFontsUrl: "https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,500..700;1,6..72,400&display=swap" },
    hubs: [],
  };
}

writeJson(paths.config, config);
if (!from && !fs.existsSync(path.join(paths.dir, "theme.css"))) fs.copyFileSync(path.join(ROOT, "templates", "theme-warm.css"), path.join(paths.dir, "theme.css"));
for (const d of [paths.pages, paths.briefs, paths.research]) fs.mkdirSync(d, { recursive: true });
if (mode === "site" && !fs.existsSync(path.join(paths.dir, "about.html"))) fs.writeFileSync(path.join(paths.dir, "about.html"), "<h1>About</h1>\n<p>Who writes these pages and how you check facts.</p>\n");

// Starter page from a template. The folder name does not show in the URL of a single site, but
// it is the page key in hub and site modes, so pick a slug from the keyword when you can.
let starter = "";
if (layout) {
  const slug = slugify(flags.slug && flags.slug !== true ? flags.slug : { landing: "landing-page", article: "article", guide: "guide" }[layout]);
  const dir = path.join(paths.pages, slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(path.join(ROOT, "templates", LAYOUT_TEMPLATES[layout]), path.join(dir, "page.html"));
  writeJson(path.join(dir, "meta.json"), {
    title: "Page title with the keyword, 60 characters or less",
    description: "One or two sentences for the static site's meta description, 155 characters or less.",
    keyword: "the search query",
    status: "draft",
    updated: today(),
    ownProduct: true,
    featured: false,
    type: layout === "landing" ? "guide" : "comparison",
    layout,
    hub: "",
    related: [],
  });
  starter = `sites/${name}/pages/${slug}/`;
}

const next = {
  single: "Write exactly one page (it becomes the whole site, at the bare /exec URL).",
  hub: "Write a few pages. The home page lists them all; each page footer links to the others and to the XML sitemap.",
  site: "Write pages and add hubs (topics) in site.json.",
}[mode];
console.log(`Created sites/${name}/ (mode: ${mode})${from ? ` from sites/${from}/ (copied site.json${copied.length ? ", " + copied.join(", ") : ""}; no pages; IDs cleared)` : ""}.
Edit ${path.relative(ROOT, paths.config)}: name, tagline, home copy${from ? "" : ", brand, CTA, ownDomains, theme"}.
${copied.includes("RULES.md") ? `Update the "This site" part of sites/${name}/RULES.md. Read the rest before you write: it overrides prompts/writing-rules.md.\n` : ""}${next}${starter ? `
Starter page: ${starter} (layout "${layout}", from templates/${LAYOUT_TEMPLATES[layout]}). Fill meta.json and replace every [[placeholder]] in page.html.` : ""}
  npm run new -- --site ${name} --keyword "<keyword>"
  npm run dev -- --site ${name}
  npm run as:init -- --site ${name}   then   npm run as:deploy -- --site ${name}`);
