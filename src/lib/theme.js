// Theme CSS. The build inlines it into every page (one HTML file per page on Apps Script).
//   themes/<name>/tokens.css      colour, type and spacing tokens, light + dark
//   themes/<name>/base.css        reset, prose, header, breadcrumbs, layout, footer
//   themes/<name>/components.css  boxes, rows, tables, listicle items, forms, charts
//   themes/<name>/layouts.css     the "landing" and "article" page layouts (meta.layout)
//   sites/<site>/theme.css        optional per-site overrides, inlined last
// site.json theme.accent sets --accent after the tokens, so one line changes the site colour.
import fs from "node:fs";
import path from "node:path";
import { ROOT, sitePaths } from "./project.js";

const FILES = ["tokens.css", "base.css", "components.css", "layouts.css"];

export function themeDir(name) {
  return path.join(ROOT, "themes", name || "default");
}

// Keep view-source readable: drop comments, indentation and blank lines. No real minifier needed.
function tidy(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .join("\n");
}

export function themeCss(site) {
  const dir = themeDir(site.theme.name);
  if (!fs.existsSync(dir)) throw new Error(`Theme "${site.theme.name}" not found: themes/${site.theme.name}/ is missing`);
  const parts = FILES.map((f) => {
    const file = path.join(dir, f);
    return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  });
  parts.push(`:root{--accent:${site.theme.accent}}`);
  const override = path.join(sitePaths(site._name || "").dir, "theme.css");
  if (site._name && fs.existsSync(override)) parts.push(fs.readFileSync(override, "utf8"));
  return tidy(parts.join("\n"));
}

// Optional web fonts: site.json theme.fontsUrl (every page) and theme.serifFontsUrl (pages with
// "layout": "article" only; it sets --font-serif for the headings). Google Fonts works as a <link>
// on both targets, including inside the Apps Script iframe (checked 2026-10-07 with a Google Font).
export function fontLinks(site, { serif = false } = {}) {
  const urls = [site.theme.fontsUrl, serif ? site.theme.serifFontsUrl : ""].filter(Boolean);
  const origins = new Set();
  const links = [];
  for (const url of urls) {
    try { origins.add(new URL(url).origin); } catch { continue; }
    links.push(`<link rel="stylesheet" href="${url.replace(/"/g, "&quot;")}">`);
  }
  if (!links.length) return "";
  return [...[...origins].map((o) => `<link rel="preconnect" href="${o}" crossorigin>`), ...links].join("\n");
}
