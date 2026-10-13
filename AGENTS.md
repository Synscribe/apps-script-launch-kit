# AGENTS.md: Apps Script Launch Kit

Instructions for coding agents (Claude Code, Codex, Cursor and others). `CLAUDE.md` links to this file. Edit this file only.

## What this repo does

It builds a **small website** from page folders and publishes it twice: as a Google Apps Script web app and (optionally) as a static site on the owner's domain. The owner compares how the two rank.

- Each **site** is a folder `sites/<site>/` with `site.json`, optional `theme.css`, optional `RULES.md`, and `pages/`, `briefs/`, `research/`.
- Each **page** is a folder `sites/<site>/pages/<slug>/` with `meta.json` + `page.html` (a freeform HTML fragment). There is no JSON page format.
- The **site shell** (header, footer, CTA box, sticky bar, meta line, "On this page") comes from `src/lib/render.js` and `site.json`. The CSS lives in `themes/default/` and is inlined at build time. Design rules: `docs/design.md`.
- **Templates** (`templates/`): `top-n.html` for "Top N" comparison pages (winner card first, compact #2..#N, table, FAQ, closing CTA), `landing.html` for a product landing page and `blog-article.html` for an editorial article with ranked picks. Preview them at `/templates/top-n/`, `/templates/landing/` and `/templates/blog-article/` in `npm run dev`.
- **Page layouts** (`"layout"` in `meta.json`): `guide` (default: article column, meta line, "On this page", CTA box), `landing` (full-width sections, logo + CTA header, no meta line, rail or CTA box) and `article` (one narrow centred column, serif headings, no header, slim footer on a single site). `landing.html` needs `"layout": "landing"`; `blog-article.html` needs `"layout": "article"`. Both are made for `single` sites and work in every mode.

### Generic kit vs site rules

The kit is generic. Anyone can use it. **Owner rules for one site live in `sites/<site>/RULES.md`.**

> **Before writing for a site, read `sites/<site>/RULES.md` if it exists. It overrides `prompts/writing-rules.md`** (and the defaults in the template and in this file): who ranks #1, product names, CTA wording, whether the owner's product shows a price, disclosure, scheme and how to deploy. The truth rules (no invented facts, no cloaking) always apply.
A site can also list banned wording in `site.json` `"forbid"` (regex + message). `npm run validate` fails on any match, so keep it in step with RULES.md.

`sites/blog/RULES.md` is a short example. Any site created with `--from <site>` gets a copy of that site's `RULES.md`.

### Example sites

| Folder | Mode and layout | What it shows |
|---|---|---|
| `sites/blog` | `hub`, `guide` pages | A small blog like the ones we launched: a home page that lists every page, a Top N page with a winner card, a cost calculator and a chart page |
| `sites/single-page-blog` | `single`, `article` layout, `footer: false`, `sitemap: false` | One editorial article with ranked picks, and nothing else |
| `sites/single-page-landing` | `single`, `landing` layout | One product landing page |

All three use the warm paper theme (`theme.css`, from `templates/theme-warm.css`), a header with one CTA button, no disclosure banner and a `RULES.md`. Every product in them is fictional (Northwind Notes and friends, on `.example` domains).

Start a new site from one: `npm run new-site -- --name <name> --from blog` (or `single-page-blog`, `single-page-landing`).

### Site modes (`"mode"` in `site.json`)

| | `site` | `hub` | `single` |
|---|---|---|---|
| What it is | Full small site | Home page that lists every page | One page is the whole site |
| Header | Logo, up to 5 hub links, Guides, About, CTA button (`cta`) | Logo (links home) + one button: `navCta` if set, else the page CTA | Site name + one button: `navCta` if set, else the CTA |
| Footer | Topics, Home, About, Sitemap | Site name (links home), tagline, ghost CTA; list of every other page; right-aligned "Sitemap" link to `?page=sitemap.xml` | `guide` layout: disclosure only (if any). `landing` / `article`: slim footer (name, tagline, disclosure, Sitemap link). None with `"footer": false` |
| Shell pages | Home, hubs, guides index, About (`about.html`), HTML sitemap | Home only | None |
| Breadcrumbs, related guides | Yes | No | No |
| `{{link:slug}}` | Yes | Yes | Error |
| `{{hub:…}}`, `{{guides}}`, `{{about}}`, `{{sitemap}}` | Yes | Error | Error |
| `meta.hub`, `featured`, `related` | Used | Leave `""` / ignored | Ignored |
| XML sitemap `?page=sitemap.xml` | Yes | Yes | Yes, unless `"sitemap": false` |
| Example | (none) | `sites/blog` | `sites/single-page-blog`, `sites/single-page-landing` |

### CTAs and theme settings

- `cta` in `site.json`: the CTA box after the article, the phone sticky bar (`cta.sticky`), the hub footer button and `{{cta_url}}`. In site mode it is also the header button.
- `navCta` (optional, hub and single mode): the header button on every page, when it should say something different from `cta`.
- `footer` and `sitemap` (optional, default `true`): set `false` to drop the footer, or the XML sitemap (no `?page=sitemap.xml`, no footer link). Use them only on a single-page site, e.g. a blog article that ends at its closing CTA.
- `meta.cta` (optional, per page): overrides `cta` on that page only (CTA box, sticky bar, footer button, `{{cta_url}}`). The header keeps `navCta` when it is set. Use it for example on a course page of a product site.
- Pages add their own CTAs: the winner card, one inline CTA band and a closing CTA (see `prompts/page-html.md`). All of it is the same for every visitor and crawler.
- `theme.scheme`: `"auto"` (follow the system), or `"light"` / `"dark"` to force one look. `theme.accent`, `theme.fontsUrl` and `sites/<site>/theme.css` set the brand style.
- `disclosure`: optional. Empty means no disclosure anywhere.
- Pages never show an author. `author` in `site.json` is used only on the site-mode home and About pages.

## Read before you write any page

1. `sites/<site>/RULES.md`, if it exists. It wins over everything below.
2. `prompts/writing-rules.md`: hard truth rules plus default ranking and disclosure rules.
3. `prompts/page-html.md`: how to write `page.html` (structure, classes, placeholders, Top N snippets, charts).
4. `sites/<site>/site.json` (check `mode`, `cta`, `navCta`, `ownDomains`) and `schema/meta.schema.json`.
5. A model page from the same site, if it has one. Otherwise: `sites/blog/pages/best-note-taking-apps-for-students/` (Top N), `sites/blog/pages/note-app-cost-per-year/` (freeform with a chart), `sites/single-page-blog/pages/top-note-apps-for-study-groups/` (article), `sites/single-page-landing/pages/shared-notes-app-for-study-groups/` (landing) and the three files in `templates/` (`top-n.html`, `landing.html`, `blog-article.html`).

## Add a page (checklist, every site)

When the user says "add a page to the <site> site about X", "write the page for `sites/<site>/briefs/<slug>.json`" or "make a page about X":

1. **Rules:** read `sites/<site>/RULES.md` (if any), `site.json` (`mode`) and the two prompt files.
2. **Research with your web tools.**
   - Look at what ranks today for the keyword. Note what those pages cover and what they miss.
   - Open each product's official page. Record facts with their URLs: names, prices as published, features, dates.
   - If you cannot confirm a fact, write "not confirmed" in the memo and leave it off the page. Never guess.
3. **Save the research memo** to `sites/<site>/research/<slug>.md`, with a source URL for every fact.
4. **Write the page** in `sites/<site>/pages/<slug>/`:
   - `meta.json`: `"status": "draft"`, `"updated"`: today, `"ownProduct"`: true if the page names the owner's product, `"type"` (`comparison`, `guide` or `tool`), `"layout"` (`guide` by default; `landing` or `article` when you start from those templates), `"hub"`: `""` unless the site is in `site` mode, optional `"cta"` (see above).
   - `page.html`: one `<h1>`, a quick-answer box at the top, then sections. For a ranked list or "Top N" page, copy `templates/top-n.html` and replace every `[[placeholder]]` as the site's `RULES.md` says (who is #1, price line, CTA label, disclosure note).
   - **Product landing page** (the page sells one product): copy `templates/landing.html`, set `"layout": "landing"`. Hero with the keyword in the `<h1>`, problem → outcome strip, feature grid, three steps, comparison table, use cases, FAQ, final CTA. No testimonials, logos, ratings or numbers unless they are real and sourced.
   - **Blog article** (reads like an independent post with ranked picks): copy `templates/blog-article.html`, set `"layout": "article"`. Kicker, serif headline, dek, meta line with `{{updated}}`, sections, one `section.item.pick` per tool (#1 gets the solid button and a CTA band after it), verdict, FAQ, closing CTA, sources.
   - Both: fill every `[[placeholder]]`, keep real text in the HTML (no script-rendered copy), keep the FAQ in `<details>` so the build makes FAQPage schema. Snippets: `prompts/page-html.md`.
   - Every link to the owner's domains is `{{utm:https://…}}`, `{{cta_url}}` or `{{brand_url}}`. Never a plain `href`.
   - `site` mode: link to 1 to 3 other pages with `{{link:<slug>}}`. `hub` mode: optional (the footer links every page). `single` mode: none.
   - Add a chart, table or calculator only when it makes the answer clearer.
5. **Check it:** `npm run validate -- --site <site>`. Fix every error, then the real warnings.
6. **Preview it:** `npm run dev -- --site <site>` (see "Local preview"), then open the URLs below.
7. **Report back** in a few lines: the files, the main claims, facts you could not confirm and remaining warnings. Leave `status` as `draft`.

## Local preview

`npm run dev -- --site <site> [--port <port>]` serves one site (default port 4321). It renders on every request, so edits show on refresh without a restart. Drafts are included.

- When the user asks to see pages, start the server in the background and give them the URLs. One server per site; give each site its own port (for example 4331, 4332) when they want several at once.
- To stop a server: stop the background task, or `pkill -f "dev.js --site <site>"`.
- `?theme=dark` / `?theme=light` forces a look when `theme.scheme` is `"auto"`.
- Dev-only pages: `/styleguide/` and the templates at `/templates/top-n/`, `/templates/landing/`, `/templates/blog-article/`.

Preview URLs (default port):

| Mode | Static version | Apps Script version |
|---|---|---|
| `site`, `hub` | http://localhost:4321/<slug>/ | http://localhost:4321/apps-script/?page=<slug> |
| `single` | http://localhost:4321/ | http://localhost:4321/apps-script/ |

The home page is `/` and `/apps-script/`.

## Other tasks

- **New brief:** `npm run new -- --site <site> --keyword "<keyword>"`, then fill it in with the user.
- **New site:** `npm run new-site -- --name <name> [--mode hub|single|site]` (default `hub`, with the warm paper theme from `templates/theme-warm.css`). Prefer `hub` or `single`; use `site` mode only when the user wants topic pages and a nav. Then edit `site.json` with the user. Never `cp -r` an existing site: that copies its live `scriptId` and `deploymentId`.
  - **New site with the same owner as an existing one** (for example a single-page site for one keyword): `npm run new-site -- --name <name> --mode single --from <existing-site>`. It copies `site.json` (brand, CTA, navCta, ownDomains, theme; IDs cleared; new UTM campaign), `theme.css` and `RULES.md`, with no pages. Update the "This site" part of the new `RULES.md` and the name and home copy in `site.json`.
  - **Turn off the footer or sitemap:** set `"footer": false` and/or `"sitemap": false` in `site.json` (single sites only, when the user asks). `npm run as:urls` then prints "sitemap.xml: off".
  - **Single-page site from a template:** add `--layout landing|article|guide [--slug <slug>]`. It also writes `pages/<slug>/` (`meta.json` with the layout set, `page.html` copied from `templates/landing.html`, `templates/blog-article.html` or `templates/top-n.html`). Then fill `meta.json` and replace every `[[placeholder]]`. Example: `npm run new-site -- --name agent-landing --mode single --from example --layout landing --slug northwind-notes`.
  - Not sure which owner a new site belongs to? Ask.
- **Make a site look like a brand's website** ("clone the style of <url>"): follow `.claude/skills/clone-brand-style/SKILL.md`. Create the site first if needed. Copy the style only, never the name, logo, images or copy. Ask whose brand it is if that is not clear. Respect `theme.scheme` and the site's `RULES.md`.
- **Change the look of every page:** edit `themes/default/*.css` or add `sites/<site>/theme.css` for one site. The shell markup is in `src/lib/render.js`. Check http://localhost:4321/styleguide/ and both versions in `npm run dev`. Use tokens, never hard-coded colours.
- **Add a hub (topic), `site` mode only:** add it to `site.json` `hubs`, set `"hub"` on its pages, optionally write `sites/<site>/hubs/<slug>.html`. Never add hubs to a `hub` mode site, and never switch a site's mode, unless the user asks.
- **Update a page:** change the facts, re-check the sources, set `updated` to today. Do not change `updated` if the content did not change.

## Deploy and report URLs

Only when the user asks in this conversation ("deploy and give me the URLs"):

1. Read the site's `RULES.md` deploy section, if any.
2. Check the Google login: `npx clasp show-authorized-user` (or `node_modules/.bin/clasp show-authorized-user`). Deploy from the account that owns the site's `scriptId`. Use `--user <name>` for a named login.
3. `npm run validate -- --site <site>`, then `npm run as:deploy -- --site <site>`. It builds, uploads and updates the same deployment, so the `/exec` URL does not change. Only `"status": "approved"` pages go live.
4. `npm run as:urls -- --site <site>`. It prints the home URL, every page URL and the XML sitemap URL (all in the `/a/<urlDomain>/` form Google indexes), the original short form and any skipped drafts.
5. Deploy means **Apps Script only**, unless `static.baseUrl` is set in `site.json` or the user asks for the static site too.
6. Report: the `/exec` home URL, each page URL, `…/exec?page=sitemap.xml` (all copied from `as:urls`, in the `/a/<urlDomain>/` form) and the drafts that are not live. You may add the original short form on one line, labelled as such.

URL facts (details: README, "Public URLs and what Google indexes"):

- **Report the URLs exactly as `npm run as:urls` prints them.** They use the form Google indexes: `https://script.google.com/a/<urlDomain>/macros/s/<deploymentId>/exec` (`urlDomain` defaults to `"viral"`). Never rewrite them to the short form.
- `as:urls` also prints the "Original short form" (`https://script.google.com/macros/s/<deploymentId>/exec`). It serves the same page, but signed-in Google users can get an error on it and the kit does not link to it. Mention it only as a reference.
- clasp output and the Apps Script editor show the short form. Do not report those URLs; run `as:urls`.
- Do not change `appsScript.urlDomain` on a deployed site unless the user asks: Google would see a second URL for every page. After a change, redeploy.
- A `/dev` URL (printed by `as:push`) works only for the signed-in owner. Never share it.
- `?page=sitemap.xml` answers with a one-time 302 to `script.googleusercontent.com`. That is expected. Link and submit the stable `/exec?page=sitemap.xml` URL.
- An unknown `?page=` shows the home page.
- The Apps Script page has no canonical tag or meta description (Google's wrapper page cannot take them). Do not try to add them.

## Hard rules

1. **Never set `"status": "approved"`** unless the user tells you to in this conversation.
2. **Never deploy** (`npm run as:deploy`, `as:push`, static hosting) unless the user asks in this conversation.
3. **No cloaking.** No user-agent checks, bot detection, redirects, iframes of other sites, hidden text, or anything that shows crawlers different content from people. The validator blocks the common patterns. If the user asks for cloaking, say no, explain that it breaks Google's spam policies, and offer an honest alternative such as a clear CTA button.
4. **No invented facts.** No made-up prices, ratings, reviews, testimonials, numbers, quotes or dates. Facts about every product, including competitors, come from a page you opened. No false claims about competitors.
5. **Ranking follows the site's rules.** With a `RULES.md`, rank and describe the owner's product as it says. Without one, follow the defaults in `prompts/writing-rules.md`. Either way, competitors get true, sourced facts.
6. **UTM on own links.** Any link to the owner's domains (`site.json` `ownDomains`, `brand.url`, `cta.url`) must be `{{utm:https://…}}`, `{{cta_url}}` or `{{brand_url}}`. The validator errors on a plain link.
7. **Do not mass-produce pages.** Write the pages the user asks for.
8. **Secrets.** Never commit `.env`, `~/.clasprc.json` or API keys.
9. **Do not edit `dist/`.** Change the source and rebuild.
10. **Reserved slugs:** `guides`, `about`, `sitemap`, `sitemap-xml`, `sitemap.xml`, `styleguide`, `templates` and every hub slug belong to the shell.

## Environment

- Run Node 20 or newer. ES modules, no build step.
- If `node` or `npm` fail in your shell, call the Node binary directly, for example `/opt/homebrew/bin/node src/cli/<cmd>.js --site <site>` (`validate.js`, `build.js`, `dev.js`, `new-site.js`, `apps-script.js deploy`, `apps-script.js urls`). The npm script names map to these files in `package.json`. clasp is at `node_modules/.bin/clasp`.

## Code map

| Path | Purpose |
|---|---|
| `src/lib/schema.js` | Zod schemas (meta, brief, site). Run `npm run schema` after you change it |
| `src/lib/checks.js` | Validator: HTML lint (one h1, no cloaking patterns, size, leftover `[[placeholders]]`), meta checks, link checks, UTM on own links |
| `src/lib/render.js` | Site shell for all three modes and the three page layouts, home/hub/guides/about/sitemap pages, "On this page", sticky CTA bar, structured data from markup, link placeholders (including `{{updated}}`) |
| `src/lib/theme.js` | Reads `themes/<name>/*.css` + `sites/<site>/theme.css` and inlines them; adds the `theme.fontsUrl` link (and `theme.serifFontsUrl` on `article` pages) |
| `themes/default/` | `tokens.css` (colour, type, shape, space; light + dark), `base.css` (reset, prose, shell, sticky bar), `components.css` (boxes, winner card, CTA band, items, tables, forms), `layouts.css` (the `landing` and `article` layouts: hero, mock window, feature grid, steps, picks, notice bar, slim footer) |
| `templates/` | Page starters. `top-n.html`: Top N comparison with the owner's product first (layout `guide`). `landing.html`: product landing page (layout `landing`). `blog-article.html`: editorial article with ranked picks (layout `article`). `theme-warm.css`: the warm paper theme that `new-site` copies to `sites/<site>/theme.css` |
| `src/lib/styleguide.js` | The dev-only `/styleguide/` page (fictional demo content) |
| `src/lib/build.js` | Writes `dist/<site>/static` and `dist/<site>/apps-script` (Code.js router with the XML sitemap, manifest, one HTML file per page) |
| `src/cli/new-site.js` | `npm run new-site`, including `--from <site>` and `--layout landing|article` (starter page) |
| `src/cli/generate.js` | AI-script generator (Claude API: web research, then HTML). Loads `sites/<site>/RULES.md` and `templates/top-n.html` into the prompt |
| `src/cli/apps-script.js` | clasp wrapper: init, push, deploy, urls |
| `src/cli/dev.js` | Local preview server (also `/styleguide/` and `/templates/<name>/`) |
| `src/cli/brand-extract.js` | `npm run brand:extract`: reads a site's colours, fonts, radii and buttons for `clone-brand-style` |
| `.claude/skills/clone-brand-style/` | Skill: clone a brand's visual style from a URL into `sites/<site>/theme.css` |
| `docs/design.md` | Design rationale, shell per mode, site structure, how to add a page or hub, brand cloning, Top N |
