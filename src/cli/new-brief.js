// npm run new -- --site <name> --keyword "best seo course" [--slug best-seo-course]
import fs from "node:fs";
import path from "node:path";
import { args, siteName, sitePaths, slugify, writeJson, loadSite, fail, ROOT } from "../lib/project.js";

const flags = args();
const site = siteName(flags);
if (!flags.keyword || flags.keyword === true) fail('Pass the target keyword, e.g. --keyword "best seo course".');
const config = loadSite(site);
const slug = flags.slug && flags.slug !== true ? slugify(flags.slug) : slugify(flags.keyword);
const file = path.join(sitePaths(site).briefs, `${slug}.json`);
if (fs.existsSync(file)) fail(`Brief already exists: ${path.relative(ROOT, file)}`);

writeJson(file, {
  keyword: flags.keyword,
  slug,
  market: "Global, English",
  audience: "Who searches this? Describe them in one sentence.",
  searchIntent: "What do they want to decide or do?",
  angle: "Why will this page be more useful than what ranks today?",
  format: "listicle with a comparison table",
  itemCount: 3,
  mustInclude: [
    { name: config.brand.name, url: config.brand.url, isOwn: true, notes: fs.existsSync(path.join(sitePaths(site).dir, "RULES.md")) ? `Follow sites/${site}/RULES.md for where it ranks, its name, price and CTA.` : "Include only if it really fits this query. Rank it by the same criteria as the rest." },
  ],
  exclude: [],
  notes: "",
  hub: config.mode === "site" ? config.hubs[0]?.slug || "" : "",
});
console.log(`Created ${path.relative(ROOT, file)}. Edit it, then run:
  npm run generate -- --site ${site} --slug ${slug}     (AI API)
or ask your coding agent: "Write the page for sites/${site}/briefs/${slug}.json" (see AGENTS.md)`);
