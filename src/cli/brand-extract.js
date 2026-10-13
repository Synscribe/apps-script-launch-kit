// npm run brand:extract -- --url <url> [--site <site>] [--out <dir>]
// Reads the visual style of a web page (colours, fonts, radii, buttons) so you can clone it into
// sites/<site>/theme.css. It copies style only. It never copies a brand name, logo or copy.
//
// With agent-browser installed it loads the page in a real browser and reads computed styles.
// Without it, it fetches the HTML and CSS and reads what it can (custom properties, hex colours,
// @font-face, Google Fonts links). The report is JSON on stdout plus a suggested theme.css.
// See .claude/skills/clone-brand-style/SKILL.md for how to turn the report into tokens.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { args, fail, ROOT } from "../lib/project.js";

const flags = args();
const url = flags.url && flags.url !== true ? flags.url : "";
if (!/^https?:\/\//.test(url)) fail("Pass a page, e.g. --url https://example.com/");
const outDir = flags.out && flags.out !== true ? path.resolve(flags.out) : "";
const siteName = flags.site && flags.site !== true ? flags.site : "";
const host = new URL(url).hostname.replace(/^www\./, "");

// ---------- in-page script (runs in the browser) ----------
// Returns a JSON string. Keep it dependency-free; agent-browser runs it with "eval --stdin".
const PAGE_SCRIPT = String.raw`(() => {
  const cs = (el) => getComputedStyle(el);
  const pick = (el, props) => Object.fromEntries(props.map((p) => [p, cs(el).getPropertyValue(p)]));
  const out = { method: "browser", url: location.href };
  out.fontLinks = Array.from(document.querySelectorAll('link[rel~="stylesheet"],link[rel="preconnect"]'))
    .map((l) => l.href).filter((h) => /fonts\.googleapis|fonts\.gstatic|typekit|fonts\.bunny|use\.fontawesome/.test(h));
  out.fontFaces = [];
  const vars = {};
  for (const ss of document.styleSheets) {
    let rules; try { rules = ss.cssRules; } catch { continue; }
    for (const r of rules) {
      if (r.type === 5) out.fontFaces.push({ family: r.style.fontFamily, weight: r.style.fontWeight, src: (r.style.src || "").slice(0, 120) });
      if (r.type === 1 && /:root|^html|^body/.test(r.selectorText || "")) for (const p of r.style) if (p.startsWith("--")) vars[p] = r.style.getPropertyValue(p).trim();
    }
  }
  out.customProps = vars;
  out.body = pick(document.body, ["font-family", "font-size", "line-height", "color", "background-color", "letter-spacing"]);
  const els = Array.from(document.querySelectorAll("body *")).filter((el) => el.offsetWidth > 0 && el.offsetHeight > 0).slice(0, 5000);
  const count = (map, k) => { if (!k) return; map[k] = (map[k] || 0) + 1; };
  const bg = {}, fg = {}, border = {}, radii = {}, fams = {};
  for (const el of els) {
    const s = cs(el);
    if (s.backgroundColor !== "rgba(0, 0, 0, 0)") count(bg, s.backgroundColor);
    count(fg, s.color);
    if (s.borderTopWidth !== "0px" && s.borderTopStyle !== "none") count(border, s.borderTopColor);
    if (s.borderTopLeftRadius !== "0px") count(radii, s.borderTopLeftRadius);
    count(fams, s.fontFamily);
  }
  const top = (m, n) => Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, n);
  out.backgrounds = top(bg, 12); out.textColors = top(fg, 10); out.borders = top(border, 6); out.radii = top(radii, 8); out.fontFamilies = top(fams, 5);
  const heads = {};
  for (const tag of ["h1", "h2", "h3", "p"]) { const el = document.querySelector("main " + tag) || document.querySelector(tag); if (el) heads[tag] = pick(el, ["font-family", "font-size", "font-weight", "line-height", "letter-spacing", "color"]); }
  out.headings = heads;
  const a = Array.from(document.querySelectorAll("main p a, article p a, p a")).find((x) => cs(x).backgroundColor === "rgba(0, 0, 0, 0)");
  if (a) out.link = pick(a, ["color", "text-decoration-line", "font-weight"]);
  const isBtn = (el) => el.offsetHeight > 24 && el.offsetWidth > 40 && el.innerText.trim().length > 0 && el.innerText.trim().length < 40;
  const solid = Array.from(document.querySelectorAll("a,button")).filter((el) => isBtn(el) && cs(el).backgroundColor !== "rgba(0, 0, 0, 0)");
  const byLook = {};
  for (const el of solid) { const s = cs(el); const k = s.backgroundColor + "|" + s.borderRadius; byLook[k] = byLook[k] || { count: 0, text: el.innerText.trim(), ...pick(el, ["background-color", "color", "border-radius", "padding", "font-size", "font-weight", "border", "box-shadow", "text-transform", "letter-spacing"]) }; byLook[k].count++; }
  out.buttons = Object.values(byLook).sort((a, b) => b.count - a.count).slice(0, 6);
  const outline = Array.from(document.querySelectorAll("a,button")).filter((el) => isBtn(el) && cs(el).backgroundColor === "rgba(0, 0, 0, 0)" && cs(el).borderTopWidth !== "0px");
  out.outlineButtons = outline.slice(0, 3).map((el) => ({ text: el.innerText.trim(), ...pick(el, ["color", "border", "border-radius", "padding", "font-size", "font-weight"]) }));
  const header = document.querySelector("header, nav");
  if (header) out.header = pick(header, ["background-color", "border-bottom", "box-shadow", "height"]);
  out.maxWidths = Array.from(new Set(els.map((el) => cs(el).maxWidth).filter((w) => /px$/.test(w)))).slice(0, 8);
  out.hasDarkMode = Array.from(document.styleSheets).some((ss) => { try { return Array.from(ss.cssRules).some((r) => r.media && /prefers-color-scheme/.test(r.media.mediaText)); } catch { return false; } });
  return JSON.stringify(out);
})()`;

// ---------- browser path ----------
function findAgentBrowser() {
  const candidates = [process.env.AGENT_BROWSER_BIN].filter(Boolean);
  try { candidates.push(path.join(execFileSync("npm", ["prefix", "-g"], { encoding: "utf8" }).trim(), "bin", "agent-browser")); } catch {}
  for (const dir of (process.env.PATH || "").split(path.delimiter)) candidates.push(path.join(dir, "agent-browser"));
  return candidates.find((c) => c && fs.existsSync(c)) || "";
}

function viaBrowser(bin) {
  const session = `brand-${Date.now()}`;
  const run = (argv, input) => {
    const r = spawnSync(bin, ["--session", session, ...argv], { encoding: "utf8", input, timeout: 90000 });
    if (r.status !== 0) throw new Error(`agent-browser ${argv[0]} failed: ${(r.stderr || r.stdout || "").trim()}`);
    return r.stdout;
  };
  try {
    run(["open", url]);
    try { run(["wait", "--load", "networkidle"]); } catch {}
    run(["set", "viewport", "1280", "900"]);
    const raw = run(["eval", "--stdin"], PAGE_SCRIPT).trim();
    let data = raw;
    for (let i = 0; i < 2 && typeof data === "string"; i++) { try { data = JSON.parse(data); } catch { break; } }
    if (typeof data !== "object") throw new Error("could not parse the page report");
    if (outDir) {
      fs.mkdirSync(outDir, { recursive: true });
      run(["screenshot", path.join(outDir, `${host}-top.png`)]);
      run(["screenshot", "--full", path.join(outDir, `${host}-full.png`)]);
      data.screenshots = [path.join(outDir, `${host}-top.png`), path.join(outDir, `${host}-full.png`)];
    }
    return data;
  } finally {
    spawnSync(bin, ["--session", session, "close"], { encoding: "utf8" });
  }
}

// ---------- fetch fallback ----------
async function viaFetch() {
  const get = async (u) => (await fetch(u, { headers: { "user-agent": "Mozilla/5.0 (brand-extract)" } })).text();
  const html = await get(url);
  const abs = (h) => { try { return new URL(h, url).href; } catch { return ""; } };
  const links = [...html.matchAll(/<link[^>]+>/gi)].map((m) => m[0]);
  const sheets = links.filter((l) => /rel\s*=\s*["']?stylesheet/i.test(l)).map((l) => abs((l.match(/href\s*=\s*["']([^"']+)/i) || [])[1] || "")).filter(Boolean);
  let css = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join("\n");
  for (const s of sheets.slice(0, 12)) { try { css += "\n" + (await get(s)); } catch {} }
  const count = (list) => Object.entries(list.reduce((m, k) => (m[k] = (m[k] || 0) + 1, m), {})).sort((a, b) => b[1] - a[1]);
  const vars = {};
  for (const m of css.matchAll(/(:root|html|body)[^{]*\{([^}]*)\}/g)) for (const d of m[2].matchAll(/(--[\w-]+)\s*:\s*([^;]+)/g)) vars[d[1]] = d[2].trim();
  const fontFaces = [...css.matchAll(/@font-face\s*\{([^}]*)\}/g)].map((m) => ({ family: (m[1].match(/font-family\s*:\s*([^;]+)/) || [])[1]?.trim(), weight: (m[1].match(/font-weight\s*:\s*([^;]+)/) || [])[1]?.trim() }));
  const fontLinks = sheets.filter((s) => /fonts\.googleapis|typekit|fonts\.bunny/.test(s));
  const families = count([...css.matchAll(/font-family\s*:\s*([^;}]+)/g)].map((m) => m[1].trim().replace(/\s+/g, " ")));
  const colors = count([...css.matchAll(/#(?:[0-9a-f]{3}){1,2}\b|rgba?\([^)]+\)|hsla?\([^)]+\)/gi)].map((m) => m[0].toLowerCase()));
  const radii = count([...css.matchAll(/border-radius\s*:\s*([^;}]+)/g)].map((m) => m[1].trim()));
  const buttons = [...css.matchAll(/([^{}]*(?:\.btn|button|\.button)[^{}]*)\{([^}]*)\}/gi)].slice(0, 8).map((m) => ({ selector: m[1].trim().slice(0, 80), css: m[2].trim().replace(/\s+/g, " ").slice(0, 300) }));
  const bodyRule = (css.match(/(?:^|})\s*body\s*\{([^}]*)\}/) || [])[1] || "";
  return { method: "fetch", url, fontLinks, fontFaces, customProps: vars, fontFamilies: families.slice(0, 6), colors: colors.slice(0, 25), radii: radii.slice(0, 8), buttons, body: bodyRule.trim(), note: "Fetched HTML and CSS only. Colours are counted in the CSS text, not on the rendered page. Install agent-browser for computed styles." };
}

// ---------- suggested theme.css ----------
const hex = (c) => {
  const m = String(c).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return /^#/.test(c) ? c : "";
  return "#" + [m[1], m[2], m[3]].map((n) => Number(n).toString(16).padStart(2, "0")).join("");
};
function suggest(d) {
  const first = (list) => (list && list[0] ? list[0][0] : "");
  const btn = d.buttons && d.buttons[0] ? d.buttons[0] : null;
  const lines = [
    `/* sites/<site>/theme.css: style cloned from ${host} on ${new Date().toISOString().slice(0, 10)}. Values are a starting point; check /styleguide/ in light and dark. */`,
    `:root {`,
    `  --font-sans: ${d.body && d.body["font-family"] ? d.body["font-family"] + ", system-ui, sans-serif" : "/* font family */"};`,
    `  --bg: ${hex(d.body && d.body["background-color"]) || "/* page background */"};`,
    `  --fg: ${hex(d.body && d.body.color) || "/* body text */"};`,
    `  --accent: ${hex(btn && btn["background-color"]) || "/* primary button colour */"};`,
    `  --accent-fg: ${hex(btn && btn.color) || "#ffffff"};`,
    `  --line: ${hex(first(d.borders)) || "/* hairline */"};`,
    `  --radius: ${btn && /px|rem/.test(btn["border-radius"]) ? (parseFloat(btn["border-radius"]) > 100 ? "999px" : btn["border-radius"]) : "/* controls */"};`,
    `  --radius-lg: ${first(d.radii) || "/* boxes */"};`,
    `}`,
  ];
  return lines.join("\n");
}

const bin = findAgentBrowser();
let report;
try {
  report = bin ? viaBrowser(bin) : await viaFetch();
} catch (e) {
  console.error(`Browser extraction failed (${e.message}). Falling back to fetch.`);
  report = await viaFetch();
}
report.host = host;
report.extractedOn = new Date().toISOString().slice(0, 10);
if (siteName) report.site = siteName;

const json = JSON.stringify(report, null, 2);
if (outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  const file = path.join(outDir, `${host}.brand.json`);
  fs.writeFileSync(file, json + "\n");
  console.error(`Wrote ${path.relative(ROOT, file) || file}${report.screenshots ? ` and ${report.screenshots.length} screenshots` : ""}`);
} else {
  console.log(json);
}
console.log(`\n/* ---- suggested starting point ---- */\n${suggest(report)}`);
console.error(`\nMethod: ${report.method}${bin ? "" : " (agent-browser not found; install it for computed styles and screenshots)"}. Next: read .claude/skills/clone-brand-style/SKILL.md and map these values onto the theme tokens.`);
