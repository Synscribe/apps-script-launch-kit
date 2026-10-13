// Living style guide. Served by the dev server at /styleguide/ only. Never built or published.
// It renders every component in the theme with the real site shell, so what you see is what pages get.
import { layout, esc } from "./render.js";

const section = (id, title, note, body) => `<section class="sg" id="${id}"><div class="section-head"><h2>${esc(title)}</h2><code>${esc(note)}</code></div>${body}</section>`;

export function renderStyleguide(ctx) {
  const { site } = ctx;
  const swatch = (name) => `<div class="sw"><span style="background:var(${name})"></span><code>${name}</code></div>`;
  const colours = ["--bg", "--surface", "--surface-2", "--fg", "--fg-2", "--muted", "--line", "--line-strong", "--accent", "--accent-ink", "--accent-soft", "--ok", "--warn", "--bad", "--chart-1", "--chart-2", "--chart-3", "--chart-4", "--chart-5"];
  const sections = [
    section("tokens", "Colour tokens", "themes/default/tokens.css", `<div class="swatches">${colours.map(swatch).join("")}</div><p class="meta">Site accent from site.json: <code>${esc(site.theme.accent)}</code>. Dark mode follows the system, or <code>?theme=dark</code> here.</p>`),

    section("type", "Type scale", "system font stack", `
<p class="kicker">Kicker · .kicker</p>
<h1>Heading one, 2 to 2.75rem</h1>
<h2 style="border:0;padding:0;margin-top:16px">Heading two, 1.375rem</h2>
<h3>Heading three, 1.125rem</h3>
<h4>Heading four, 1rem</h4>
<p class="lead">Lead paragraph (.lead). One or two sentences that say what the page answers.</p>
<p>Body text, 16px on phones and 17px from 700px up. Line height 1.6. Links look <a href="#type">like this</a>, with <strong>bold</strong>, <code>code</code> and <small>small</small>.</p>
<p class="meta">Meta text (.meta): dates, counts, sources.</p>`),

    section("buttons", "Buttons and badges", ".btn .btn.lg .btn.arrow .btn.ghost .btn.small .badge .badge.solid", `
<p><a class="btn" href="#buttons">Primary button</a> <a class="btn arrow" href="#buttons">With arrow</a> <a class="btn ghost" href="#buttons">Ghost button</a> <a class="btn small" href="#buttons">Small</a> <a class="btn ghost small" href="#buttons">Ghost small</a></p>
<p><a class="btn lg arrow" href="#buttons">Large primary CTA</a> <a class="btn ghost lg" href="#buttons">Large ghost</a></p>
<p><span class="badge">Our product</span> <span class="badge solid">Our pick</span> <span class="badge neutral">Free</span> <span class="badge ok">Checked 2026-10-07</span> <span class="badge warn">Price rises Jan 2027</span></p>
<p class="meta">Buttons use <code>--radius-btn</code> (999px makes pills) and darken to <code>--accent-hover</code>. Add <code>.block</code> for full width on phones.</p>`),

    section("winner", "Winner card (#1 pick)", "section.item.winner.own > .winner-kicker h3 .winner-why ul.winner-benefits .winner-offer .winner-actions .winner-note", `
<section class="item winner own" style="margin-top:0"><p class="winner-kicker"><span class="badge solid">Our pick</span><span>#1 of 3 compared</span><span class="badge neutral">Best for founders</span></p>
<h3>Example Pro Course</h3>
<p class="winner-why">The only course here that teaches Google SEO and AI search as one method, with coaching.</p>
<ul class="winner-benefits"><li>Covers GEO: getting cited in ChatGPT and AI Overviews</li><li>Two coaching sessions with the people who run the method on clients</li><li>Works with any SEO tool, not one vendor's</li><li>Lifetime access to updates</li></ul>
<p class="winner-offer"><b>US$299</b><span>one-time · checked 2026-10-07</span><span class="badge ok">Offer line, only if published</span></p>
<p class="winner-actions"><a class="btn lg arrow" href="#winner">See the course</a><a class="alt" href="#winner">Why we picked it</a></p>
<p class="winner-note">Source: <a href="#winner">Course page</a>. Fictional demo content.</p></section>`),

    section("compact", "Compact ranked entries (#2..#N)", "section.item.compact > header .rank h3 .badge · .tagline .facts .pros-cons p.actions", `
<section class="item compact"><header><span class="rank">2</span><h3>Example Free Course</h3><span class="badge neutral">Best free start</span></header>
<p class="tagline">A free beginner course from a tool vendor (fictional).</p>
<dl class="facts"><dt>Best for</dt><dd>Beginners who want a free start</dd><dt>Price</dt><dd>Free (checked 2026-10-07)</dd></dl>
<div class="pros-cons"><div><h4>Pros</h4><ul class="pros"><li>Free, with a certificate</li><li>Short lessons</li></ul></div><div><h4>Cons</h4><ul class="cons"><li>Built around one vendor's tools</li></ul></div></div>
<p class="actions"><a class="btn ghost" href="#compact">Visit Example Free</a><span class="src">Source: <a href="#compact">Official page</a></span></p></section>
<section class="item compact"><header><span class="rank">3</span><h3>Example Cert Course</h3><span class="badge neutral">Best for exams</span></header>
<p class="tagline">A paid certification with exams (fictional).</p>
<dl class="facts"><dt>Best for</dt><dd>Agency staff who want a certificate</dd><dt>Price</dt><dd>US$595 one-time (checked 2026-10-07)</dd></dl>
<p class="actions"><a class="btn ghost" href="#compact">Visit Example Cert</a><span class="src">Source: <a href="#compact">Official page</a></span></p></section>`),

    section("ctaband", "Inline CTA band and closing CTA", ".cta-band · .cta-band.strong · .cta-final", `
<aside class="cta-band" style="margin-top:0"><div><strong>Want the full method, not just the course list?</strong><p>${esc(site.cta.text)}</p></div><a class="btn arrow" href="#ctaband">${esc(site.cta.label)}</a></aside>
<aside class="cta-band strong"><div><strong>Solid variant (.strong)</strong><p>Use one band per page, after the ranked entries.</p></div><a class="btn arrow" href="#ctaband">${esc(site.cta.label)}</a></aside>
<section class="cta-final" style="margin-top:var(--s-5)"><h2>Ready to start?</h2><p>Say what happens after the click: a course page, a demo, a free plan.</p><p class="actions"><a class="btn lg arrow" href="#ctaband">${esc(site.cta.label)}</a><a class="btn ghost lg" href="#compact">Compare the others</a></p><p class="fine">US$299 one-time, checked 2026-10-07.</p></section>
<p class="meta" style="margin-top:var(--s-4)">Sticky bottom bar on phones: set <code>"cta": { "sticky": true }</code> in site.json (currently <b>${site.cta.sticky ? "on" : "off"}</b> for this site). Shrink the window below 760px to see it. The whole Top N layout is at <a href="/templates/top-n/">/templates/top-n/</a>.</p>`),

    section("layouts", "Page layouts (meta.json \"layout\")", "guide (default) · landing · article", `
<ol class="rows">
<li><a class="row-title" href="/templates/top-n/">guide</a><p>The default shell: article column, meta line, "On this page", CTA box, related guides (site mode). Every component above renders in it.</p><span class="row-meta"><b>templates/top-n.html</b> · /templates/top-n/</span></li>
<li><a class="row-title" href="/templates/landing/">landing</a><p>A product landing page: hero with a mock product window, problem → outcome strip, feature grid, three steps, comparison table, use cases, FAQ, final CTA. Header is the logo + CTA; no meta line, rail or CTA box.</p><span class="row-meta"><b>templates/landing.html</b> · /templates/landing/</span></li>
<li><a class="row-title" href="/templates/blog-article/">article</a><p>An editorial post: optional notice bar, kicker, serif headline (--font-serif), dek, meta line, ranked picks as cards, FAQ, sources. No site header; slim footer on a single site.</p><span class="row-meta"><b>templates/blog-article.html</b> · /templates/blog-article/</span></li>
</ol>
<p class="meta">Landing classes: <code>.lp-hero .lp-eyebrow .lp-sub .lp-actions .lp-trust .mock-window .lp-strip .lp-section .lp-head .lp-grid .lp-feature .lp-how .lp-compare .lp-use .cta-final.strong</code>. Article classes: <code>.notice-bar .article-kicker .dek .article-meta .item.pick .pick-head .pick-no .pick-notes .pick-cta</code>. Snippets in <code>prompts/page-html.md</code>.</p>`),

    section("boxes", "Boxes", ".quick-answer .verdict .callout .callout.warn .disclosure", `
<div class="quick-answer"><strong>Quick answer</strong>The first box on every page. It answers the query in two or three sentences. Use <strong>bold</strong> for the pick.</div>
<div class="verdict"><strong>Verdict</strong>Same style with another label. Use it at the end of a comparison.</div>
<div class="callout"><strong>Note</strong>A tip, a limit or an edge case. Plain surface, no accent.</div>
<div class="callout warn"><strong>Check the date</strong>Prices change. Every price shows the date we checked it.</div>
<div class="disclosure">The disclosure line from site.json. The shell adds it after the h1 when ownProduct is true.</div>`),

    section("stats", "Key numbers", ".stats > .stat", `
<div class="stats"><div class="stat"><b>US$0</b>Free plan</div><div class="stat"><b>2 h</b>Course length</div><div class="stat"><b>8</b>Courses compared</div><div class="stat"><b>2026-10-07</b>Prices checked</div></div>`),

    section("rows", "Rows (lists of pages)", ".rows > li > .row-title + p + .row-meta", `
<ol class="rows">
<li><a class="row-title" href="#rows">Best SEO course: 8 free and paid picks</a><p>One sentence that says what the page compares and how.</p><span class="row-meta"><b>Comparison</b> · Updated 2026-10-07</span></li>
<li><a class="row-title" href="#rows">How to check an SEO agency's report</a><p>A how-to with steps and a checklist.</p><span class="row-meta"><b>Guide</b> · Updated 2026-10-07</span></li>
<li><a class="row-title" href="#rows">SEO course cost calculator</a><p>Enter hours and price to compare total cost.</p><span class="row-meta"><b>Tool</b> · Updated 2026-10-07</span></li>
</ol>
<a class="more" href="#rows">All guides</a>`),

    section("cards", "Cards (use sparingly)", ".cards > .card", `
<div class="cards"><a class="card" href="#cards"><h3>Card title</h3><p>Two lines of description at most.</p><span class="meta">Updated 2026-10-07</span></a><a class="card" href="#cards"><h3>Second card</h3><p>Cards are for a small set of equal choices. Rows are the default.</p><span class="meta">Updated 2026-10-07</span></a><a class="card" href="#cards"><h3>Third card</h3><p>No shadows, 6px corners, hairline border.</p><span class="meta">Updated 2026-10-07</span></a></div>`),

    section("table", "Tables", "<table> inside .table-wrap · tr.own · td.num", `
<div class="table-wrap"><table><thead><tr><th>#</th><th>Pick</th><th>Best for</th><th class="num">Price</th></tr></thead><tbody>
<tr class="own"><td>1</td><td><a href="#table">Example Pro Course</a> <span class="badge">Our product</span></td><td>Founders who want one full method</td><td class="num">US$299</td></tr>
<tr><td>2</td><td><a href="#table">Example Free Course</a></td><td>Beginners who want a free start</td><td class="num">Free</td></tr>
<tr><td>3</td><td><a href="#table">Example Cert Course</a></td><td>Agency staff who want exams</td><td class="num">US$595</td></tr>
</tbody></table></div>`),

    section("steps", "Steps and checklists", "ol.steps · ul.checks", `
<ol class="steps"><li><strong>Pick one keyword.</strong> Write the query the way a person types it.</li><li><strong>Read the top results.</strong> Note what they cover and what they miss.</li><li><strong>Write the page.</strong> Answer first, then the detail.</li></ol>
<ul class="checks"><li>One h1 on the page</li><li>Quick answer at the top</li><li>Every price has a date</li></ul>`),

    section("faq", "FAQ", "<details><summary>", `
<div class="faq"><details><summary>Can I learn SEO for free?</summary><p>Yes. Several vendors have free courses. Paid courses add depth, practice or coaching.</p></details><details open><summary>What is GEO?</summary><p>GEO means generative engine optimization: the work to get your brand cited in AI answers.</p></details></div>`),

    section("item", "Listicle item", ".item .item.own .rank .facts .pros-cons", `
<section class="item own"><header><span class="rank">1</span><h3>Example Pro Course</h3><span class="badge">Our product</span></header>
<p class="tagline">A paid course with coaching (fictional).</p>
<dl class="facts"><dt>Best for</dt><dd>Founders who want to own SEO and AI search strategy</dd><dt>Price</dt><dd>US$299 one-time (checked 2026-10-07)</dd></dl>
<p>Two to four short sentences of facts, each one backed by a source.</p>
<div class="pros-cons"><div><h4>Pros</h4><ul class="pros"><li>Deepest coverage in this list</li><li>Two coaching sessions</li></ul></div><div><h4>Cons</h4><ul class="cons"><li>Most expensive course here</li><li>You must apply first</li></ul></div></div>
<p><a class="btn ghost" href="#item">Visit Example Pro</a></p><p class="src">Sources: <a href="#item">Course page</a> · <a href="#item">Home page</a></p></section>`),

    section("calc", "Calculator (tool pages)", ".calc .fields .field .result", `
<form class="calc" onsubmit="return false"><div class="fields">
<div class="field"><label for="sg-people">People</label><input id="sg-people" type="number" value="3" min="1"></div>
<div class="field"><label for="sg-plan">Plan <small>per person, per year</small></label><select id="sg-plan"><option>US$48</option><option>US$30</option></select></div>
<div class="field"><label for="sg-years">Years</label><input id="sg-years" type="number" value="2" min="1"></div>
</div><div class="result"><output>US$288</output><p class="meta">3 people × US$48 × 2 years. Demo numbers.</p></div></form>`),

    section("chart", "Chart colours", "--chart-1 … --chart-5 (read with getComputedStyle)", `
<figure><svg class="chart" viewBox="0 0 600 200" role="img" aria-label="Demo bar chart" style="min-height:0">
<line x1="40" y1="170" x2="580" y2="170" stroke="var(--chart-grid)"/>
<rect x="60" y="60" width="80" height="110" fill="var(--chart-1)"/><rect x="180" y="90" width="80" height="80" fill="var(--chart-2)"/><rect x="300" y="120" width="80" height="50" fill="var(--chart-3)"/><rect x="420" y="40" width="80" height="130" fill="var(--chart-4)"/>
<text x="100" y="188" font-size="12" text-anchor="middle" fill="var(--muted)">A</text><text x="220" y="188" font-size="12" text-anchor="middle" fill="var(--muted)">B</text><text x="340" y="188" font-size="12" text-anchor="middle" fill="var(--muted)">C</text><text x="460" y="188" font-size="12" text-anchor="middle" fill="var(--muted)">D</text>
</svg><figcaption>Demo chart drawn with the chart tokens. Chart.js pages read the same variables.</figcaption></figure>`),

    section("toc", "On this page", ".toc (rail) · details.toc-inline", `
<div class="two-col"><nav class="toc"><p class="kicker">On this page</p><ol><li><a href="#toc">How we chose</a></li><li><a href="#toc">The list</a></li><li><a href="#toc">Verdict</a></li><li><a href="#toc">FAQ</a></li></ol></nav>
<details class="toc toc-inline" open style="display:block;margin:0"><summary>On this page</summary><ol><li><a href="#toc">How we chose</a></li><li><a href="#toc">The list</a></li><li><a href="#toc">Verdict</a></li></ol></details></div>`),

    section("cta", "CTA box", ".cta-box (the shell adds it)", `
<aside class="cta-box" style="margin-top:0"><div><strong>${esc(site.cta.label)}</strong><p>${esc(site.cta.text)}</p></div><a class="btn" href="#cta">${esc(site.cta.label)}</a></aside>`),
  ];

  const main = `<main class="container page">
<nav class="crumbs" aria-label="Breadcrumb"><ol><li><a href="#top">Home</a></li><li><a href="#top">Topic</a></li><li aria-current="page">Style guide (dev only)</li></ol></nav>
<header class="hub-head"><p class="kicker">Theme: ${esc(site.theme.name)}</p><h1>Style guide</h1><p class="lead">Every component in the theme, rendered inside the real site shell. This page exists only in <code>npm run dev</code>. Snippets: <code>prompts/page-html.md</code>.</p>
<p class="meta">Jump to: ${sections.map((s) => { const id = s.match(/id="([^"]+)"/)[1]; return `<a href="#${id}">${id}</a>`; }).join(" · ")}</p></header>
<style>
.sg{padding:var(--s-6) 0;border-top:1px solid var(--line)}
.sg .section-head code{font-size:var(--text-xs);color:var(--muted);background:none}
.swatches{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:var(--s-3)}
.sw span{display:block;height:40px;border:1px solid var(--line);border-radius:var(--radius)}
.sw code{font-size:var(--text-xs);background:none;padding:0}
</style>
<div class="prose" style="max-width:var(--col)">
${sections.join("\n")}
</div>
</main>`;
  return layout(ctx, { title: `Style guide | ${site.name}`, description: "Dev-only style guide", key: "styleguide", main });
}
