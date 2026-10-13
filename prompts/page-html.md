# How to write page.html

A page is a folder: `sites/<site>/pages/<slug>/` with `meta.json` and `page.html`.
`page.html` is a **fragment**: the content of the article only. The build wraps it in the site shell. What the shell adds depends on the site `mode` (see `AGENTS.md`): the header, a meta line (page type, updated date, reading time; never an author), the disclosure (only if `site.json` has one), "On this page", the CTA box and the footer. Site mode also adds breadcrumbs and related guides. The `landing` and `article` layouts use a lighter shell (see "Product landing pages" and "Blog articles" below). Both the AI script and coding agents follow this file.

**Before you write, read `sites/<site>/RULES.md` if it exists.** It overrides the generic rules and the examples below (for example: who is #1, CTA wording, whether the owner's product shows a price, no disclosure).

See every component live: `npm run dev`, then http://localhost:4321/styleguide/ (switch light and dark in the yellow bar). Design notes: `docs/design.md`.

## meta.json

```json
{
  "title": "Keyword in 60 characters or less",
  "description": "155 characters or less",
  "keyword": "the search query",
  "status": "draft",
  "updated": "2026-10-07",
  "ownProduct": false,
  "featured": false,
  "type": "guide",
  "layout": "guide",
  "hub": "",
  "related": []
}
```

Optional per-page CTA (for example a course page on a product site):

```json
"cta": { "label": "See the course", "url": "https://example.com/course", "text": "One sentence about the course." }
```

- `type`: `guide` (how-to or explainer), `comparison` (ranked list or X vs Y), `tool` (calculator or checker). It sets the label on the page and the grouping on hub pages.
- `layout`: `guide` (default: article column, meta line, "On this page", CTA box), `landing` (full-width sections with a logo + CTA header; start from `templates/landing.html`) or `article` (one narrow centred column with serif headings and no site header; start from `templates/blog-article.html`). The two non-default layouts add no meta line, rail, CTA box or related guides: the page carries its own CTAs. See the sections below.
- `hub`: site mode only. A slug from `site.json` `hubs`. The page then shows on that topic page and its breadcrumbs go through it. Leave `""` in hub and single mode.
- `related`: site mode only. Slugs to show first under "Related guides". The build fills the rest by hub and keyword.
- `featured`: site mode only. Lists the page first on the home and hub pages. No effect in hub or single mode.
- `cta` (optional): overrides the site CTA on this page only: the CTA box after the article, the phone sticky bar, the hub-mode footer button and `{{cta_url}}`. In hub and single mode the header button uses `site.json` `navCta` when it is set; only without `navCta` does the header follow `meta.cta`.

## Structure

1. Exactly one `<h1>`. The build puts the meta line (and the disclosure, if the site has one) right after it.
2. Answer the query at the top, in a quick-answer box.
3. Use `<h2>` sections. The build gives them ids and makes the "On this page" list from them (when there are 3 or more). Keep paragraphs short.
4. Site and hub mode: link to 1 to 3 other pages in the text with `{{link:<slug>}}` and real anchor text. (Hub mode does not require it, because the footer links every page. Single mode cannot use it.)
5. End with an FAQ and a short list of sources.
6. Do not add `<html>`, `<head>`, `<body>`, a site header or a footer. The shell adds them.

## Components (copy and paste)

Quick answer (first thing after the h1):

```html
<div class="quick-answer"><strong>Quick answer</strong>For most founders the best start is <strong>X</strong>. Pick <strong>Y</strong> if …</div>
```

Verdict (end of a comparison) and callouts:

```html
<div class="verdict"><strong>Verdict</strong>Pick X if … Pick Y if …</div>
<div class="callout"><strong>Note</strong>Prices change. Every price shows the date we checked it.</div>
<div class="callout warn"><strong>Limit</strong>The calculator does not include tax.</div>
```

Key numbers:

```html
<div class="stats">
  <div class="stat"><b>US$0</b>Free plan</div>
  <div class="stat"><b>2 h</b>Course length</div>
  <div class="stat"><b>8</b>Courses compared</div>
</div>
```

Comparison table. Mark your own product's row with `class="own"`. Right-align numbers with `class="num"`. The build wraps tables so they scroll on phones:

```html
<table>
  <thead><tr><th>Course</th><th>Best for</th><th class="num">Price</th></tr></thead>
  <tbody>
    <tr><td><a href="https://…">Course A</a></td><td>Beginners</td><td class="num">Free</td></tr>
    <tr class="own"><td>Our course <span class="badge">Our product</span></td><td>Founders</td><td class="num">$799</td></tr>
  </tbody>
</table>
```

Steps and checklists:

```html
<ol class="steps">
  <li><strong>Pick one keyword.</strong> Write it the way a person types it.</li>
  <li><strong>Read the top results.</strong> Note what they cover and what they miss.</li>
</ol>
<ul class="checks"><li>One h1</li><li>Quick answer at the top</li></ul>
```

FAQ:

```html
<h2>FAQ</h2>
<div class="faq">
  <details><summary>Can I learn SEO for free?</summary><p>Yes. …</p></details>
  <details><summary>What is GEO?</summary><p>…</p></details>
</div>
```

Ranked list entry (use one per item in a "best X" page; the build turns them into ItemList structured data):

```html
<section class="item own" id="item-1">
  <header><span class="rank">1</span><h3>Course name</h3><span class="badge">Our product</span></header>
  <p class="tagline">One line: what it is.</p>
  <dl class="facts"><dt>Best for</dt><dd>…</dd><dt>Price</dt><dd>US$299 one-time (checked 2026-10-07)</dd></dl>
  <p>Two to four short sentences of facts.</p>
  <div class="pros-cons">
    <div><h4>Pros</h4><ul class="pros"><li>…</li></ul></div>
    <div><h4>Cons</h4><ul class="cons"><li>…</li></ul></div>
  </div>
  <p><a class="btn ghost" href="https://…" rel="noopener">Visit Course name</a></p>
  <p class="src">Sources: <a href="https://…">Official page</a></p>
</section>
```

Buttons, badges, two columns, sources:

```html
<a class="btn" href="{{cta_url}}">Primary</a> <a class="btn lg arrow" href="{{cta_url}}">Large with arrow</a> <a class="btn ghost" href="{{guides}}">Secondary</a> <a class="btn small" href="…">Small</a>
<span class="badge">Our product</span> <span class="badge solid">Our pick</span> <span class="badge neutral">Free</span> <span class="badge ok">Checked 2026-10-07</span>
<div class="two-col"><div>…</div><div>…</div></div>
<ul class="src"><li><a href="https://…">Source title</a></li></ul>
```

## "Top N" comparison pages

Start from **`templates/top-n.html`** (read the site's `RULES.md` first): copy it to `sites/<site>/pages/<slug>/page.html`, then replace every `[[placeholder]]` (the validator errors if one is left). Preview the empty template at http://localhost:4321/templates/top-n/ in `npm run dev`. The order is: h1 and quick answer that names #1, the winner card, an at-a-glance table, compact entries for #2..#N, an inline CTA band, "Why we picked #1", FAQ, a closing CTA, sources. The pieces:

Winner card (the #1 pick, first thing after the quick answer). Keep `class="item"` so it joins the ItemList schema. If the site's `RULES.md` forbids a price for the owner's product, put its link text in `.winner-offer` instead (for example `<b><a href="{{utm:https://example.com/}}">See current plans on example.com</a></b>`). Add a disclosure sentence to `.winner-note` only if the site's rules want one:

```html
<section class="item winner own" id="item-1">
  <p class="winner-kicker"><span class="badge solid">Our pick</span><span>#1 of 3 compared</span><span class="badge neutral">Best for founders</span></p>
  <h3>Product name</h3>
  <p class="winner-why">One line: the main reason it is #1, said as what it does for the reader.</p>
  <ul class="winner-benefits"><li>Benefit, a fact from the official page</li><li>Benefit</li><li>Benefit</li><li>Benefit (optional)</li></ul>
  <p class="winner-offer"><b>US$299</b><span>one-time · checked 2026-10-07</span><span class="badge ok">Offer line, only if published</span></p>
  <p class="winner-actions"><a class="btn lg arrow" href="{{utm:https://example.com/product}}" rel="noopener">Visit Product</a><a class="alt" href="#why-we-picked-product">Why we picked it</a></p>
  <p class="winner-note">Source: <a href="{{utm:https://example.com/product}}" rel="noopener">Official page</a>.</p>
</section>
```

At-a-glance table. The winner's row gets `class="own"` (accent bar, bold, tinted). Buttons are allowed in cells:

```html
<table class="compare">
  <thead><tr><th>#</th><th>Pick</th><th>Best for</th><th>Price</th><th></th></tr></thead>
  <tbody>
    <tr class="own"><td>1</td><td><a href="#item-1">Product</a></td><td>Founders</td><td>US$299 one-time</td><td><a class="btn small arrow" href="{{utm:https://example.com/product}}" rel="noopener">Visit</a></td></tr>
    <tr><td>2</td><td><a href="#item-2">Other</a></td><td>Beginners</td><td>Free</td><td><a class="btn ghost small" href="https://other.example/" rel="noopener">Visit</a></td></tr>
  </tbody>
</table>
```

Compact ranked entries for #2..#N (same fields as the full item, less space, own button):

```html
<section class="item compact" id="item-2">
  <header><span class="rank">2</span><h3>Other product</h3><span class="badge neutral">Best for beginners</span></header>
  <p class="tagline">One line: what it is and who makes it.</p>
  <dl class="facts"><dt>Best for</dt><dd>…</dd><dt>Price</dt><dd>Free (checked 2026-10-07)</dd></dl>
  <p>Two to four short sentences of facts.</p>
  <div class="pros-cons"><div><h4>Pros</h4><ul class="pros"><li>…</li></ul></div><div><h4>Cons</h4><ul class="cons"><li>…</li></ul></div></div>
  <p class="actions"><a class="btn ghost" href="https://other.example/" rel="noopener">Visit Other</a><span class="src">Source: <a href="https://other.example/" rel="noopener">Official page</a></span></p>
</section>
```

Inline CTA band (one per page, after the ranked entries; add `strong` for a solid accent band) and closing CTA:

```html
<aside class="cta-band"><div><strong>Want the full method, not just the list?</strong><p>One sentence that says what the reader gets.</p></div><a class="btn arrow" href="{{cta_url}}" rel="noopener">See the course</a></aside>

<section class="cta-final">
  <h2>Ready to start?</h2>
  <p>Say what happens after the click.</p>
  <p class="actions"><a class="btn lg arrow" href="{{utm:https://example.com/product}}" rel="noopener">Visit Product</a><a class="btn ghost lg" href="#item-2">Compare the others</a></p>
  <p class="fine">US$299 one-time, checked 2026-10-07.</p>
</section>
```

A sticky bottom CTA bar on phones is a site setting (`"cta": { "sticky": true }` in `site.json`), not page markup. It is the same for every visitor, adds bottom padding so it never covers text, and can be dismissed.

Calculator (tool pages). Keep every number the script uses in a plain table too:

```html
<form class="calc" id="calc" onsubmit="return false">
  <div class="fields">
    <div class="field"><label for="people">People</label><input id="people" type="number" min="1" value="3"></div>
    <div class="field"><label for="plan">Plan</label><select id="plan"><option value="48">Team, US$48</option><option value="0">Free</option></select></div>
  </div>
  <div class="result"><output id="total">US$144</output><p class="meta" id="note">3 × US$48 a year.</p></div>
</form>
<script>
(function () {
  var f = document.getElementById("calc");
  function update() {
    var people = Number(document.getElementById("people").value) || 1;
    var price = Number(document.getElementById("plan").value);
    document.getElementById("total").textContent = "US$" + (people * price).toLocaleString("en-US");
  }
  f.addEventListener("input", update); update();
})();
</script>
```

Cards are available (`.cards > a.card`) but rows are the default list style. Avoid cards for lists of pages.

## Product landing pages (`"layout": "landing"`)

Start from **`templates/landing.html`** (read the site's `RULES.md` first) and set `"layout": "landing"` in `meta.json`. Preview the empty template at http://localhost:4321/templates/landing/. The shell adds only a logo + CTA header and a footer; everything else is the page. Each section is `<section class="lp-…"><div class="container">…</div></section>`; `.lp-section.alt` gets the surface colour. Keep the order: hero → strip → features → how it works → compare → who it is for → FAQ → final CTA. Delete sections you cannot fill. No testimonials, logos, ratings or counts unless they are real and sourced; the template has no slot for them.

Hero (eyebrow, `<h1>` with the keyword, subhead, primary + secondary CTA, optional trust line that states a published fact, optional mock window). Add `class="center"` to the section and drop `.lp-visual` for a text-only hero:

```html
<section class="lp-hero"><div class="container">
  <div>
    <p class="lp-eyebrow">AI agent for SEO and GEO</p>
    <h1>The AI SEO agent that publishes, not just reports</h1>
    <p class="lp-sub">Two sentences. What it does for the reader and how.</p>
    <p class="lp-actions"><a class="btn lg arrow" href="{{cta_url}}" rel="noopener">Visit Product</a><a class="btn ghost lg" href="#how-it-works">See how it works</a></p>
    <p class="lp-trust">Works with any CMS. <b>No credit card</b> for the first site.</p>
  </div>
  <div class="lp-visual">
    <div class="mock-window" role="img" aria-label="What the screen shows, in one sentence">
      <div class="mock-bar"><i></i><i></i><i></i><span>Product</span></div>
      <div class="mock-body">
        <span class="mock-chip">This week</span>
        <div class="mock-row"><span class="mock-dot"></span><b>Keyword found</b><span>Done</span></div>
        <div class="mock-row"><span class="mock-dot pending"></span><b>Page waiting for approval</b><span>In review</span></div>
        <div class="mock-row"><span class="mock-dot todo"></span><b>Submit for indexing</b><span>Next</span></div>
        <div class="mock-lines"><i></i><i></i><i></i></div>
      </div>
    </div>
  </div>
</div></section>
```

The mock window is CSS only (no images). Labels are real steps or features; never numbers, results or customer names.

Problem → outcome strip:

```html
<section class="lp-strip"><div class="container">
  <div class="lp-before"><h3>Doing it by hand</h3><ul><li>Pain 1</li><li>Pain 2</li><li>Pain 3</li></ul></div>
  <div class="lp-arrow" aria-hidden="true">&rarr;</div>
  <div class="lp-after"><h3>With Product</h3><ul><li>Outcome 1</li><li>Outcome 2</li><li>Outcome 3</li></ul></div>
</div></section>
```

Section head (used by every section below) and the feature grid (3 to 6 cards; the icon is optional inline SVG, 24×24 viewBox, strokes only):

```html
<section class="lp-section lp-features" id="features"><div class="container">
  <div class="lp-head"><p class="kicker">What it does</p><h2>One agent for the whole SEO loop</h2><p>One sentence that frames the features.</p></div>
  <div class="lp-grid">
    <div class="lp-feature"><div class="lp-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg></div><h3>Benefit</h3><p>How the feature delivers it, from the official page.</p></div>
    <div class="lp-feature"><h3>Benefit without an icon</h3><p>…</p></div>
  </div>
</div></section>
```

How it works (exactly three steps, numbered by CSS):

```html
<section class="lp-section alt" id="how-it-works"><div class="container">
  <div class="lp-head"><p class="kicker">How it works</p><h2>From keyword to indexed page in three steps</h2></div>
  <ol class="lp-how">
    <li><h3>Connect your site</h3><p>What happens, and what the reader does.</p></li>
    <li><h3>Review the queue</h3><p>…</p></li>
    <li><h3>Approve and track</h3><p>…</p></li>
  </ol>
</div></section>
```

Why this vs by hand / other tools (the product's column has `class="own"`; `.yes` adds a tick, `.no` greys a dash):

```html
<section class="lp-section lp-compare" id="compare"><div class="container">
  <div class="lp-head"><p class="kicker">Compare</p><h2>Product vs doing it by hand vs point tools</h2></div>
  <table>
    <thead><tr><th></th><th>By hand</th><th>Point tools</th><th class="own">Product</th></tr></thead>
    <tbody>
      <tr><td>Finds what to publish</td><td>Quarterly</td><td>Keyword lists only</td><td class="own"><span class="yes">Weekly</span></td></tr>
      <tr><td>Gets it indexed</td><td><span class="no">&mdash;</span></td><td><span class="no">&mdash;</span></td><td class="own"><span class="yes">Yes</span></td></tr>
    </tbody>
  </table>
  <p class="meta">Checked 2026-10-12 on each official page.</p>
</div></section>
```

Use cases (2 to 4 rule-separated rows), FAQ (same `<details>` as everywhere; centred at column width) and the final CTA (`.cta-final.strong` is the solid accent block; drop `strong` for a quiet box):

```html
<section class="lp-section alt lp-uses" id="who"><div class="container">
  <div class="lp-head"><p class="kicker">Who it is for</p><h2>Built for teams that publish to rank</h2></div>
  <div class="lp-grid">
    <div class="lp-use"><h3>B2B SaaS founders</h3><p>What they get.</p></div>
    <div class="lp-use"><h3>Agencies</h3><p>What they get.</p></div>
  </div>
</div></section>

<section class="lp-section lp-faq" id="faq"><div class="container">
  <div class="lp-head"><h2>Questions</h2></div>
  <div class="faq"><details><summary>Question?</summary><p>Answer.</p></details></div>
</div></section>

<section class="lp-section lp-final"><div class="container">
  <section class="cta-final strong">
    <h2>Ready to try Product?</h2>
    <p>Say what happens after the click.</p>
    <p class="actions"><a class="btn lg arrow" href="{{cta_url}}" rel="noopener">Visit Product</a><a class="btn ghost lg" href="#features">See what it does</a></p>
    <p class="fine">Fine print: a published price with its date, or the RULES.md link text.</p>
  </section>
</div></section>
```

## Blog articles (`"layout": "article"`)

Start from **`templates/blog-article.html`** (read the site's `RULES.md` first) and set `"layout": "article"` in `meta.json`. Preview the empty template at http://localhost:4321/templates/blog-article/. There is no site header: the page starts with an optional notice bar, then the kicker and the `<h1>`. The column is 700px wide; headings use the serif (`--font-serif`); body text keeps the site's sans. Order: notice bar → kicker, h1, dek, meta line → why this matters → quick comparison → picks (CTA band after #1) → which one should you use → FAQ → closing CTA → sources.

Head of the article. `{{updated}}` becomes `<time datetime="2026-10-12">12 October 2026</time>` from `meta.updated`; never type the date by hand. Use `notice-bar soft` for a quiet bar; delete the bar if the site's rules forbid a disclosure:

```html
<p class="notice-bar">We make Product A. The other two tools are included because they are the common alternatives.</p>
<p class="article-kicker">SEO tools</p>
<h1>Top 3 best instant indexing tools</h1>
<p class="dek">Two sentences: the reader's problem and what this article gives them.</p>
<p class="article-meta">Updated {{updated}} &middot; Compared: Product A &middot; Product B &middot; Product C</p>
```

A ranked pick. Keep `class="item"` so it joins the ItemList schema. The #1 pick adds `own` (accent top rule) and a solid button; the others get `btn ghost`:

```html
<section class="item pick own" id="pick-1">
  <header class="pick-head"><span class="pick-no">1</span><h3>Product A</h3><span class="badge neutral">Best for speed and volume</span></header>
  <p>What it is and how it works, from the official page.</p>
  <p>The standout feature and who it is built for.</p>
  <div class="pick-notes">
    <div class="plus"><h4>Strengths</h4><ul><li>Real strength</li><li>Real strength</li></ul></div>
    <div class="minus"><h4>Worth knowing</h4><ul><li>Real limit</li></ul></div>
  </div>
  <p class="pick-cta"><a class="btn lg arrow" href="{{utm:https://example.com/product}}" rel="noopener">Visit Product A</a><span class="src">Source: <a href="{{utm:https://example.com/product}}" rel="noopener">Official page</a></span></p>
</section>

<aside class="cta-band"><div><strong>Publishing more than a few pages a week?</strong><p>One sentence that says what the reader gets.</p></div><a class="btn arrow" href="{{cta_url}}" rel="noopener">Visit Product A</a></aside>
```

The quick comparison is a normal `table.compare` with `tr.own` on #1 (see the Top N snippets). The verdict, FAQ, closing `.cta-final` and `ul.src` sources are the same components as everywhere else.

## Page-only styles

You may add a `<style>` block. Use the tokens so the page works in light and dark mode: `--bg --surface --fg --fg-2 --muted --line --line-strong --accent --accent-ink --accent-hover --accent-soft --ok --warn --bad`, shape `--radius --radius-lg --radius-btn --shadow-card`, spacing `--s-1` (4px) to `--s-8` (64px), widths `--col`. Do not hard-code colours.


## Links to your own product (rule, enforced)

Every link to your own product must be `{{utm:https://…}}`, `{{cta_url}}` or `{{brand_url}}`, e.g. `<a class="btn" href="{{utm:https://example.com/course}}">`. This includes source links at the bottom of the page. The build adds UTM tags (`utm_source` = apps-script or static, `utm_medium`, `utm_campaign`, `utm_content` = page slug) so analytics show which version sent each visit. The validator **errors** on a plain `href="https://…"` to any host in `site.json` `ownDomains`, or to any URL under `brand.url` or `cta.url`.

## Structured data

The build adds it from your markup: `FAQPage` from `<details><summary>` pairs, `ItemList` from `<section class="item">` entries, plus `Article` and breadcrumbs. Do not hand-write JSON-LD for these.

## Links

Use placeholders so one file works on Apps Script and on your own domain:

| Placeholder | Becomes |
|---|---|
| `{{link:<slug>}}` | Another page on the site. The validator checks that it exists |
| `{{hub:<slug>}}` | A hub (topic) page. Site mode only |
| `{{home}}` | The home page (every mode) |
| `{{guides}}`, `{{about}}`, `{{sitemap}}` | The guides index, About and HTML sitemap pages. Site mode only |
| `{{brand_url}}` | Your product, with UTM tags |
| `{{cta_url}}` | The site CTA link, with UTM tags |
| `{{utm:https://…}}` | Any other URL on your own domain, with UTM tags |
| `{{updated}}` | `<time datetime="…">12 October 2026</time>` from `meta.updated` (pages only). Use it in the article meta line |

In `hub` sites there are no hub, guides, About or HTML sitemap pages, so `{{hub:…}}`, `{{guides}}`, `{{about}}` and `{{sitemap}}` are errors; `{{link:…}}` works. In `single` sites `{{link:…}}` is an error too. The validator checks this.

Link to sources with normal `https://` URLs. In-page links (`href="#section"`) work too; `<h2>` ids are made from the heading text (`How we chose` → `#how-we-chose`).

## Charts and interactive parts

- You may load a library from `https://cdnjs.cloudflare.com/ajax/libs/<lib>/<exact version>/...` (for example Chart.js) and add a `<script>` that draws a chart.
- Read colours from the theme so charts match the site's colours (and dark mode, when `theme.scheme` is `auto`):

```html
<figure><div class="chart"><canvas id="c" aria-label="Bar chart of yearly cost"></canvas></div><figcaption>Yearly cost in US$. Checked 2026-10-07.</figcaption></figure>
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js"></script>
<script>
  var t = getComputedStyle(document.documentElement);
  var v = function (n) { return t.getPropertyValue(n).trim(); };
  Chart.defaults.color = v("--muted"); Chart.defaults.borderColor = v("--chart-grid"); Chart.defaults.font.family = v("--font-sans");
  new Chart(document.getElementById("c"), { type: "bar", data: { labels: ["A", "B"], datasets: [{ data: [0, 48], backgroundColor: [v("--chart-1"), v("--chart-2")] }] }, options: { plugins: { legend: { display: false } } } });
</script>
```

- **Always put the same facts in plain HTML too** (a table or a list). Google renders scripts. Most AI crawlers and Bing often do not.
- Keep pages light: under about 250 KB of HTML.

## Not allowed (the validator blocks these)

Scripts that read the user agent, detect bots, redirect (`location = …`, `location.replace`, meta refresh), open windows, or embed other sites in an `<iframe>`. Every visitor and every crawler must get the same page. Also: leftover template placeholders (`[[anything]]`), and plain links to your own product without `{{utm:…}}`.
