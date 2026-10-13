// Quality checks. Errors block publishing. Warnings are for the reviewer.
const isHttps = (u) => /^https:\/\/[^\s]+$/.test(u);

function checkDate(updated, err) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(updated) || Number.isNaN(Date.parse(updated))) err(`updated "${updated}" must be a real date, YYYY-MM-DD`);
  else if (Date.parse(updated) > Date.now() + 86400000) err("updated is in the future. Do not fake freshness");
}

function checkText(text, err, warn) {
  const lower = text.toLowerCase();
  for (const phrase of ["lorem ipsum", "todo(", "todo:", "[insert", "placeholder text"]) {
    if (lower.includes(phrase)) err(`contains "${phrase}". Replace it with real content`);
  }
  // Writer placeholders from templates/*.html look like [[Product name]].
  const left = text.match(/\[\[[^\]]{1,200}\]\]/g);
  if (left) err(`template placeholders left in: ${[...new Set(left)].slice(0, 5).join(", ")}`);
  if (/\b\d(\.\d)?\s*\/\s*5\b|\b\d(\.\d)?\s*stars?\b/.test(lower)) warn("mentions ratings or stars. Keep them only if a source supports them");
}

// Patterns that would show crawlers and people different things. The kit does not allow them.
const CLOAK_PATTERNS = [
  [/navigator\.userAgent/i, "reads navigator.userAgent"],
  [/navigator\.webdriver/i, "reads navigator.webdriver (bot detection)"],
  [/googlebot|bingbot|gptbot|perplexitybot|claudebot/i, "names a crawler"],
  [/(window\.|document\.|top\.)?location(\.href)?\s*=(?!=)/i, "changes location (redirect)"],
  [/location\.(replace|assign)\s*\(/i, "redirects with location.replace/assign"],
  [/http-equiv\s*=\s*["']?refresh/i, "meta refresh redirect"],
  [/<iframe[^>]+src\s*=\s*["']?https?:/i, "embeds another site in an iframe"],
  [/window\.open\s*\(/i, "opens a window by script"],
];

export function lintHtml(html, meta, site) {
  const errors = [];
  const warnings = [];
  const err = (m) => errors.push(m);
  const warn = (m) => warnings.push(m);

  const h1s = (html.match(/<h1[\s>]/gi) || []).length;
  if (h1s !== 1) err(`page.html needs exactly one <h1> (found ${h1s})`);
  if (/<\/?(html|head|body)[\s>]/i.test(html)) err("page.html is a fragment: remove <html>, <head> and <body> tags");
  // Script patterns are checked inside <script> and on* handlers only, so articles can still mention Googlebot.
  const code = [...(html.match(/<script[\s\S]*?<\/script>/gi) || []), ...(html.match(/\son\w+\s*=\s*["'][^"']*["']/gi) || [])].join("\n");
  for (const [re, label] of CLOAK_PATTERNS) {
    const markup = /refresh|iframe/.test(label);
    if (re.test(markup ? html : code)) err(`not allowed: ${label}`);
  }
  const text = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ");
  const words = text.split(/\s+/).filter(Boolean).length;
  if (words < 300) warn(`only ${words} words of visible text`);
  const kb = Buffer.byteLength(html) / 1024;
  if (kb > 250) warn(`page.html is ${Math.round(kb)} KB; keep pages small`);
  if (/<script[^>]+src=/i.test(html) && !/cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|unpkg\.com/i.test(html)) warn("loads a script from an unusual host");
  const scriptText = (html.match(/<script(?![^>]*ld\+json)[\s\S]*?<\/script>/gi) || []).join("").length;
  if (scriptText > 0 && words < 600 && meta.type !== "tool") warn("the page relies on scripts; keep the main text in plain HTML so every crawler can read it");
  const links = html.match(/href\s*=\s*["'](https?:[^"']+)/gi) || [];
  const internal = (html.match(/\{\{(link:[a-z0-9-]+|cta_url|brand_url|utm:[^}]+)\}\}/g) || []).length;
  if (!links.length && !internal) warn("no links: cite your sources and link to related pages");
  // The disclosure is optional. When the site has one, a page that names the brand must show it.
  if (site.disclosure.trim() && !meta.ownProduct && site.brand.name && text.toLowerCase().includes(site.brand.name.toLowerCase())) err(`the page names ${site.brand.name}: set "ownProduct": true so the disclosure shows`);
  for (const m of checkOwnLinks(html, site)) err(m);
  checkText(text, err, warn);
  return { errors, warnings, words };
}

// What counts as the owner's own link: any host in site.json ownDomains (www. ignored), plus any
// URL that starts with brand.url or cta.url (so a shared host like example.com is not all "own").
const stripWww = (h) => h.toLowerCase().replace(/^www\./, "");
export function isOwnLink(url, site) {
  let u;
  try { u = new URL(url); } catch { return false; }
  if ((site.ownDomains || []).some((h) => stripWww(h) === stripWww(u.hostname))) return true;
  const norm = (s) => { try { const x = new URL(s); return stripWww(x.hostname) + x.pathname.replace(/\/+$/, ""); } catch { return ""; } };
  const mine = norm(url);
  return [site.brand?.url, site.cta?.url].map(norm).some((p) => p && (mine === p || mine.startsWith(p + "/")));
}

// Every link to your own product must go through {{utm:https://…}}, {{cta_url}} or {{brand_url}},
// so analytics can tell the Apps Script version from the static one. A plain href is an error.
export function checkOwnLinks(html, site) {
  const bad = new Set();
  for (const m of html.matchAll(/href\s*=\s*["']\s*(https?:\/\/[^"'\s]+)/gi)) if (isOwnLink(m[1], site)) bad.add(m[1]);
  return [...bad].map((u) => `link to your own product without UTM tags: ${u}. Write it as href="{{utm:${u}}}" (or use {{cta_url}} / {{brand_url}})`);
}

// Internal link placeholders in page.html: every target must exist, and a page should link to at least one other page.
export function checkLinks(html, slug, { pageSlugs, hubSlugs }) {
  const errors = [];
  const warnings = [];
  const links = [...html.matchAll(/\{\{link:([a-z0-9-]+)\}\}/g)].map((m) => m[1]);
  const hubs = [...html.matchAll(/\{\{hub:([a-z0-9-]+)\}\}/g)].map((m) => m[1]);
  for (const t of new Set(links)) if (!pageSlugs.has(t)) errors.push(`{{link:${t}}} points to a page that does not exist`);
  for (const t of new Set(hubs)) if (!hubSlugs.has(t)) errors.push(`{{hub:${t}}} points to a hub that is not in site.json`);
  if (links.includes(slug)) warnings.push("the page links to itself with {{link:...}}");
  const others = links.filter((t) => t !== slug);
  if (!others.length && pageSlugs.size > 1) warnings.push("no {{link:<slug>}} to another page. Add 1-3 links in the text; they help readers and crawlers");
  return { errors, warnings };
}

export function checkMeta(meta) {
  const errors = [];
  const warnings = [];
  if (meta.title.length > 60) warnings.push(`title is ${meta.title.length} characters; Google usually cuts titles near 60`);
  if (meta.description.length > 160) warnings.push(`description is ${meta.description.length} characters; keep it under 155`);
  const first = meta.keyword.toLowerCase().split(" ")[0];
  if (!meta.title.toLowerCase().includes(first)) warnings.push("title does not seem to contain the keyword");
  checkDate(meta.updated, (m) => errors.push(m));
  return { errors, warnings };
}
