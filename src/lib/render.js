// HTML rendering. A light website shell (header, nav, breadcrumbs, footer) wraps every page.
// Two targets share the same output:
//   "static"      -> your own domain: full <head>, canonical, meta description
//   "apps-script" -> HtmlService: Google sets the <title>; links open in the top window
//
// Site IA (see docs/design.md):
//   home  ->  hub (topic)  ->  page (guide | comparison | tool)
//   plus: guides (index of every page), about, sitemap
// Every page key is one URL segment: /<key>/ on static, ?page=<key> on Apps Script.
import { execUrl } from "./project.js";
import { themeCss, fontLinks } from "./theme.js";

export const esc = (s) => String(s ?? "")
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// **bold** and [text](https://url). Everything else is escaped.
export function inline(s) {
  return esc(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_, t, u) => `<a href="${u}" rel="noopener">${t}</a>`);
}

export const TYPE_LABEL = { guide: "Guide", comparison: "Comparison", tool: "Tool" };
const TYPE_PLURAL = { comparison: "Comparisons", guide: "Guides", tool: "Tools" };
const TYPE_ORDER = ["comparison", "guide", "tool"];

// ---------- URLs ----------

// key: "" (home), "guides", "about", "sitemap", a hub slug or a page slug. `from` is the current page key.
export function href(ctx, key, from = ctx.slug) {
  if (ctx.target === "apps-script") {
    const base = execUrl(ctx.site);
    if (!base) return "#deploy-first";
    if (!key) return base;
    return ctx.site.appsScript.urlStyle === "path" ? `${base}/${key}` : `${base}?page=${encodeURIComponent(key)}`;
  }
  const root = from ? "../" : "./";
  return key ? `${root}${key}/` : root;
}

// Absolute URL for structured data. Empty when the site has no public URL yet.
function absUrl(ctx, key) {
  if (ctx.target === "apps-script") {
    const u = href(ctx, key);
    return u.startsWith("http") ? u : "";
  }
  const base = ctx.site.static.baseUrl.replace(/\/+$/, "");
  return base ? `${base}/${key ? key + "/" : ""}` : "";
}

export function withUtm(url, ctx, content) {
  try {
    const u = new URL(url);
    u.searchParams.set("utm_source", ctx.target);
    u.searchParams.set("utm_medium", ctx.site.utm.medium);
    u.searchParams.set("utm_campaign", ctx.site.utm.campaign);
    u.searchParams.set("utm_content", content || ctx.slug || "home");
    return u.toString();
  } catch {
    return url;
  }
}

// "2026-10-12" -> "12 October 2026" (the article meta line). Falls back to the raw string.
export function longDate(iso, lang = "en") {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  // Plain "en" means day-month-year ("12 October 2026"); a full tag such as "en-US" keeps its own order.
  try { return d.toLocaleDateString(lang === "en" || !lang ? "en-GB" : lang, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }); } catch { return iso; }
}

// Placeholders that freeform pages can use, so one page.html works on both targets.
// {{updated}} (pages only) becomes <time datetime="…">12 October 2026</time> from meta.updated,
// so the date on the page and in the schema never drift apart.
export function resolve(html, ctx, { updated = "" } = {}) {
  return html
    .replace(/\{\{updated\}\}/g, updated ? `<time datetime="${esc(updated)}">${esc(longDate(updated, ctx.site.language))}</time>` : "")
    .replace(/\{\{link:([a-z0-9-]+)\}\}/g, (_, slug) => href(ctx, slug))
    .replace(/\{\{hub:([a-z0-9-]+)\}\}/g, (_, slug) => href(ctx, slug))
    .replace(/\{\{home\}\}/g, href(ctx, ""))
    .replace(/\{\{guides\}\}/g, href(ctx, "guides"))
    .replace(/\{\{about\}\}/g, href(ctx, "about"))
    .replace(/\{\{sitemap\}\}/g, href(ctx, "sitemap"))
    .replace(/\{\{cta_url\}\}/g, esc(withUtm(ctx.site.cta.url, ctx)))
    .replace(/\{\{brand_url\}\}/g, esc(withUtm(ctx.site.brand.url, ctx)))
    // {{utm:https://…}}: any link to your own product, with UTM tags added.
    .replace(/\{\{utm:(https?:\/\/[^}\s]+)\}\}/g, (_, u) => esc(withUtm(u.replace(/&amp;/g, "&"), ctx)));
}

// Site copy from site.json (tagline, intro): links to any domain in site.ownDomains get UTM tags.
export function ownInline(ctx, text, where) {
  const own = (ctx.site.ownDomains || []).map((d) => d.toLowerCase().replace(/^www\./, ""));
  return inline(text).replace(/href="(https?:\/\/[^"]+)"/g, (m, url) => {
    try {
      const host = new URL(url.replace(/&amp;/g, "&")).hostname.toLowerCase().replace(/^www\./, "");
      return own.includes(host) ? `href="${esc(withUtm(url.replace(/&amp;/g, "&"), ctx, where))}"` : m;
    } catch { return m; }
  });
}

// ---------- hubs and related pages ----------

export const hubOf = (ctx, page) => ctx.site.hubs.find((h) => h.slug === page.meta.hub) || null;
export const pagesInHub = (ctx, slug) => ctx.pages.filter((p) => p.meta.hub === slug);
const unhubbed = (ctx) => ctx.pages.filter((p) => !hubOf(ctx, p));

// Featured first, then newest. Used for home blocks and hub pages.
const byFeaturedThenDate = (a, b) => (b.meta.featured - a.meta.featured) || b.meta.updated.localeCompare(a.meta.updated);

const STOP = new Set(["the", "a", "an", "for", "and", "or", "of", "in", "to", "vs", "with", "best", "top", "how", "what", "is"]);
const tokens = (s) => new Set(String(s).toLowerCase().split(/[^a-z0-9]+/).filter((w) => w && !STOP.has(w)));

// Related pages: explicit meta.related first, then same hub, then keyword overlap, then same type, then newest.
export function relatedFor(ctx, page, n = 4) {
  const explicit = page.meta.related.map((s) => ctx.pages.find((p) => p.slug === s)).filter(Boolean);
  const mine = tokens(page.meta.keyword);
  const score = (p) => {
    let s = 0;
    if (page.meta.hub && p.meta.hub === page.meta.hub) s += 10;
    for (const w of tokens(p.meta.keyword)) if (mine.has(w)) s += 2;
    if (p.meta.type === page.meta.type) s += 1;
    return s;
  };
  const rest = ctx.pages
    .filter((p) => p.slug !== page.slug && !explicit.includes(p))
    .map((p) => ({ p, s: score(p) }))
    .sort((a, b) => b.s - a.s || b.p.meta.updated.localeCompare(a.p.meta.updated))
    .map((x) => x.p);
  return [...explicit, ...rest].slice(0, n);
}

// ---------- heading ids and table of contents ----------

const slugText = (s) => s.replace(/<[^>]+>/g, "").replace(/&[a-z]+;|&#\d+;/g, " ").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

// Adds id="" to every <h2> and <h3> that has none, so the table of contents and in-page links work.
export function headingIds(html) {
  const used = new Set();
  const toc = [];
  const out = html.replace(/<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi, (m, level, attrs, text) => {
    let id = (attrs.match(/\sid\s*=\s*["']([^"']+)["']/i) || [])[1];
    if (!id) {
      id = slugText(text) || `section`;
      let i = 2;
      while (used.has(id)) id = `${slugText(text) || "section"}-${i++}`;
      attrs = `${attrs} id="${id}"`;
    }
    used.add(id);
    if (level === "2") toc.push({ id, text: text.replace(/<[^>]+>/g, "") });
    return `<h${level}${attrs}>${text}</h${level}>`;
  });
  return { html: out, toc };
}

// Wraps tables so wide comparison tables scroll sideways on phones instead of breaking the layout.
const wrapTables = (html) => html.replace(/<table(?![^>]*class="[^"]*no-wrap)[\s\S]*?<\/table>/gi, (t) => `<div class="table-wrap">${t}</div>`)
  .replace(/<div class="table-wrap">(<div class="table-wrap">[\s\S]*?<\/div>)<\/div>/g, "$1");

const tocList = (toc) => `<ol>${toc.map((t) => `<li><a href="#${esc(t.id)}">${t.text}</a></li>`).join("")}</ol>`;

// ---------- CSS ----------

const css = (site) => themeCss(site);

// ---------- shell ----------

function head(ctx, { title, description, key, serif = false }) {
  const lines = [`<meta charset="utf-8">`, `<meta name="viewport" content="width=device-width, initial-scale=1">`];
  if (ctx.target === "apps-script") {
    lines.push(`<base target="_top">`);
  } else {
    const canonical = absUrl(ctx, key);
    lines.push(`<title>${esc(title)}</title>`);
    if (description) lines.push(`<meta name="description" content="${esc(description)}">`);
    if (canonical) lines.push(`<link rel="canonical" href="${esc(canonical)}">`);
    lines.push(`<meta property="og:title" content="${esc(title)}">`, `<meta property="og:type" content="website">`);
    if (description) lines.push(`<meta property="og:description" content="${esc(description)}">`);
  }
  const fonts = fontLinks(ctx.site, { serif });
  if (fonts) lines.push(fonts);
  lines.push(`<style>\n${css(ctx.site)}\n</style>`);
  return lines.join("\n");
}

// Nav: up to 5 hubs, then All guides and About. The CTA is a button.
function navLinks(ctx, { current }) {
  const items = [
    ...ctx.site.hubs.slice(0, 5).map((h) => ({ key: h.slug, label: h.title })),
    { key: "guides", label: ctx.site.hubs.length ? "All guides" : "Guides" },
    { key: "about", label: "About" },
  ];
  return items.map((i) => `<a href="${esc(href(ctx, i.key))}"${i.key === current ? ` aria-current="true"` : ""}>${esc(i.label)}</a>`).join("\n    ");
}

// "hub" and "single" sites have no navigation: the header is the logo and the CTA button.
// In "hub" mode the footer links to home and every other page, so a crawler that lands on any
// page can find the rest. Every visitor and every crawler gets the same HTML.
export const isMinimal = (ctx) => ctx.site.mode === "hub" || ctx.site.mode === "single";

function minimalHeader(ctx) {
  const { site } = ctx;
  const logo = site.mode === "hub" ? `<a class="logo" href="${esc(href(ctx, ""))}">${esc(site.name)}</a>` : `<span class="logo">${esc(site.name)}</span>`;
  return `<header class="site-header"><div class="container">
  ${logo}
  <nav class="nav nav-min${site.cta.sticky ? " has-sticky" : ""}" aria-label="Main"><a class="btn" href="${esc(withUtm((site.navCta || site.cta).url, ctx, "nav"))}" rel="noopener">${esc((site.navCta || site.cta).label)}</a></nav>
</div></header>`;
}

// The XML sitemap (?page=sitemap.xml on Apps Script, /sitemap.xml on the static site).
// Static needs static.baseUrl, because a sitemap lists absolute URLs.
export function sitemapHref(ctx) {
  if (ctx.site.sitemap === false) return "";
  if (ctx.target === "apps-script") { const base = execUrl(ctx.site); return base ? `${base}?page=sitemap.xml` : ""; }
  if (!ctx.site.static.baseUrl) return "";
  return `${ctx.slug ? "../" : "./"}sitemap.xml`;
}

function minimalFooter(ctx) {
  const { site } = ctx;
  const disclosure = site.disclosure.trim() ? `<p>${inline(site.disclosure)}</p>` : "";
  const fine = ``;
  if (site.mode !== "hub") return `<footer class="site-footer"><div class="container">${disclosure}${fine}</div></footer>`;
  const others = ctx.pages.filter((p) => p.slug !== ctx.slug);
  const map = sitemapHref(ctx);
  // Guides list in two columns; the site name links home; the sitemap sits alone under a rule.
  const links = others.map((p) => `<li><a href="${esc(href(ctx, p.slug))}">${esc(p.meta.title)}</a></li>`).join("");
  return `<footer class="site-footer"><div class="container">
<div class="cols cols-2">
  <div><h4><a class="footer-home" href="${esc(href(ctx, ""))}">${esc(site.name)}</a></h4><p>${ownInline(ctx, site.tagline, "footer-about")}</p>${disclosure}<p><a class="btn ghost small" href="${esc(withUtm(site.cta.url, ctx, "footer"))}" rel="noopener">${esc(site.cta.label)}</a></p></div>
  <div class="site-links"><h4>${ctx.slug ? "More guides" : "Guides"}</h4><ul class="two-col-list">${links}</ul></div>
</div>
${map ? `<div class="footer-map"><a href="${esc(map)}">Sitemap</a></div>` : ""}
</div></footer>`;
}

// "landing" layout: the logo and one CTA button, in every mode. The logo links home unless the
// site is a single page. Same HTML for every visitor and crawler.
function landingHeader(ctx) {
  const { site } = ctx;
  const logo = site.mode === "single" ? `<span class="logo">${esc(site.name)}</span>` : `<a class="logo" href="${esc(href(ctx, ""))}">${esc(site.name)}</a>`;
  const cta = site.navCta || site.cta;
  return `<header class="site-header site-header-landing"><div class="container">
  ${logo}
  <nav class="nav nav-min${site.cta.sticky ? " has-sticky" : ""}" aria-label="Main"><a class="btn" href="${esc(withUtm(cta.url, ctx, "nav"))}" rel="noopener">${esc(cta.label)}</a></nav>
</div></header>`;
}

// Slim footer for landing and article pages on a single-page site: site name, tagline,
// disclosure (if any) and the XML sitemap link. Hub and site modes keep their own footer so a
// crawler can still find every other page from here.
function slimFooter(ctx) {
  const { site } = ctx;
  const map = sitemapHref(ctx);
  return `<footer class="site-footer site-footer-slim"><div class="container">
<p class="footer-name">${esc(site.name)}</p>
<p>${ownInline(ctx, site.tagline, "footer-about")}</p>
${site.disclosure.trim() ? `<p>${inline(site.disclosure)}</p>` : ""}
${map ? `<div class="footer-map"><a href="${esc(map)}">Sitemap</a></div>` : ""}
</div></footer>`;
}

function header(ctx, current = "") {
  if (isMinimal(ctx)) return minimalHeader(ctx);
  const { site } = ctx;
  const cta = (where) => `<a class="btn" href="${esc(withUtm(site.cta.url, ctx, where))}" rel="noopener">${esc(site.cta.label)}</a>`;
  return `<header class="site-header"><div class="container">
  <a class="logo" href="${esc(href(ctx, ""))}">${esc(site.name)}</a>
  <nav class="nav" aria-label="Main">
    ${navLinks(ctx, { current })}
    ${cta("nav")}
  </nav>
  <details class="menu"><summary>Menu</summary><nav class="panel" aria-label="Main">
    ${navLinks(ctx, { current })}
    <div class="sep"></div>
    ${cta("menu")}
  </nav></details>
</div></header>`;
}

function footer(ctx) {
  if (isMinimal(ctx)) return minimalFooter(ctx);
  const { site } = ctx;
  const topics = site.hubs.map((h) => `<li><a href="${esc(href(ctx, h.slug))}">${esc(h.title)}</a></li>`).join("");
  return `<footer class="site-footer"><div class="container">
<div class="cols">
  <div><h4>${esc(site.name)}</h4><p>${ownInline(ctx, site.tagline, "footer-about")}</p>${site.disclosure.trim() ? `<p>${inline(site.disclosure)}</p>` : ""}</div>
  <div><h4>Topics</h4><ul>${topics}<li><a href="${esc(href(ctx, "guides"))}">All guides</a></li></ul></div>
  <div><h4>Site</h4><ul><li><a href="${esc(href(ctx, ""))}">Home</a></li><li><a href="${esc(href(ctx, "about"))}">About</a></li><li><a href="${esc(href(ctx, "sitemap"))}">Sitemap</a></li><li><a href="${esc(withUtm(site.cta.url, ctx, "footer"))}" rel="noopener">${esc(site.brand.name)}</a></li></ul></div>
</div>

</div></footer>`;
}

// Breadcrumbs: [{ key, label }, ...]. The last item is the current page.
function crumbs(ctx, items) {
  const lis = items.map((c, i) => i === items.length - 1
    ? `<li aria-current="page">${esc(c.label)}</li>`
    : `<li><a href="${esc(href(ctx, c.key))}">${esc(c.label)}</a></li>`);
  return `<nav class="crumbs" aria-label="Breadcrumb"><ol>${lis.join("")}</ol></nav>`;
}

function breadcrumbLd(ctx, items) {
  const list = items.map((c, i) => {
    const url = absUrl(ctx, c.key);
    return { "@type": "ListItem", position: i + 1, name: c.label, ...(url ? { item: url } : {}) };
  });
  return { "@type": "BreadcrumbList", itemListElement: list };
}

// In Apps Script the page sits in an iframe and <base target="_top"> sends links to the top window.
// In-page anchors (#section) must stay in the frame.
const ANCHOR_FIX = `<script>document.querySelectorAll('a[href^="#"]').forEach(function(a){a.target="_self"});</script>`;

// Optional bottom CTA bar on phones (site.json cta.sticky). Plain HTML and CSS: a hidden checkbox
// dismisses it, body padding keeps it off the text. Same markup for every visitor and crawler.
function stickyCta(ctx) {
  const { site } = ctx;
  if (!site.cta.sticky) return "";
  return `<input type="checkbox" id="sticky-off" class="sticky-off" aria-hidden="true" tabindex="-1">
<div class="sticky-cta" role="complementary" aria-label="${esc(site.cta.label)}">
  <span class="sticky-text">${inline(site.cta.text)}</span>
  <a class="btn" href="${esc(withUtm(site.cta.url, ctx, `${ctx.slug || "home"}-sticky`))}" rel="noopener">${esc(site.cta.label)}</a>
  <label for="sticky-off" class="sticky-close" title="Hide" aria-label="Hide this bar">&#x2715;</label>
</div>`;
}

// shell: "guide" (the mode's header and footer), "landing" (logo + CTA header), "article" (no header).
// Landing and article pages on a single-page site get the slim footer.
export function layout(ctx, { title, description, key, main, jsonLd, current = "", sticky = false, shell = "guide" }) {
  const ld = jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>` : "";
  const top = shell === "landing" ? landingHeader(ctx) : shell === "article" ? "" : header(ctx, current);
  const bottom = ctx.site.footer === false ? "" : shell !== "guide" && ctx.site.mode === "single" ? slimFooter(ctx) : footer(ctx);
  return `<!DOCTYPE html>
<html lang="${esc(ctx.site.language)}"${ctx.site.theme.scheme && ctx.site.theme.scheme !== "auto" ? ` data-theme="${ctx.site.theme.scheme}"` : ""}>
<head>
${head(ctx, { title, description, key, serif: shell === "article" })}
</head>
<body class="layout-${shell}">
${top}
${main}
${bottom}
${sticky ? stickyCta(ctx) : ""}
${ld}
${ctx.target === "apps-script" ? ANCHOR_FIX : ""}
</body>
</html>
`;
}

// ---------- shared blocks ----------

const row = (ctx, p) => `<li><a class="row-title" href="${esc(href(ctx, p.slug))}">${esc(p.meta.title)}</a><p>${esc(p.meta.description)}</p><span class="row-meta"><b>${TYPE_LABEL[p.meta.type]}</b> · Updated ${esc(p.meta.updated)}</span></li>`;
const rows = (ctx, list) => `<ol class="rows">${list.map((p) => row(ctx, p)).join("\n")}</ol>`;

const ctaBox = (ctx) => `<aside class="cta-box"><div><strong>${esc(ctx.site.cta.label)}</strong><p>${inline(ctx.site.cta.text)}</p></div><a class="btn" href="${esc(withUtm(ctx.site.cta.url, ctx, ctx.slug ? `${ctx.slug}-box` : "home-box"))}" rel="noopener">${esc(ctx.site.cta.label)}</a></aside>`;

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
const hubRow = (ctx, h) => `<li><a class="row-title" href="${esc(href(ctx, h.slug))}">${esc(h.title)}</a><p>${esc(h.description)}</p><span class="row-meta">${plural(pagesInHub(ctx, h.slug).length, "guide")}</span></li>`;

// ---------- pages ----------

export function renderHome(ctx) {
  const { site, pages } = ctx;
  const hubs = site.hubs;
  const topics = hubs.length
    ? `<aside class="topics"><p class="kicker">Topics</p><ul>${hubs.map((h) => `<li><a href="${esc(href(ctx, h.slug))}">${esc(h.title)}</a><span>${pagesInHub(ctx, h.slug).length}</span></li>`).join("")}<li><a href="${esc(href(ctx, "guides"))}">All guides</a><span>${pages.length}</span></li></ul></aside>`
    : `<aside class="topics"><p class="kicker">Latest</p><ul>${pages.slice(0, 5).map((p) => `<li><a href="${esc(href(ctx, p.slug))}">${esc(p.meta.title)}</a></li>`).join("")}</ul></aside>`;
  const hubBlock = (h) => {
    const list = pagesInHub(ctx, h.slug).sort(byFeaturedThenDate);
    return `<div class="hub-block">
  <div><h2><a href="${esc(href(ctx, h.slug))}">${esc(h.title)}</a></h2><p class="hub-desc">${esc(h.description)}</p><a class="more" href="${esc(href(ctx, h.slug))}">All ${plural(list.length, "guide")} in ${esc(h.title)}</a></div>
  <div>${list.length ? rows(ctx, list.slice(0, 5)) : `<p class="meta">No guides in this topic yet.</p>`}</div>
</div>`;
  };
  const other = unhubbed(ctx).sort(byFeaturedThenDate);
  const main = `<main>
<section class="hero"><div class="container">
  <div><h1>${esc(site.home.headline)}</h1>
  <p class="lead">${inline(site.home.intro)}</p>
  <div class="actions"><a class="btn" href="${esc(href(ctx, "guides"))}">Browse the guides</a><a class="btn ghost" href="${esc(withUtm(site.cta.url, ctx, "hero"))}" rel="noopener">${esc(site.cta.label)}</a></div></div>
  ${topics}
</div></section>
<section class="section"><div class="container">
${hubs.map(hubBlock).join("\n")}
${other.length ? `<div class="hub-block"><div><h2>${hubs.length ? "More guides" : "All guides"}</h2><a class="more" href="${esc(href(ctx, "guides"))}">All guides</a></div><div>${rows(ctx, other.slice(0, 8))}</div></div>` : ""}
<div class="hub-block"><div><h2>Who writes these guides</h2></div><div><p>${inline(site.author.bio)}</p><a class="more" href="${esc(href(ctx, "about"))}">About and how we review</a></div></div>
${ctaBox(ctx)}
</div></section>
</main>`;
  const jsonLd = { "@context": "https://schema.org", "@type": "WebSite", name: site.name, description: site.tagline, ...(absUrl(ctx, "") ? { url: absUrl(ctx, "") } : {}), publisher: { "@type": "Organization", name: site.brand.name, url: site.brand.url } };
  return layout(ctx, { title: site.home.title, description: site.home.intro, key: "", main, jsonLd });
}

// Home page of a "hub" site: a plain index that links to every page.
export function renderIndex(ctx) {
  const { site, pages } = ctx;
  const main = `<main>
<section class="hero"><div class="container"><div><h1>${esc(site.home.headline)}</h1><p class="lead">${inline(site.home.intro)}</p></div></div></section>
<section class="section"><div class="container">
<div class="section-head"><h2>All guides</h2><span class="meta">${pages.length}</span></div>
${rows(ctx, pages)}
${ctaBox(ctx)}
</div></section>
</main>`;
  const jsonLd = { "@context": "https://schema.org", "@graph": [
    { "@type": "WebSite", name: site.name, description: site.tagline, publisher: { "@type": "Organization", name: site.brand.name, url: site.brand.url } },
    { "@type": "ItemList", itemListElement: pages.map((p, i) => ({ "@type": "ListItem", position: i + 1, name: p.meta.title, ...(absUrl(ctx, p.slug) ? { url: absUrl(ctx, p.slug) } : {}) })) },
  ] };
  return layout(ctx, { title: site.home.title, description: site.home.intro, key: "", main, jsonLd });
}

export function renderHub(ctx, hub, introHtml = "") {
  const list = pagesInHub(ctx, hub.slug).sort(byFeaturedThenDate);
  const groups = TYPE_ORDER.map((t) => [t, list.filter((p) => p.meta.type === t)]).filter(([, l]) => l.length);
  const siblings = ctx.site.hubs.filter((h) => h.slug !== hub.slug);
  const trail = [{ key: "", label: "Home" }, { key: hub.slug, label: hub.title }];
  const main = `<main class="container page">
${crumbs(ctx, trail)}
<header class="hub-head"><p class="kicker">Topic</p><h1>${esc(hub.title)}</h1><p class="lead">${esc(hub.description)}</p></header>
${introHtml ? `<div class="prose narrow" style="margin-bottom:var(--s-6)">${resolve(introHtml, ctx)}</div>` : ""}
${groups.length
    ? groups.map(([t, l]) => `<section class="section" style="padding-top:0"><div class="section-head"><h2>${TYPE_PLURAL[t]}</h2><span class="meta">${l.length}</span></div>${rows(ctx, l)}</section>`).join("\n")
    : `<p class="callout">No guides in this topic yet.</p>`}
${siblings.length ? `<section class="section" style="padding-top:0"><div class="section-head"><h2>Other topics</h2><a href="${esc(href(ctx, "guides"))}">All guides</a></div><ul class="rows">${siblings.map((h) => hubRow(ctx, h)).join("")}</ul></section>` : ""}
${ctaBox(ctx)}
</main>`;
  const jsonLd = { "@context": "https://schema.org", "@graph": [
    { "@type": "CollectionPage", name: hub.title, description: hub.description, ...(absUrl(ctx, hub.slug) ? { url: absUrl(ctx, hub.slug) } : {}), hasPart: list.map((p) => ({ "@type": "Article", headline: p.meta.title, ...(absUrl(ctx, p.slug) ? { url: absUrl(ctx, p.slug) } : {}) })) },
    breadcrumbLd(ctx, trail),
  ] };
  return layout(ctx, { title: `${hub.title} | ${ctx.site.name}`, description: hub.description, key: hub.slug, main, jsonLd, current: hub.slug });
}

export function renderGuides(ctx) {
  const { site } = ctx;
  const trail = [{ key: "", label: "Home" }, { key: "guides", label: "All guides" }];
  const group = (title, list, key) => `<section class="section" style="padding-top:0"><div class="section-head"><h2>${key ? `<a href="${esc(href(ctx, key))}" style="color:inherit;text-decoration:none">${esc(title)}</a>` : esc(title)}</h2><span class="meta">${list.length}</span></div>${rows(ctx, list)}</section>`;
  const blocks = site.hubs.map((h) => [h.title, pagesInHub(ctx, h.slug).sort(byFeaturedThenDate), h.slug]).filter(([, l]) => l.length);
  const other = unhubbed(ctx).sort(byFeaturedThenDate);
  const main = `<main class="container page">
${crumbs(ctx, trail)}
<header class="hub-head"><h1>All guides</h1><p class="lead">${ownInline(ctx, site.tagline, "footer-about")}</p></header>
${blocks.map(([t, l, k]) => group(t, l, k)).join("\n")}
${other.length ? group(site.hubs.length ? "Other guides" : "Guides", other) : ""}
${ctx.pages.length ? "" : `<p class="callout">No guides yet.</p>`}
</main>`;
  const jsonLd = { "@context": "https://schema.org", "@graph": [{ "@type": "CollectionPage", name: `All guides | ${site.name}` }, breadcrumbLd(ctx, trail)] };
  return layout(ctx, { title: `All guides | ${site.name}`, description: site.tagline, key: "guides", main, jsonLd, current: "guides" });
}

export function renderAbout(ctx, aboutHtml) {
  const { site } = ctx;
  const raw = aboutHtml ? resolve(aboutHtml, ctx) : `<h1>About ${esc(site.name)}</h1><p>${inline(site.author.bio)}</p>`;
  const body = wrapTables(headingIds(raw).html);
  const trail = [{ key: "", label: "Home" }, { key: "about", label: "About" }];
  const main = `<main class="container page">${crumbs(ctx, trail)}<div class="layout"><article class="prose">${body}${site.disclosure.trim() ? `<div class="disclosure">${inline(site.disclosure)}</div>` : ""}</article></div></main>`;
  const jsonLd = { "@context": "https://schema.org", "@graph": [{ "@type": "AboutPage", name: `About | ${site.name}` }, breadcrumbLd(ctx, trail)] };
  return layout(ctx, { title: `About | ${site.name}`, description: site.tagline, key: "about", main, jsonLd, current: "about" });
}

export function renderSitemap(ctx) {
  const { site } = ctx;
  const link = (key, label, meta = "") => `<li><a href="${esc(href(ctx, key))}">${esc(label)}${meta ? `<span class="meta">${esc(meta)}</span>` : ""}</a></li>`;
  const section = (title, items) => `<h2>${esc(title)}</h2><ul class="list">${items.join("")}</ul>`;
  const parts = [section("Site", [link("", "Home"), link("guides", "All guides"), link("about", "About"), link("sitemap", "Sitemap")])];
  for (const h of site.hubs) parts.push(section(h.title, [link(h.slug, `${h.title} (topic page)`), ...pagesInHub(ctx, h.slug).map((p) => link(p.slug, p.meta.title, p.meta.updated))]));
  const other = unhubbed(ctx);
  if (other.length) parts.push(section(site.hubs.length ? "Other guides" : "Guides", other.map((p) => link(p.slug, p.meta.title, p.meta.updated))));
  const trail = [{ key: "", label: "Home" }, { key: "sitemap", label: "Sitemap" }];
  const main = `<main class="container page">${crumbs(ctx, trail)}<div class="layout"><article class="prose"><h1>Sitemap</h1><p class="lead">Every page on ${esc(site.name)}.</p>${parts.join("\n")}</article></div></main>`;
  return layout(ctx, { title: `Sitemap | ${site.name}`, description: site.tagline, key: "sitemap", main, jsonLd: { "@context": "https://schema.org", ...breadcrumbLd(ctx, trail) } });
}

const visibleText = (html) => html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ");

function byline(ctx, page, words) {
  const mins = Math.max(1, Math.round(words / 220));
  const disclosure = page.meta.ownProduct && ctx.site.disclosure.trim() ? `<div class="disclosure">${inline(ctx.site.disclosure)}</div>` : "";
  return `<p class="byline"><span class="type">${TYPE_LABEL[page.meta.type]}</span><span>Updated <time datetime="${esc(page.meta.updated)}">${esc(page.meta.updated)}</time></span><span>${mins} min read</span></p>${disclosure}`;
}

export function renderPage(ctx, page) {
  // A page can override the site CTA (header button, CTA box, sticky bar) for its own audience.
  if (page.meta.cta) ctx = { ...ctx, site: { ...ctx.site, cta: { ...ctx.site.cta, ...page.meta.cta } } };
  const raw = resolve(page.html, ctx, { updated: page.meta.updated });
  const { html: withIds, toc } = headingIds(raw);
  const words = visibleText(withIds).split(/\s+/).filter(Boolean).length;
  const shell = page.meta.layout || "guide";
  if (shell !== "guide") return renderLayoutPage(ctx, page, { raw, body: wrapTables(withIds), shell });
  let body = wrapTables(withIds);
  // Byline (and disclosure) right after the first <h1>.
  body = /<\/h1>/i.test(body) ? body.replace(/<\/h1>/i, `</h1>${byline(ctx, page, words)}`) : byline(ctx, page, words) + body;
  // "On this page" before the first <h2> when the page has 3+ sections. The rail shows the same list on wide screens.
  const hasToc = toc.length >= 3;
  if (hasToc) body = body.replace(/<h2[\s>]/i, (m) => `<details class="toc toc-inline"><summary>On this page</summary>${tocList(toc)}</details>${m}`);
  const hub = hubOf(ctx, page);
  const trail = [{ key: "", label: "Home" }, hub ? { key: hub.slug, label: hub.title } : { key: "guides", label: "Guides" }, { key: page.slug, label: page.meta.title }];
  const minimal = isMinimal(ctx);
  const related = minimal ? [] : relatedFor(ctx, page, 4);
  const main = `<main class="container page">
${minimal ? "" : crumbs(ctx, trail)}
<div class="layout">
<article class="prose">${body}</article>
<aside class="rail">${hasToc ? `<nav class="toc" aria-label="On this page"><p class="kicker">On this page</p>${tocList(toc)}</nav>` : ""}</aside>
</div>
<div class="after">
${ctaBox(ctx)}
${related.length ? `<section class="related"><div class="section-head"><h2>Related guides</h2>${hub ? `<a href="${esc(href(ctx, hub.slug))}">All in ${esc(hub.title)}</a>` : `<a href="${esc(href(ctx, "guides"))}">All guides</a>`}</div>${rows(ctx, related)}</section>` : ""}
</div>
</main>`;
  const url = absUrl(ctx, page.slug);
  const graph = [{
    "@type": "Article",
    headline: page.meta.title,
    description: page.meta.description,
    dateModified: page.meta.updated,
    ...(url ? { url, mainEntityOfPage: url } : {}),
    ...(ctx.site.author.name.trim() ? { author: { "@type": "Person", name: ctx.site.author.name, ...(ctx.site.author.url ? { url: ctx.site.author.url } : {}) } } : {}),
    publisher: { "@type": "Organization", name: ctx.site.brand.name, url: ctx.site.brand.url },
  }];
  if (!minimal) graph.push(breadcrumbLd(ctx, trail));
  graph.push(...schemaFromHtml(raw));
  return layout(ctx, { title: page.meta.title, description: page.meta.description, key: page.slug, main, jsonLd: { "@context": "https://schema.org", "@graph": graph }, current: hub ? hub.slug : "guides", sticky: true });
}

// "landing" and "article" pages: the page fragment is the whole <main>. No meta line, no
// "On this page", no CTA box, no related guides. The page carries its own CTAs (see
// templates/landing.html and templates/blog-article.html). Same HTML for everyone.
function renderLayoutPage(ctx, page, { raw, body, shell }) {
  const main = shell === "landing"
    ? `<main class="landing">\n${body}\n</main>`
    : `<main class="article"><article class="prose article-body">\n${body}\n</article></main>`;
  const url = absUrl(ctx, page.slug);
  const graph = [{
    "@type": shell === "landing" ? "WebPage" : "Article",
    ...(shell === "landing" ? { name: page.meta.title } : { headline: page.meta.title }),
    description: page.meta.description,
    dateModified: page.meta.updated,
    ...(url ? { url, ...(shell === "landing" ? {} : { mainEntityOfPage: url }) } : {}),
    ...(shell !== "landing" && ctx.site.author.name.trim() ? { author: { "@type": "Person", name: ctx.site.author.name, ...(ctx.site.author.url ? { url: ctx.site.author.url } : {}) } } : {}),
    publisher: { "@type": "Organization", name: ctx.site.brand.name, url: ctx.site.brand.url },
  }];
  graph.push(...schemaFromHtml(raw));
  const hub = hubOf(ctx, page);
  return layout(ctx, { title: page.meta.title, description: page.meta.description, key: page.slug, main, jsonLd: { "@context": "https://schema.org", "@graph": graph }, current: hub ? hub.slug : "guides", sticky: true, shell });
}

// ---------- structured data from the page's own markup ----------

const strip = (h) => h.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();

// FAQPage from <details><summary>Q</summary>A</details>; ItemList from ranked <section class="item"> entries.
// Only content that is visible on the page goes into the schema.
export function schemaFromHtml(html) {
  const out = [];
  const faq = [...html.matchAll(/<details[^>]*>\s*<summary[^>]*>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/gi)]
    .map((m) => ({ q: strip(m[1]), a: strip(m[2]) })).filter((f) => f.q && f.a);
  if (faq.length) out.push({ "@type": "FAQPage", mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) });
  const items = [...html.matchAll(/<section class="item[^"]*"[^>]*>([\s\S]*?)<\/section>/gi)].map((m) => {
    const name = strip((m[1].match(/<h3[^>]*>([\s\S]*?)<\/h3>/i) || [])[1] || "");
    const url = (m[1].match(/<a class="btn[^"]*" href="(https?:[^"]+)"/i) || [])[1] || "";
    return { name, url: url.replace(/&amp;/g, "&") };
  }).filter((it) => it.name);
  if (items.length) out.push({ "@type": "ItemList", itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, ...(it.url ? { url: it.url } : {}) })) });
  return out;
}
