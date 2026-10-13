# Writing rules for every page

Both generators follow these rules: the AI script (`npm run generate`) and a coding agent (see `AGENTS.md`).
Change them here, and both change.

**Site rules come first.** If `sites/<site>/RULES.md` exists, read it before you write. It overrides the **defaults** in this file (ranking, disclosure, CTA wording, prices of the owner's product). It can never override the **hard rules** below.

## Hard rules (never break these)

1. **Facts must be true and sourced.** Every fact about any product (name, price, features, length, format, who makes it, dates) comes from a page you opened. Put the URL in the item's sources and in the page sources. If a fact is not published, write "Not published" or leave it out.
2. **Never invent social proof.** No made-up ratings, reviews, testimonials, student numbers, awards, quotes or "trusted by" lines. Do not imply a rating or review that you did not read.
3. **Prices as published.** When you state a price, copy it from the official page and add the date you checked: `US$299 one-time (checked 2026-10-07)`. Write the currency code only if the page states it; if the page shows only "$", write "$". Say when a price change is announced on the official page. (A site `RULES.md` may forbid prices for the owner's product. Then state none.)
4. **Real dates only.** `updated` is the date you wrote or really changed the page. Never set a future date. Never change the date without changing the content.
5. **No cloaking.** No user-agent checks, bot detection, redirects, hidden text, keyword stuffing or iframes of other sites. The page must be the same for every visitor and every crawler. The validator blocks the common patterns.
6. **No false claims about competitors.** You may say what a competitor lacks when its official page shows it. You may not guess, exaggerate or attack. Write cons as facts: "The syllabus does not cover AI search", not "useless for AI search".
7. **Links to your own product carry UTM tags.** Write them as `{{utm:https://…}}`, `{{cta_url}}` or `{{brand_url}}`. The validator errors on a plain link to a domain in `site.json` `ownDomains`, `brand.url` or `cta.url`.
8. **Do not copy text** from other sites. Write in your own words and cite the source.
9. **Do not publish.** Generators always write `"status": "draft"`. A person reviews the page and sets `"approved"`.

## Ranking and the owner's product (defaults; a site RULES.md may override them)

This is the owner's site, so the pages may make the case for the owner's product. Use these defaults when the site has no `RULES.md`, or when its `RULES.md` does not cover the point:

- **Ranking.** The owner's product may be ranked #1 and the page may lead with it (quick answer, winner card, CTA band, closing CTA). Persuasive copy is fine: say plainly what it does for the reader and why you picked it. By default, include it only when it fits the query. A site `RULES.md` may say that the owner's product is always #1 and that the criteria lead with its strengths.
- **Criteria.** State the criteria and say how each pick meets them. Give competitors their real strengths. Say who should pick #2 or #3 ("Pick X if…").
- **Disclosure.** By default, say when a product is the owner's: set `ownProduct: true` and a `site.json` `disclosure`, or write one plain sentence in the winner card note. A site `RULES.md` may say "no disclosure". Then keep `disclosure: ""` and add no note.
- **Prices and CTA wording** for the owner's product: by default, show the price as published and use a plain CTA label ("Visit Product"). A site `RULES.md` may forbid prices or fix the CTA wording.
- **No author byline.** The shell does not render an author on pages. Do not add one in `page.html`.
- `ownProduct: true` in `meta.json` marks pages that name the owner's product.
- Use `templates/top-n.html` for "Top N" comparison pages, `templates/landing.html` for a product landing page (`"layout": "landing"`) and `templates/blog-article.html` for an editorial article with ranked picks (`"layout": "article"`). See `prompts/page-html.md`.

The hard rules still apply to every product, including the owner's: no false facts, no invented reviews, no false claims about competitors.

## Usefulness

10. Answer the query in the first paragraph. Name the pick or picks.
11. Make each item easy to compare: the same fields, filled in the same way.
12. "Best for" says who should pick it, for example "Founders who want to do SEO themselves".
13. Write 3 to 5 FAQs that people really ask about the topic. One FAQ about the owner's product is fine when people ask it.
14. The verdict or "why we picked #1" section says which pick suits which reader. It does not repeat the list.

## Style

Use ASD-STE100 Simplified Technical English as a guide.

15. Use short sentences, 20 words or fewer.
16. Use active voice.
17. Put one idea in each sentence.
18. Use common words. Explain a technical term the first time you use it.
19. Do not use filler or hype words: "ultimate", "game-changer", "unlock", "seamless", "revolutionary", "in today's fast-paced world". Persuasion comes from concrete benefits and facts, not adjectives.
20. `title` has 60 characters or fewer and contains the keyword. `description` has 155 characters or fewer.
