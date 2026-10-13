# Design and site structure

How the site looks, how it is organised, and how to add pages. Written 2026-10-07, updated 2026-10-08.

This file is generic. Owner rules for one site (ranking, CTA wording, prices, disclosure, scheme) live in `sites/<site>/RULES.md` and override the defaults here. Example: `sites/example/RULES.md`.

The site is published twice from one source: as a Google Apps Script web app and as a static site. Both get the same HTML. Every page is one HTML file with the CSS inlined, so the design must be small, plain and self-contained.

## 1. Visual direction

**Goal:** look like a small, real reference site. Not a blog theme, not a landing page, not an "AI design" template.

What that means in practice:

- **Hierarchy from type and rules, not boxes.** Headings, hairline rules and a narrow reading column do the work. Cards exist but are not the default. Lists of pages are rule-separated rows.
- **One accent colour per site.** Everything else is a neutral. The default theme is flat: no gradients, no shadows, small corners (4px on controls, 6px on boxes). A cloned brand may change the shape tokens (`--radius-btn: 999px` for pill buttons, `--shadow-card` for soft cards) without touching the components.
- **System fonts by default, web font per site.** The default stack is `ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, …`: no extra request, no font flash. A site may set `theme.fontsUrl` in `site.json` (a Google Fonts `css2` URL works as a `<link>` on both targets, including the Apps Script HtmlService output; checked 2026-10-07 with Instrument Sans) and `--font-sans` in `sites/<site>/theme.css`, always with the system stack as fallback. Check `document.fonts.check('16px "Name"')` on the preview and on the real `/exec` URL.
- **CTAs are part of the design, not an afterthought.** A page has up to six ways to click through, each the same for every visitor and crawler: the header button (in hub and single mode `navCta` when set, else the CTA), the winner card (Top N pages), one inline CTA band, the closing CTA, the shell's CTA box after the article, and on phones an optional sticky bottom bar (`cta.sticky`). A page can set `meta.cta` to change the CTA box, the sticky bar, the hub-mode footer button and `{{cta_url}}` for that page; the header keeps `navCta` when it is set. Buttons are solid accent with a hover shade (`--accent-hover`), `.lg` for the main action, `.arrow` for "go" actions, `.ghost` for competitors and secondary links. Not every link is a button: competitor links in compact entries are ghost buttons so the primary stays primary.
- **No emoji markers, no uppercase hype.** Pros use `+`, cons use `−`, steps use numbers in a square. Small uppercase labels ("Quick answer", "On this page") are the only uppercase text.
- **Light and dark.** `theme.scheme` in `site.json`: `"auto"` (default) follows the system; `"light"` or `"dark"` forces one look for every visitor (the build sets `<html data-theme>`). Every colour is a token, so page-only styles must use tokens too. The dev server forces a mode with `?theme=` only when the scheme is `"auto"`. A site can make light-only a rule in its `RULES.md`.

### Tokens (`themes/default/tokens.css`)

| Group | Tokens | Notes |
|---|---|---|
| Colour | `--bg --surface --surface-2 --fg --fg-2 --muted --line --line-2 --line-strong` | Neutrals. Light: white page, `#f4f5f7` surfaces. Dark: `#0f1114` page |
| Accent | `--accent --accent-ink --accent-soft --accent-fg --accent-hover` | `--accent` comes from `site.json`. `--accent-ink` is the link colour; in dark mode it is a lighter mix so links stay readable. `--accent-soft` tints boxes. `--accent-hover` is the solid button hover (darker in light, lighter in dark) |
| Shape | `--radius --radius-lg --radius-btn --shadow-card` | Controls, boxes, buttons and badges, card shadow. A brand clone sets these |
| Headings | `--font-display --heading-weight --heading-tracking` | Heading face (defaults to `--font-sans`), weight, h1 letter-spacing |
| Article | `--font-serif --col-article` | Serif face for `article` page headings (Newsreader via `theme.serifFontsUrl`, then system serifs) and the article column width (700px). `layouts.css` |
| Status | `--ok --warn --bad` | Pros, cons, warnings |
| Charts | `--chart-1 … --chart-5 --chart-grid` | Read them from JS for Chart.js |
| Type | `--font-sans --font-mono`, `--text-xs` (12px) `--text-sm` (14) `--text-md` (16) `--text-lg` (18) `--text-xl` (22) `--text-2xl` (28) `--text-3xl` (32 to 44, fluid) | Body is 16px on phones, 17px from 700px up. Line height 1.6 |
| Space | `--s-1` (4px) to `--s-8` (64px) | 4px grid |
| Width | `--wide` 1120px, `--col` 720px, `--rail` 220px, `--gutter` 16px | Article column, "On this page" rail, phone gutter |

Per-site colour: `"theme": { "accent": "#2563eb" }`. Per-site CSS: `sites/<site>/theme.css`, inlined after the theme. Other theme: copy `themes/default/` to `themes/<name>/` and set `"theme": { "name": "<name>" }`.

### Components (`themes/default/components.css`)

All of them work inside a freeform `page.html`. Snippets are in `prompts/page-html.md`. See them live at http://localhost:4321/styleguide/ in `npm run dev` (dev only, never built).

| Component | Class | Use |
|---|---|---|
| Quick answer | `.quick-answer` | The first box on every page. Answers the query |
| Verdict | `.verdict` | Same box, other label, at the end of a comparison |
| Callout | `.callout`, `.callout.warn` | A note, a limit, an edge case |
| Key numbers | `.stats > .stat` | 2 to 4 numbers with labels |
| Rows | `.rows > li` | Lists of pages. The default list style |
| Cards | `.cards > .card` | A small set of equal choices. Use sparingly |
| Table | `<table>`, `tr.own`, `td.num` | Comparison tables. The build wraps tables so they scroll on phones |
| Steps | `ol.steps` | Numbered how-to steps |
| Checklist | `ul.checks` | A checklist |
| FAQ | `<details><summary>` | Questions at the end |
| Listicle item | `.item`, `.rank`, `.facts`, `.pros-cons`, `.actions` | One ranked entry |
| Compact item | `.item.compact` | Entries #2..#N under a winner card: same fields, less space, own button |
| Winner card | `.item.winner.own`, `.winner-kicker`, `.winner-why`, `.winner-benefits`, `.winner-offer`, `.winner-actions`, `.winner-note` | The #1 pick: name, one-line why, 3 to 4 benefits, price or offer line, large CTA and a secondary link |
| CTA band | `.cta-band`, `.cta-band.strong` | One inline band mid-page: a line, a sentence, a button |
| Closing CTA | `.cta-final` | Centred title, sentence, primary + ghost button, fine print |
| Sticky bar | `.sticky-cta` (shell, `cta.sticky`) | Phones only. Fixed bottom bar; body gets bottom padding so it never covers text; a hidden checkbox dismisses it, no script |
| Calculator | `form.calc`, `.fields`, `.field`, `.result` | Tool pages |
| Buttons, badges | `.btn`, `.btn.lg`, `.btn.arrow`, `.btn.ghost`, `.btn.small`, `.badge`, `.badge.solid` | Links that look like buttons. Small labels |
| On this page | `.toc` | The build makes it from the `<h2>` headings |

### Shell in `site` mode

- **Header:** logo (name with a small accent square), up to 5 hub links, "All guides", "About", CTA button. On phones the links move into a `<details>` menu. No JavaScript.
- **Breadcrumbs:** Home / Hub / Page. Also in JSON-LD (`BreadcrumbList`) when the site has a public URL.
- **Article:** 720px column. From 1100px, a 220px rail on the right shows "On this page" (sticky). Below 1100px the same list sits in a collapsed box before the first `<h2>`. Only when a page has 3 or more `<h2>`.
- **Meta line:** page type, updated date, reading time. No author. The disclosure follows it when `ownProduct` is true and `site.json` has a non-empty `disclosure`. An empty disclosure renders nothing anywhere and the validator does not require it.
- **After the article:** the CTA box, then "Related guides" (4 rows).
- **Footer:** site name, tagline and disclosure; Topics (hubs + All guides); Site (Home, About, Sitemap, brand).

### Shell in `hub` mode (example: sites/example-hub)

- **Header:** logo (links to home) and one button: `navCta` if set, else the page's CTA. No nav, no menu.
- **Page:** no breadcrumbs, no related guides. The meta line, "On this page" and the CTA box stay.
- **Footer:** two columns. Left: the site name (links home), tagline, disclosure (if any), a ghost CTA button (the page's CTA). Right: "More guides" (on the home page: "Guides"): every other approved page by title. Under a rule, a right-aligned **Sitemap** link to the XML sitemap (`?page=sitemap.xml` on Apps Script; `sitemap.xml` on static, only when `static.baseUrl` is set). This is how a crawler that lands on one page finds the rest, and it is the same HTML for everyone.
- **No shell pages:** no hub (topic) pages, no guides index, no About, no HTML sitemap page. `{{hub:…}}`, `{{guides}}`, `{{about}}` and `{{sitemap}}` are validator errors. `about.html` is not used.
- **Home:** headline, intro, the list of every page (newest first), the CTA box.
- **Sticky bar:** when `cta.sticky` is true, pages (not the home page) get a bottom bar on phones (`<760px`).

### Shell in `single` mode

- One approved page is the whole site, at the bare `/exec` URL (and `/` on static). The header shows the site name (not a link) and the CTA button. With the `guide` layout the footer has the disclosure only (if any); `landing` and `article` pages get the slim footer. `"footer": false` in `site.json` removes the footer, and `"sitemap": false` turns off the XML sitemap and its link. `{{link:…}}` and the other shell placeholders are errors.

### Page layouts (`"layout"` in `meta.json`)

The mode decides the site shell. The layout decides how one page sits inside it. Default `guide`; the other two were added 2026-10-12 for single-page sites that must not look like a guide.

| | `guide` | `landing` | `article` |
|---|---|---|---|
| Made for | Guides, comparisons, tools, Top N | A product landing page | An editorial blog post with ranked picks |
| Template | `templates/top-n.html` (or freeform) | `templates/landing.html` | `templates/blog-article.html` |
| Header | The mode's header | Logo + one CTA button (`navCta`, else `cta`), every mode | None. The page may start with a thin `.notice-bar` |
| Main | 720px column + "On this page" rail, meta line after the h1 | Full-width `.lp-*` sections, each with its own `.container` | One 700px centred column (`.article-body`), serif headings |
| After the article | CTA box, related guides (site mode) | Nothing: the page has its own final CTA | Nothing: the page has its own closing CTA |
| Footer | The mode's footer | Single site: slim (name, tagline, disclosure, Sitemap link). Hub and site modes keep their footer so crawlers find the other pages. `"footer": false` removes it | Same as landing |
| Sticky bar | `cta.sticky` | `cta.sticky` | `cta.sticky` |
| JSON-LD | Article (+ breadcrumbs in site mode), FAQPage, ItemList | WebPage, FAQPage | Article, FAQPage, ItemList |
| Fonts | `theme.fontsUrl` | `theme.fontsUrl` | `theme.fontsUrl` + `theme.serifFontsUrl` (headings only) |
| Preview | `/templates/top-n/` | `/templates/landing/` | `/templates/blog-article/` |

**Landing** reads as a SaaS product page, not an article: hero (eyebrow, big h1 with the keyword, subhead, primary + ghost CTA, optional trust line, a CSS-only mock product window), a "doing it by hand → with the product" strip, feature cards, three numbered steps on hairlines, a comparison table with the product's column tinted, rule-separated use cases, FAQ, and a solid-accent final CTA. There is no slot for testimonials, logos, ratings or counts: add one only as plain, sourced text.

**Article** is modelled on an independent editorial post (reference: an Apps Script page, "Top 3 Best Instant Indexing Tools", 2026-10-12): notice bar, category kicker in the accent, large serif headline, dek, "Updated … · Compared: A · B · C", h2 sections on hairlines, a quick comparison table, each pick as a bordered card (serif number, name, badge, "Strengths / Worth knowing" boxes, one button: solid for #1, ghost for the rest), a CTA band after #1, a verdict, FAQ, closing CTA, sources. The serif is for headings only; body text stays in `--font-sans`, so a brand theme with its own web font still reads as that brand.

Both layouts use tokens only, so they work in light and dark mode and with any `sites/<site>/theme.css`. Checked 2026-10-12 with the default theme (light and dark) and a cloned brand theme at 1280px and 390px.

## 2. Site structure (IA)

The rest of this section (page types, hubs, navigation, growth) describes **`site` mode**. In `hub` and `single` mode there are no hubs, no guides index, no About and no HTML sitemap page; see the shell sections above.

### Page types

| Type | Key | What it is | Who makes it |
|---|---|---|---|
| Home | `""` | Hero, topics box, one block per hub with its top 5 pages, author block, CTA | Build, from `site.json` |
| Hub (topic) | `<hub-slug>` | One topic. Lists its pages grouped by type. Optional intro from `sites/<site>/hubs/<slug>.html` | Build, from `site.json` `hubs` |
| Guides index | `guides` | Every page, grouped by hub | Build |
| Page: guide | `<slug>` | How-to or explainer. `meta.type = "guide"` (default) | You or an agent |
| Page: comparison | `<slug>` | Ranked list ("best X") or X vs Y. `meta.type = "comparison"`. | You or an agent |
| Page: tool | `<slug>` | Calculator or checker with a short script. `meta.type = "tool"` | You or an agent |
| About | `about` | Who writes the guides and how we review. The methodology lives here | `sites/<site>/about.html` |
| Sitemap | `sitemap` | Every link, grouped by hub | Build |

### URLs and slugs

- **Every key is one segment.** Static: `/<key>/`. Apps Script: `?page=<key>`. Hubs and pages are peers: `/seo-courses/` and `/best-seo-course/`.
- **Hub membership is metadata, not part of the URL.** A page can move to another hub without a redirect. This is why the site grows to 30 pages without a restructure.
- Slugs: lowercase words with hyphens, from the keyword. No dates, no hub prefix. Patterns: `best-<thing>`, `<thing>-for-<audience>`, `<a>-vs-<b>`, `how-to-<verb>-<thing>`, `<thing>-calculator`.
- Reserved keys: `guides`, `about`, `sitemap`, `sitemap-xml`, `sitemap.xml`, `styleguide`, `templates` and every hub slug. The validator and the build refuse clashes.
- An unknown key on Apps Script shows the **home** page (status 200).
- **XML sitemap** (every mode; a single site can set `"sitemap": false` to turn it off): `?page=sitemap.xml` on Apps Script lists every approved page with the `/exec` URL. Apps Script answers it with a one-time 302 to `script.googleusercontent.com`; that is expected. Always link and submit the stable `/exec?page=sitemap.xml` URL. The static target writes `sitemap.xml` and `robots.txt` only when `static.baseUrl` is set.

### Hubs

A hub is a topic that groups pages. Define them in `site.json`:

```json
"hubs": [
  { "slug": "seo-courses", "title": "SEO courses", "description": "One or two plain sentences." }
]
```

Assign a page with `"hub": "seo-courses"` in `meta.json`.

Rules:

- Make a hub when it has 2 pages, or 1 page and 2 briefs. A hub with one page is thin. Keep it small: 2 to 6 hubs for a 30-page site.
- Hub titles are short nouns ("SEO courses"), not keywords. The hub description must stay true to what the pages contain.
- The first 5 hubs appear in the header. More hubs still work: they show on the home page, the guides index and the footer.
- A page with no hub still works. It shows under "Other guides" and its breadcrumb goes through "Guides". The validator warns.

### Navigation and internal links

The build makes these links on every page, so each page is at most 2 clicks from home and every page links up, sideways and down:

| From | Links to |
|---|---|
| Header, footer | Home, every hub (first 5 in the header, all in the footer), All guides, About, Sitemap |
| Home | Every hub, the top 5 pages of each hub (featured first, then newest), About |
| Hub page | Every page in the hub, grouped by type; every other hub |
| Guides index, sitemap | Every page |
| Page | Breadcrumbs (Home, its hub), 4 related pages, "All in <hub>" |

Related pages are scored: same hub (+10), each shared keyword word (+2), same type (+1), then newest. `"related": ["slug"]` in meta puts chosen pages first.

Links in the text are still your job. Each page should link to 1 to 3 other pages with descriptive anchor text: `<a href="{{link:seo-course-for-founders}}">SEO course for founders</a>`. The validator errors on a link to a page that does not exist and warns when a page has no in-text link.

Placeholders: `{{link:<slug>}}`, `{{hub:<slug>}}`, `{{home}}`, `{{guides}}`, `{{about}}`, `{{sitemap}}`, `{{brand_url}}`, `{{cta_url}}`, `{{utm:https://…}}`.

**Own links carry UTM tags.** `site.json` `ownDomains` lists the hosts you own. Any `href` to one of them, or to a URL under `brand.url` or `cta.url`, must use `{{utm:…}}`, `{{cta_url}}` or `{{brand_url}}`; the validator errors otherwise. This keeps the Apps Script vs static click data clean.

### How the site grows

This plan applies to **`site` mode only**. A `hub` mode site stays flat: the home page and the footer list every page, and you add no hubs. Switching a site from `hub` to `site` mode is the owner's decision, not the agent's. 

| Stage (site mode) | What to do |
|---|---|
| 3 pages | No hubs yet. Pages show under "Guides" |
| 10 pages | 2 to 3 hubs. Add a `hubs/<slug>.html` intro to each hub page so it has real text, not only a list |
| 30 pages | 4 to 6 hubs. Add `tool` pages (calculators) to hubs where a number helps the decision. Use `related` to steer links from old pages to new ones |

Long-tail pages ("seo course for saas founders") go into the same hub as the head term. Do not make a hub per keyword.

### SEO notes

- Static target gets `<title>`, meta description, canonical, `sitemap.xml` and `robots.txt`. Apps Script cannot set a meta description.
- JSON-LD: `WebSite` (home), `CollectionPage` (hubs, index), `Article` + `BreadcrumbList` (pages), `ItemList` + `FAQPage` (built from `.item` sections and `<details>` FAQs). Absolute URLs appear once `static.baseUrl` or a deployment exists.
- The `<h2>` headings get ids, so the "On this page" links and in-page anchors work. Keep headings plain so the ids stay readable.
- The build wraps every `<table>` so wide tables scroll on phones instead of breaking the layout.

## 3. How to add a page

First read `sites/<site>/RULES.md` if it exists. The checklist in `AGENTS.md` ("Add a page") covers every mode.

### A guide (how-to or explainer)

1. `npm run new -- --site <site> --keyword "<keyword>"`, fill the brief, set `"hub"` (site mode only).
2. Write `pages/<slug>/meta.json` with `"type": "guide"`, `"hub": "<hub>"`, and `page.html` as a fragment: one `<h1>`, a `.quick-answer`, `<h2>` sections, `ol.steps` where there are steps, an FAQ, sources.
3. Site and hub mode: link to 1 to 3 related pages in the text with `{{link:<slug>}}`.
4. `npm run validate -- --site <site>`, then check `/<slug>/` and `/apps-script/?page=<slug>` in `npm run dev`.

### A comparison

- Ranked list: use the Top N template below, or write `page.html` with one `<section class="item">` per entry. Set `"type": "comparison"` (and `"hub"` in site mode).
- X vs Y: freeform `page.html` with `"type": "comparison"`. Use a `<table>` with `tr.own` for your product, then a `.verdict` box.

### A tool (calculator)

1. `meta.json` with `"type": "tool"`. Follow `sites/example/pages/note-app-cost-calculator/`.
2. Put the inputs in `form.calc`, the output in `.result`, and a plain `<table>` with every number the script uses. Keep the script short and in the page. No user-agent checks, no redirects.
3. Explain what the tool computes and its limits in text, so the page is useful without the script.

### A hub (site mode only)

1. Add it to `site.json` `hubs`. Pick a slug that no page uses.
2. Optional: `sites/<site>/hubs/<slug>.html` with 2 to 4 paragraphs of real intro text.
3. Set `"hub"` on the pages that belong to it. Rebuild.

### A product landing page (`layout: landing`)

Read `sites/<site>/RULES.md` first. Copy `templates/landing.html` to `pages/<slug>/page.html`, set `"layout": "landing"` (and `"type": "guide"`), replace every `[[placeholder]]`. Keep the order: hero → problem/outcome strip → features → how it works → compare → who it is for → FAQ → final CTA. Delete a section rather than leave it thin. The keyword goes in the `<h1>`; every link to the product is `{{cta_url}}` or `{{utm:…}}`. The mock window shows step or feature labels only, never numbers or results. Usually one such page is a whole `single` site: `npm run new-site -- --name <name> --mode single --from <site> --layout landing --slug <slug>` writes the starter page for you.

### A blog article (`layout: article`)

Read `sites/<site>/RULES.md` first. Copy `templates/blog-article.html`, set `"layout": "article"` and `"type": "comparison"`, replace every `[[placeholder]]`. Write `Updated {{updated}}` in the meta line; the build fills the date from `meta.updated`. Each pick is a `section.item.pick` (#1 adds `own` and a solid button; the others get ghost buttons) so the build makes ItemList schema. Keep the CTA band right after #1 and the closing CTA before the sources. The notice bar is optional: delete it if the site's rules forbid a disclosure.

### A "Top N" comparison page

Read `sites/<site>/RULES.md` first (it decides who is #1, the CTA wording, whether #1 shows a price and whether a disclosure note appears). Copy `templates/top-n.html` into `pages/<slug>/page.html`, set `"type": "comparison"`, replace every `[[placeholder]]`, and keep the order: quick answer naming #1 → winner card → at-a-glance table (`tr.own` on #1) → compact entries #2..#N → one CTA band → "Why we picked #1" → FAQ → closing CTA → sources. Preview the empty template at `/templates/top-n/`. The build turns the winner card and the compact items into `ItemList` schema and the FAQ into `FAQPage`.

Why this order: the reference page we modelled it on ("Top 3 Best Instant Indexing Tools", an Apps Script page) puts a long intro and a table before three equal cards, so #1 gets no more weight than #3 and the first button is far down the page. Our version promotes #1 to a card right under the quick answer with a large button, keeps #2..#N compact so the page stays short, and repeats the CTA three times in different forms (band, closing, sticky) without changing the ranking logic.

### A new theme or site colour

- Colour: change `theme.accent` in `site.json`.
- Small changes: `sites/<site>/theme.css` (for example `:root{--radius:0}`).
- A new theme: copy `themes/default/` to `themes/<name>/`, edit the three files, set `theme.name`.
- Check `/styleguide/` after any change (also `?theme=dark` when `theme.scheme` is `"auto"`).

### Clone a brand's style from a URL

Use the `clone-brand-style` skill (`.claude/skills/clone-brand-style/SKILL.md`). `npm run brand:extract -- --url <url> --site <site> --out sites/<site>/research/brand` prints the page's custom properties, most-used colours, font families and font links, radii and button styles (computed in a real browser when `agent-browser` is installed, else parsed from the fetched CSS), plus a suggested `theme.css` starting point. Map the values onto the tokens above, write them into `sites/<site>/theme.css` with a comment that records the source and date, set `theme.accent` and (for a Google Font) `theme.fontsUrl` in `site.json`. Then either set `theme.scheme` to force the source's look, or keep `"auto"` and design a dark counterpart when the source is light only. Style only: never the name, logo, images or copy.

Worked example (fictional): a source site with a warm off-white canvas, a dark green accent, pill buttons and one Google Font becomes `--bg`, `--surface`, `--fg`, `--accent`, `--radius-btn: 9999px` and `theme.fontsUrl`. A source that is light only gets either `theme.scheme: "light"` or a designed dark block in `theme.css`.
