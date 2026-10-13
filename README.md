# Apps Script Launch Kit

Build landing pages, blog posts and comparison guides once, then publish them as a Google Apps Script web app. Based on [Synscribe](https://synscribe.com)'s research on [Parasite SEO with Google Apps Script](https://www.agentmole.io/blog/google-apps-script-parasite-seo).

> **For research and education only.** This kit exists to study how Google treats pages hosted on `script.google.com`. It is not a tool for spam, cloaking or manipulating search results. You are responsible for following [Google's spam policies](https://developers.google.com/search/docs/essentials/spam-policies), Google's [Apps Script terms](https://developers.google.com/apps-script/terms) and the law where you live.

## Why this exists

Pages hosted as Google Apps Script web apps (`script.google.com/macros/s/…/exec`) can rank in Google within days, even for competitive keywords such as "best indexing tool". This is a form of Parasite SEO: borrowing the authority of a trusted domain instead of building your own. Synscribe's research ("Spammers Are Using Google Apps Script To Rank In Google Search", October 2026) found that most of these pages cloak (show Google one page and people another) and get removed fast.

This kit lets you test the question honestly. Build a small site once and publish it in two places:

1. **Google Apps Script** (`script.google.com/a/viral/macros/s/…/exec`, the URL form Google indexes). The page is a web app on Google's own domain.
2. **Your own domain**, as a normal static site.

Then compare the two: does a page on Google's host rank faster or higher than the same page on a domain you own? **This kit does the honest version only.** Every visitor and every crawler gets the same page.

> **Read the risks before you start.** Google's spam policies judge what a page does, not where it is hosted. A self-promotional page on Google's domain can count as [site reputation abuse](https://developers.google.com/search/docs/essentials/spam-policies#site-reputation). Google can also turn off any Apps Script project without warning. Use a separate Google account. Never use a client's brand without their written consent.

## What you get

- **Two ways to generate pages**
  - **AI script:** `npm run generate` calls the Claude API. Claude searches the web, writes a research memo with sources, then writes the page.
  - **Coding agent:** open the repo in Claude Code (or any coding agent) and ask it to write a page. It follows [`AGENTS.md`](AGENTS.md).
- **A light website shell.** In `site` mode: header and nav, home page, hub (topic) pages, guides index, About page, HTML sitemap, breadcrumbs, "On this page", footer, CTA box and related guides. In `hub` and `single` mode: a logo + CTA header and a short footer (see below). Every page gets a meta line (type, updated date, reading time; no author), an optional disclosure and an XML sitemap at `?page=sitemap.xml` (a single site can turn the footer and the sitemap off). See [`docs/design.md`](docs/design.md).
- **A theme.** `themes/default/` (tokens, base, components, layouts) is inlined into every page. New sites also get `templates/theme-warm.css` as `sites/<site>/theme.css`: the warm paper look of the sites we launched (Instrument Sans, green accent, light only). Change the accent for your brand, or clone a brand's style (below). Light and dark mode via `theme.scheme` (`auto`, or force `light` / `dark`). A dev-only style guide at `/styleguide/`.
- **Site rules.** Owner rules for one site (who ranks #1, CTA wording, prices, disclosure) go in `sites/<site>/RULES.md`. They override the generic [`prompts/writing-rules.md`](prompts/writing-rules.md). Example: [`sites/blog/RULES.md`](sites/blog/RULES.md).
- **Freeform pages:** each page is plain HTML (`pages/<slug>/page.html` + `meta.json`). Add tables, charts or calculators. Ranked lists use the same HTML with built-in item styles.
- **Three site modes** (`"mode"` in `site.json`):
  - `hub` (default): a home page that lists every page. Each page has a logo + CTA header (no nav). The footer links home (site name), lists every other page and has a right-aligned "Sitemap" link to `?page=sitemap.xml`, so Google can discover the whole site from any page. No topic pages, guides index, About or HTML sitemap page.
  - `single`: one page is the whole site, at the bare `/exec` URL. Make as many single sites as you like, each with its own `/exec` URL.
  - `site`: a full small website with nav, topics (hubs), breadcrumbs, an About page and related links. More navigation than most tests need; `hub` is the default.
- **Three page templates** in `templates/`:
  - `top-n.html`: winner card for the #1 pick with a strong CTA, at-a-glance table, compact entries for the rest, inline CTA band, "why we picked it", FAQ, closing CTA. Optional sticky bottom CTA bar on phones (`cta.sticky`).
  - `landing.html` (`"layout": "landing"` in `meta.json`): a product landing page. Hero with a CSS-only mock product window, problem → outcome strip, feature grid, three steps, "vs by hand / other tools" table, use cases, FAQ, final CTA. Logo + CTA header, no meta line or rail.
  - `blog-article.html` (`"layout": "article"`): an editorial post with ranked picks. Thin notice bar, kicker, serif headline (Newsreader from Google Fonts, system serif fallback), dek, meta line, picks as cards with a CTA button each, FAQ, sources. No site header, slim footer.
  - Preview them at `/templates/top-n/`, `/templates/landing/` and `/templates/blog-article/` in `npm run dev`. The landing and article layouts are made for `single` sites: one page, one `/exec` URL, as many sites as you like side by side.
  - Start a single site from one: `npm run new-site -- --name mysite --mode single --layout landing|article|guide [--slug <slug>]` writes the site and a starter page (`guide` uses `top-n.html`).
- **CTA settings:** `cta` (CTA box, sticky bar, footer button, `{{cta_url}}`), `navCta` (the header button in hub and single mode, if it should say something else) and a per-page `meta.cta` override (for example a course page on a product site; the header keeps `navCta`).
- **Footer and sitemap switches:** `footer: false` removes the footer from every page. `sitemap: false` turns off `?page=sitemap.xml`, the footer Sitemap link and the static `sitemap.xml`. Use them only on a single-page site, for example a blog article that ends at its closing CTA.
- **Banned wording per site:** `forbid` in `site.json` (regex + message). `npm run validate` fails on any match. Use it for claims or spellings the owner does not allow.
- **Brand style cloning:** `npm run brand:extract -- --url <url>` reads a site's colours, fonts, radii and button styles; the `clone-brand-style` skill (`.claude/skills/`) turns them into `sites/<site>/theme.css`. Style only, never the brand name or logo.
- **A validator** (`npm run validate`): one h1 per page, real dates, UTM tags on every link to your own product, no leftover template placeholders, placeholders that fit the site mode, `ownProduct` when you name your product (only if the site has a disclosure), and a block on cloaking patterns.
- **Two build targets:** `dist/<site>/apps-script/` and `dist/<site>/static/`.
- **One-command deploy to Apps Script** that keeps the same `/exec` URL every time.
- **A local preview** of both versions with `npm run dev`.
- **UTM tags** on links to your own product, so analytics show which version sent each visit.
- **A review gate:** generators always save drafts. Only pages with `"status": "approved"` get published.

## How it works

```
brief (JSON) ──► generate (AI script or coding agent) ──► pages/<slug>/ (page.html + meta.json, draft)
                                                              │  you review, set "approved"
                                                              ▼
                                         npm run build ──► dist/<site>/apps-script/  ──► clasp push + deploy ──► script.google.com/…/exec?page=<slug>
                                                       └─► dist/<site>/static/       ──► any static host       ──► yourdomain.com/<slug>/
```

One Apps Script project serves the whole site. The router in `Code.js` reads `?page=<slug>` and returns that page. No `page` gives the home page. An unknown `page` also gives the home page.

- `?page=sitemap.xml` returns the XML sitemap (every mode, unless `site.json` has `"sitemap": false`). Apps Script answers it with a one-time 302 redirect to `script.googleusercontent.com`. That is expected. Always link and submit the stable `/exec?page=sitemap.xml` URL, never the redirect target.
- `site` mode only: `?page=guides`, `?page=about`, `?page=sitemap` (HTML) and `?page=<hub-slug>` are shell pages.

### Public URLs and what Google indexes

One deployment answers on two URL forms. Both serve the same page to everyone, signed out.

| URL | Who can open it | Used by the kit |
|---|---|---|
| `https://script.google.com/a/viral/macros/s/<deploymentId>/exec` | **Everyone, and Google.** This is the form Google indexes. | **Yes.** Links between pages, JSON-LD, the XML sitemap and `npm run as:urls` all use it. |
| `https://script.google.com/macros/s/<deploymentId>/exec` | Everyone signed out. A visitor signed in to Google can get "Sorry, unable to open the file at present." | No. `as:urls` prints it once as "Original short form", for reference. clasp and the Apps Script editor show this form. |
| `https://script.google.com/macros/s/<head-deploymentId>/dev` | Only the owner, signed in. Others get "Sorry, unable to open the file" and Google gets a 404. | Never share it. `as:push` prints it. |
| `https://script.google.com/d/<scriptId>/edit` | The code editor. Owner only. | Never share it. |

**What we saw (checked 2026-10-13):**

- **Google indexes the `/a/<x>/macros/s/…/exec` form**, not the short form that clasp prints. The `/a/<x>/` part normally names a Google Workspace domain. For a public web app any value works: `viral`, `synscribe.com` and random letters all returned the same page.
- **The short form can fail for signed-in visitors.** A visitor signed in to Google (especially with more than one account) can get an error page on the short form.
- **The page sits in a frame.** The `/exec` URL returns a Google wrapper page with your `<title>` (from `setTitle`). Your HTML loads inside a sandboxed iframe from `*.googleusercontent.com`. Google renders JavaScript, so it indexes the text. The wrapper has no meta description and no canonical tag, and the kit cannot add them.
- **The sitemap redirects once.** `?page=sitemap.xml` answers with a 302 to `script.googleusercontent.com/macros/echo?…`. Always link and submit the stable `/exec?page=sitemap.xml` URL, never the redirect target.
- **`script.google.com` has no robots.txt** (it returns a "Page not found" page), and Search Console cannot verify it. Google finds the pages through links and the sitemap URL.

**How the kit handles it:** `appsScript.urlDomain` in `site.json` (default `"viral"`) sets the `<x>`. The kit writes the `/a/<urlDomain>/` form everywhere, so Google sees one URL per page. Set `"urlDomain": ""` to use the short form instead. Pick one value and keep it: changing it after Google indexes the pages creates a second URL for every page. After a change, run `npm run as:deploy` again so the live links and sitemap update.

## Quick start (5 minutes, no Google account needed)

```bash
npm install
npm run dev -- --site blog
```

Open http://localhost:4321/. You see a demo blog with fictional products, in the same style as the sites we launched. Click "apps script" in the yellow bar to see the Apps Script version.

### Example sites

| Folder | Mode and layout | What it shows |
|---|---|---|
| `sites/blog` | `hub`, `guide` pages | A small blog like the ones we launched: a home page that lists every page, a Top N page with a winner card, a cost calculator and a chart page |
| `sites/single-page-blog` | `single`, `article` layout, `footer: false`, `sitemap: false` | One editorial article with ranked picks, and nothing else |
| `sites/single-page-landing` | `single`, `landing` layout | One product landing page |

All three use the warm paper theme (`theme.css`, from `templates/theme-warm.css`), a header with one CTA button, no disclosure banner and a `RULES.md`. Every product in them is fictional (Northwind Notes and friends, on `.example` domains).

## Local preview (`npm run dev`)

`npm run dev -- --site <site> [--port 4321]` starts a preview server for one site. It renders on every request, so edits to pages, `site.json` and CSS show on refresh. Drafts are included. Stop it with Ctrl+C.

| URL | What it shows |
|---|---|
| http://localhost:4321/ | The static version: home page (in `single` mode, the one page) |
| http://localhost:4321/<slug>/ | A page, static version (`site` and `hub` mode) |
| http://localhost:4321/apps-script/ and `/apps-script/?page=<slug>` | The Apps Script version, with links kept local |
| http://localhost:4321/styleguide/ | Every component in the theme (dev only, never built) |
| `/templates/top-n/`, `/templates/landing/`, `/templates/blog-article/` | The empty page templates in their layouts (dev only) |

- Add `?theme=dark` or `?theme=light` to any URL to force a look (only when `theme.scheme` is `"auto"`).
- To preview several sites at once, give each its own port: `npm run dev -- --site site-a --port 4331` and `npm run dev -- --site site-b --port 4332`.

## Set up the Google side (once per Google account)

You need these before your first deploy.

| # | Step | Why |
|---|---|---|
| 1 | **Use a separate Google account.** A new consumer Gmail account is best. Do not use your main company Workspace account. | Google can suspend scripts or accounts for abuse. Keep that risk away from your email and Drive. A Workspace admin may also block public web apps. |
| 2 | Sign in to that account and open https://script.google.com/home/usersettings. Turn **Google Apps Script API** to **On**. | clasp, Google's command-line tool for Apps Script, uses this API to upload and deploy. It is off by default. |
| 3 | Run `npm run as:login`. A browser opens. Sign in with the separate account and allow access. | This saves a login token to `~/.clasprc.json` on your computer. Never commit that file. |
| 4 | Create a site: `npm run new-site -- --name mysite [--mode hub\|single\|site]` (default `hub`), then edit `sites/mysite/site.json` (name, brand, CTA, ownDomains, theme). To reuse another site's setup: add `--from <site>` (copies `site.json`, `theme.css` and `RULES.md`, no pages, clears the Apps Script IDs). Do not `cp -r` a site: that copies its live `scriptId` and `deploymentId`. | Each folder in `sites/` is one Apps Script project and one static site. |
| 5 | Run `npm run as:init -- --site mysite`. | This creates an empty Apps Script project in the account and saves its `scriptId` to `site.json`. |
| 6 | Run `npm run as:deploy -- --site mysite`. | This builds the pages, uploads them and publishes the web app as "Execute as: Me", "Who has access: Anyone". The `deploymentId` is saved to `site.json`. |
| 7 | Run `npm run as:urls -- --site mysite` and open a URL in a **private window**. | The page must load without a Google sign-in. If it asks you to sign in, check step 1 (Workspace limits). |

Notes:

- **Authorization prompt.** The generated script only serves HTML, so it should not need extra permissions. If Google shows "Authorization required", open the project (`https://script.google.com/d/<scriptId>/edit`), run `doGet` once, accept, then deploy again.
- **Which account is logged in:** `npx clasp show-authorized-user`. Deploy from the account that owns the site's `scriptId`.
- **Several accounts** (for example one per client test): log in with a name, `npx clasp login --user clientA`, then add `--user clientA` to every `as:` command.
- **Limits.** Free accounts can create about 50 projects a day, and a web app can run about 30 requests at the same time per user. That is enough for tests. Check [Apps Script quotas](https://developers.google.com/apps-script/guides/services/quotas) for the current numbers.
- **Search Console** cannot verify `script.google.com`, so you cannot request indexing for Apps Script pages. Link to them from pages that Google already indexes. You can verify your own domain as usual.

## Generate pages

Every page starts from a **brief**: the keyword, audience, angle and the products that must be in the list.

```bash
npm run new -- --site mysite --keyword "best seo course"   # creates sites/mysite/briefs/best-seo-course.json
```

Edit the brief. Then pick one way to generate.

### Option A: AI script (Claude API)

1. Get an API key at https://console.anthropic.com/ and put it in `.env`:

   ```bash
   cp .env.example .env    # then set ANTHROPIC_API_KEY=...
   ```

2. Run:

   ```bash
   npm run generate -- --site mysite --slug best-seo-course
   ```

The script makes two Claude API calls:

- **Research.** Claude searches the web and writes a research memo with a source for each fact. It is saved to `sites/mysite/research/best-seo-course.md`.
- **Write.** Claude turns the brief and memo into a page (`sites/mysite/pages/best-seo-course/page.html` + `meta.json`). The prompt includes `prompts/writing-rules.md`, `sites/mysite/RULES.md` (if it exists), the site mode and CTA settings, `prompts/page-html.md` and `templates/top-n.html`. The page is saved as a draft.

The default model is `claude-opus-5-5`. Set `CLAUDE_MODEL` in `.env`, or pass `--model`, to use another one. The research call turns on Anthropic's server-side fallback. If a safety check declines the request, Anthropic retries it on a suitable model. Each run uses web search and costs real money, so check your API usage.

### Option B: coding agent

Open the repo in Claude Code (or Codex, Cursor and similar) and ask:

> Write the page for `sites/mysite/briefs/best-seo-course.json`.

The agent follows [`AGENTS.md`](AGENTS.md): it researches with its web tools, writes the research memo and the page folder, then runs `npm run validate`. You need no API key. You can also just ask "make a page about X with a cost chart", or paste HTML from a Claude artifact into `page.html`.

Both options follow the same rules: [`prompts/writing-rules.md`](prompts/writing-rules.md) (truth and style) and [`prompts/page-html.md`](prompts/page-html.md) (how to write the HTML).

## Review and publish

```bash
npm run validate -- --site mysite     # schema and quality checks
npm run dev -- --site mysite          # preview both versions (drafts included)
```

Check every price and claim against its source. Then set `"status": "approved"` in `meta.json`.

```bash
npm run as:deploy -- --site mysite    # Apps Script
npm run build -- --site mysite        # static site in dist/mysite/static/
```

**Static site (the control).** Set `static.baseUrl` in `site.json` (for example `https://example.com/guides`), then build. You get canonical tags, a meta description, `sitemap.xml` and `robots.txt`. Upload `dist/mysite/static/` to any static host. Two examples:

```bash
npx vercel deploy dist/mysite/static --prod
npx netlify deploy --dir dist/mysite/static --prod
```

## Measure

Use `track/results-template.csv`: one row per keyword per day.

- **Rank.** Track the keyword with any rank tracker. Record the position of the Apps Script URL and of the static URL.
- **Index.** `site:script.google.com/a/viral/macros/s/<deploymentId>` (or search the deploymentId alone, which finds both URL forms) and `site:yourdomain.com/<slug>` in Google.
- **Clicks.** Links to your product carry `utm_source=apps-script` or `utm_source=static`, `utm_medium=listicle` and `utm_content=<slug>` (on a single site the page is the home page, so it is `home`; shell buttons use their own value, such as `nav`, `footer` or `<slug>-box`). Compare them in your analytics. The validator makes sure no link to your own domains (`ownDomains` in `site.json`) skips the tags.
- **AI answers.** Ask ChatGPT, Perplexity and Google AI Mode the keyword once a week. Record which URL they cite, if any. Expect the Apps Script version to do badly outside Google: its text loads with JavaScript, and most AI crawlers do not run JavaScript.

**Stop rules.** Stop the test and delete the deployment if Google shows a manual action, the page gets a "Report abuse" takedown, or the account gets a warning.

## What Apps Script cannot do

| Limit | What it means |
|---|---|
| Meta description | Not possible. Google writes its own snippet. |
| Page title | Set by the script (`setTitle`). It works. |
| Content in an iframe | Google renders the page inside a sandbox frame. Google runs JavaScript, so it can read it. Most AI crawlers cannot. |
| Banner | Every visitor sees "This application was created by a Google Apps Script user". |
| Status codes | Every URL returns 200. An unknown `?page=` shows the home page. |
| Search Console | You cannot verify `script.google.com`. |
| Canonical tag | Not possible on the wrapper page. Keep every link on one URL form (`urlDomain`) instead. |

## Commands

| Command | What it does |
|---|---|
| `npm run dev -- --site <s> [--port 4321]` | Preview at http://localhost:4321 (static), /apps-script/, /styleguide/, /templates/top-n/, /templates/landing/ and /templates/blog-article/. Add `?theme=dark` to force a mode (only when `theme.scheme` is `auto`) |
| `npm run new -- --site <s> --keyword "<kw>"` | Create a brief |
| `npm run generate -- --site <s> --slug <slug> [--model <id>] [--force]` | AI script: research and write a draft page. `--force` overwrites an existing page folder |
| `npm run validate -- --site <s>` | Check every page |
| `npm run build -- --site <s> [--drafts]` | Build both targets into `dist/<s>/` |
| `npm run new-site -- --name <s> [--mode hub\|single\|site] [--from <site>] [--layout landing\|article\|guide] [--slug <slug>]` | Create a new site folder (default mode `hub`, warm paper theme). `--from` copies another site's `site.json` (IDs cleared, new UTM campaign), `theme.css` and `RULES.md`, no pages. `--layout` also writes a starter page from `templates/landing.html` or `templates/blog-article.html` (`guide`: `templates/top-n.html`) with the layout set in `meta.json` |
| `npm run brand:extract -- --url <url> [--site <s>] [--out <dir>]` | Read a website's colours, fonts, radii and buttons (real browser via `agent-browser` if installed, else fetched CSS). See `.claude/skills/clone-brand-style/SKILL.md` |
| `npm run as:login` | Log in to Google for clasp |
| `npm run as:init -- --site <s>` | Create the Apps Script project |
| `npm run as:push -- --site <s> [--drafts]` | Upload files. Prints the private `/dev` test URL (owner only) and how many drafts it skipped |
| `npm run as:deploy -- --site <s> [--drafts]` | Upload and publish. Same `/exec` URL every time. Only approved pages unless `--drafts` |
| `npm run as:urls -- --site <s> [--drafts]` | Print the public `/exec` URLs in the form Google indexes (`/a/<urlDomain>/`), the XML sitemap URL (or "off"), the original short form for reference and any drafts that are not live |
| `npm run schema` | Rewrite `schema/*.json` from `src/lib/schema.js` |

## Repo layout

```
AGENTS.md                 instructions for coding agents (CLAUDE.md links here)
prompts/writing-rules.md  truth rules (hard), ranking/disclosure defaults, style rules for every page
prompts/page-html.md      how to write page.html (components, placeholders, charts)
docs/design.md            design tokens, components, site structure, how to add a page
themes/default/           tokens.css, base.css, components.css, layouts.css (inlined into every page)
templates/                top-n.html (Top N comparison), landing.html (product landing page), blog-article.html (editorial article), theme-warm.css (the default site theme)
.claude/skills/           clone-brand-style: clone a website's visual style into a site theme
schema/                   JSON schemas for meta, brief and site files
sites/<site>/
  site.json               mode, name, brand, author (site mode only), disclosure (optional), ownDomains, forbid (optional), cta (+ sticky), navCta (optional), footer / sitemap (optional, single sites), home copy, hubs (site mode), theme (accent, scheme, fontsUrl), static.baseUrl, Apps Script IDs and urlDomain (default "viral"), utm
  RULES.md                optional owner rules for this site; they override prompts/writing-rules.md
  about.html              the About page (site mode only)
  theme.css               optional CSS overrides for this site (brand colours, fonts, radii)
  hubs/<slug>.html        optional intro text for a hub page
  briefs/<slug>.json      what to write
  research/<slug>.md      research memo with sources
  pages/<slug>/           meta.json (incl. "layout": guide | landing | article) + page.html
src/lib/                  schema, checks, theme loader, site shell and renderer, style guide, build
src/cli/                  the npm commands
track/                    results template
dist/                     build output (not committed)
```

## What this kit does not do

- **No cloaking, redirects or user-agent checks.** The router serves the same HTML to everyone. Do not add them. Google treats them as spam, and our research shows they get removed fast.
- **No mass page generation.** It builds a few useful pages that a person checks. Hundreds of thin pages count as scaled content abuse.
- **No fake signals.** No invented ratings, reviews or dates. `npm run validate` catches the common cases.

## License

MIT. See [`LICENSE`](LICENSE).
