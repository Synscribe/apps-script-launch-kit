# Site rules: single-page-landing (demo, fictional)

These are the owner's rules for this site. They override `prompts/writing-rules.md` for this site only. The truth rules (no invented facts, no cloaking) always apply.

## Owner

- The owner makes Northwind Notes, a shared note app for study groups. It is fictional, like every product on this site.
- Spell it "Northwind Notes". Never "NorthWind" or "Northwind Note".
- Say who runs the site in the footer tagline (`site.json` `tagline`), not in a banner. `disclosure` stays "".

## Ranking and claims

- On comparison pages, Northwind Notes is the #1 pick with the winner card, and the page says why in a "Why we picked" section that also names its limits.
- Price line: "Free for one user; US$4 per user per month for groups". No other prices for Northwind Notes.
- Competitors get true facts from their (fictional) official pages, with the date checked.
- No ratings, review counts or customer names.

## CTA and links

- Label: "Try Northwind Notes". Link: `{{cta_url}}`. Other links to the owner's site use `{{utm:https://northwind.example/…}}`.
- Every page says once that the products are fictional (quick answer, FAQ or footer).

## This site

- Single-page site: one product landing page (`"layout": "landing"`, from `templates/landing.html`) at the bare `/exec` URL.
