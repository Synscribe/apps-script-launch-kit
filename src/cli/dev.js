// npm run dev -- --site <name> [--port 4321]
// Local preview. Renders on every request, so edits show on refresh. Drafts are included.
//   http://localhost:4321/              static version
//   http://localhost:4321/apps-script/  Apps Script version (links rewritten to stay local)
//   http://localhost:4321/styleguide/   every component in the theme (dev only, never built)
//   http://localhost:4321/templates/top-n/   a starter from templates/<name>.html rendered as a page (dev only)
//   http://localhost:4321/templates/landing/ and /templates/blog-article/   the "landing" and "article" layouts
// Add ?theme=light or ?theme=dark to any URL to force a colour scheme. No value follows the system.
// Ignored when site.json theme.scheme forces "light" or "dark" (production never shows the other look).
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { args, siteName, ROOT } from "../lib/project.js";
import { sitePagesFor, sitemapXml } from "../lib/build.js";
import { renderStyleguide } from "../lib/styleguide.js";
import { renderPage } from "../lib/render.js";

// Dev-only preview of a template: templates/<name>.html with placeholder meta, inside the real shell.
// Each template renders in the layout it is made for (meta.json "layout").
const TEMPLATE_LAYOUT = { "top-n": "guide", landing: "landing", "blog-article": "article" };
function templatePage(name) {
  const file = path.join(ROOT, "templates", `${name}.html`);
  if (!/^[a-z0-9-]+$/.test(name) || !fs.existsSync(file)) return null;
  const html = fs.readFileSync(file, "utf8");
  const h1 = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || name;
  return { slug: `templates/${name}`, meta: { title: h1.replace(/<[^>]+>/g, ""), description: `Template preview: templates/${name}.html`, keyword: name, status: "draft", updated: new Date().toISOString().slice(0, 10), ownProduct: true, featured: false, type: "comparison", layout: TEMPLATE_LAYOUT[name] || "guide", hub: "", related: [] }, html };
}

const flags = args();
const site = siteName(flags);
const port = Number(flags.port || 4321);
const FAKE = "https://script.google.com/macros/s/PREVIEW/exec";

function bar(url, target, drafts) {
  const theme = url.searchParams.get("theme") || "";
  const withTheme = (t) => { const u = new URL(url); if (t) u.searchParams.set("theme", t); else u.searchParams.delete("theme"); return u.pathname + u.search; };
  const opt = (t, label) => theme === t ? `<b>${label}</b>` : `<a href="${withTheme(t)}">${label}</a>`;
  const toStatic = url.pathname.startsWith("/apps-script") ? "/" : "/";
  const toAs = url.pathname.startsWith("/apps-script") ? url.pathname + url.search : "/apps-script/";
  return `<div style="font:13px system-ui;background:#fff3c4;color:#5b4a00;padding:6px 12px;border-bottom:1px solid #e6d27a;position:relative;z-index:40;display:flex;gap:12px;flex-wrap:wrap">
<span>Preview: <b>${target}</b></span><span><a href="${toStatic}">static</a> · <a href="${toAs}">apps script</a></span><span>Theme: ${opt("", "system")} · ${opt("light", "light")} · ${opt("dark", "dark")}</span><span><a href="/styleguide/">styleguide</a></span>${drafts ? `<span><b>${drafts} draft(s) shown</b></span>` : ""}</div>`;
}

http.createServer((req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    const asMode = url.pathname.startsWith("/apps-script");
    const target = asMode ? "apps-script" : "static";
    const { site: config, entries, pages } = sitePagesFor(site, { includeDrafts: true, preview: true });
    const key = asMode
      ? url.searchParams.get("page") || url.pathname.replace(/^\/apps-script\/?/, "").replace(/\/$/, "")
      : url.pathname.replace(/^\/|\/$/g, "");
    let html;
    const tpl = key.startsWith("templates/") ? templatePage(key.slice("templates/".length)) : null;
    if (key === "styleguide") {
      html = renderStyleguide({ site: config, target, pages, slug: "styleguide" });
    } else if (tpl) {
      html = renderPage({ site: config, target, pages, slug: tpl.slug }, tpl);
    } else {
      if (key === "sitemap.xml") {
      const { site: s } = sitePagesFor(site, { includeDrafts: true, preview: true });
      res.writeHead(200, { "content-type": "application/xml; charset=utf-8" });
      return res.end(sitemapXml(s, entries, target).replaceAll(FAKE, "http://localhost:" + port + "/apps-script"));
    }
    const entry = entries.find((e) => e.key === key);
      if (!entry) {
        res.writeHead(404, { "content-type": "text/plain" });
        return res.end("Not found");
      }
      html = entry.html(target);
    }
    if (asMode) {
      html = html.replace('<base target="_top">', "")
        .replaceAll(FAKE, "/apps-script");
    }
    const theme = url.searchParams.get("theme");
    // A site with theme.scheme "light" or "dark" always shows that look, so ?theme= is ignored there.
    if ((theme === "light" || theme === "dark") && !/<html[^>]*data-theme=/.test(html)) html = html.replace("<html ", `<html data-theme="${theme}" `);
    const drafts = pages.filter((p) => p.meta.status !== "approved").length;
    html = html.replace(/<body[^>]*>/, (m) => `${m}${bar(url, target, drafts)}`);
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(html);
  } catch (e) {
    res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    res.end(String(e.stack || e.message || e));
  }
}).listen(port, () => {
  console.log(`Preview "${site}": http://localhost:${port}/   Apps Script version: http://localhost:${port}/apps-script/   Style guide: http://localhost:${port}/styleguide/`);
});
