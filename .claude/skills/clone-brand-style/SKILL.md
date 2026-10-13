---
name: clone-brand-style
description: Clone the visual style of any website (colours, fonts, radii, button style, spacing feel) into sites/<site>/theme.css and site.json theme, without copying its name, logo or copy. Use when the user says "make the site look like <url>", "match our brand", "use the colours from our homepage" or asks for a theme based on a URL.
---

# Clone a brand style from a URL

Goal: a `sites/<site>/theme.css` (plus `theme.accent` and `theme.fontsUrl` in `site.json`) that makes the kit's pages feel like the source site. Style only. Never copy the source's name, logo, wordmark, images or text. The site stays the kit's own site, with its own content.

## 0. Before you start

- Ask whose brand it is if it is not clear. If it is a client's or another company's brand, get the user to confirm that the owner agreed in writing (see the README risk note). Your own brand is fine.
- Read `sites/<site>/RULES.md` if it exists. It may fix the colour scheme (for example "light only").
- If the site does not exist yet, create it first: `npm run new-site -- --name <site> --mode site|hub|single` (or `--from <existing-site>` to copy its setup).

## 1. Extract the values

```bash
npm run brand:extract -- --url https://example.com/ --site <site> --out sites/<site>/research/brand
```

- With `agent-browser` installed (`npm i -g agent-browser && agent-browser install`) it loads the page in a real browser and reads computed styles. It also saves two screenshots next to the report. Look at them.
- Without it, it fetches the HTML and CSS and reads what it can. Colours are then counted in the CSS text, so check them against a screenshot before you trust them.
- The report prints: `fontLinks` (Google Fonts, Typekit), `fontFaces`, `customProps` (the source's own tokens, often the best source of truth), `backgrounds`, `textColors`, `borders`, `radii`, `fontFamilies`, `headings`, `link`, `buttons` (grouped by look, most common first), `outlineButtons`, `header`, `maxWidths`, `hasDarkMode`.
- If the page needs more than the home page (for example buttons live on a pricing page), run it again on that URL.

If you prefer to look yourself: `agent-browser open <url>`, `agent-browser screenshot`, then `agent-browser eval --stdin` with `getComputedStyle` calls. Scroll and screenshot a few sections; the home page hero rarely shows the body text style.

## 2. Map the values onto the theme tokens

The tokens are in `themes/default/tokens.css` (read it first). Write only the ones that differ into `sites/<site>/theme.css`, inside `:root { … }`. The file is inlined after the theme, so it wins.

| Source value | Token | Notes |
|---|---|---|
| page background | `--bg` | |
| card or panel background | `--surface`, `--surface-2` | Lighter than the page on a tinted canvas, darker on a white page |
| body text | `--fg` | |
| secondary text, captions | `--fg-2`, `--muted` | |
| hairlines, input borders | `--line`, `--line-2`, `--line-strong` | |
| primary button background | `--accent` (also `theme.accent` in site.json) | One accent per site |
| link colour | `--accent-ink` | Often the same as the accent; in dark mode make it lighter |
| primary button text | `--accent-fg` | |
| button hover | `--accent-hover` | Darker in light mode, lighter in dark mode |
| tinted boxes | `--accent-soft` | A 6 to 12% mix of the accent with the page |
| success, warning, error | `--ok`, `--warn`, `--bad` | |
| button radius | `--radius-btn` | `999px` for pills |
| control radius, card radius | `--radius`, `--radius-lg` | |
| card shadow | `--shadow-card` | `none` for flat designs |
| body font | `--font-sans` | The web font first, then a full system fallback stack |
| heading font | `--font-display` | Only if the source uses a second face |
| heading weight, h1 tracking | `--heading-weight`, `--heading-tracking` | |
| line height | `--leading` | |

Fonts:

- If the source uses a Google Font, set `theme.fontsUrl` in `site.json` to the `fonts.googleapis.com/css2?family=…&display=swap` URL. The build adds a `<link rel="preconnect">` and the stylesheet link. Google Fonts work as a `<link>` on both targets, including the Apps Script HtmlService output.
- If the source self-hosts a font that is also on Google Fonts (check https://fonts.google.com/?query=<name>), use the Google Fonts copy.
- If the font is not available, pick the closest free face or the system stack, and say so in the report. Do not copy font files from the source.
- Always keep a fallback stack after the web font: `"Font Name", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`.

Colour scheme (`theme.scheme` in `site.json`):

- `"auto"` (default): the page follows the visitor's system setting, so you need light and dark tokens.
- `"light"` or `"dark"`: the page always uses that look, and the other block in `theme.css` never shows. Use this when the source has only one look and the owner wants to match it exactly, or when the site's `RULES.md` says so.

Dark mode (only when `theme.scheme` is `"auto"`):

- If the source has a dark theme (`hasDarkMode: true`), extract it too: `agent-browser set media dark`, then run the eval again, and fill the two dark blocks (`@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { … } }` and `:root[data-theme="dark"] { … }`).
- If the source is light only, design a counterpart: keep the hue of the page (warm stays warm), use a near-black page, slightly lighter surfaces, cream or light grey text, the same accent for buttons, and a lighter accent for links so they pass contrast. Say in the theme.css comment that the dark theme is designed, not extracted.

Write a comment block at the top of `theme.css` with the source URL, the date and the raw values you used. This is the audit trail.

## 3. Check it

1. `npm run dev -- --site <site>`, open http://localhost:4321/styleguide/. Every component must still read well. Check contrast on links, badges and `tr.own` rows. With `theme.scheme: "auto"`, also check `?theme=dark`. (With a forced scheme, the dev server ignores `?theme=`, like production.)
2. Open one real page and the home page, on desktop and at phone width (`agent-browser set viewport 390 844`).
3. If you set `fontsUrl`, confirm the font loaded: `agent-browser eval "document.fonts.check('16px \"Font Name\"')"` must print `true` after the page loads.
4. `npm run validate -- --site <site>` and `npm run build -- --site <site>`.

## What not to do

- Do not copy the logo, wordmark, mascot, illustrations, photos or icon set.
- Do not copy headline text, taglines or any copy.
- Do not copy the layout wholesale. The kit's shell stays; only the tokens change. Small per-site CSS (a header tint, a card background) is fine.
- Do not add scripts or external CSS from the source site.
