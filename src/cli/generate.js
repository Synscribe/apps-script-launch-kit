// npm run generate -- --site <name> --slug <brief-slug> [--model claude-opus-5-5]
// AI generation with the Claude API, in two steps:
//   1. Research: Claude searches the web and writes a sourced research memo (saved for review).
//   2. Write: Claude turns the brief + memo into a page.
//      Output: pages/<slug>/page.html + meta.json.
// The write step gets prompts/writing-rules.md, sites/<site>/RULES.md (if it exists; it overrides the
// generic rules), the site mode and CTA settings, prompts/page-html.md and templates/top-n.html.
// The page is saved as a draft. A person reviews it and sets "status": "approved".
import fs from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { args, siteName, loadSite, loadBrief, sitePaths, writeJson, fail, today, loadEnv, ROOT } from "../lib/project.js";
import { GeneratedPageSchema } from "../lib/schema.js";
import { lintHtml, checkMeta } from "../lib/checks.js";

loadEnv();
const flags = args();
const site = siteName(flags);
if (!flags.slug || flags.slug === true) fail("Pass the brief slug, e.g. --slug best-seo-course.");
const config = loadSite(site);
const brief = loadBrief(site, flags.slug);
const model = (flags.model !== true && flags.model) || process.env.CLAUDE_MODEL || "claude-opus-5-5";
const rules = fs.readFileSync(path.join(ROOT, "prompts", "writing-rules.md"), "utf8");
const pageGuide = fs.readFileSync(path.join(ROOT, "prompts", "page-html.md"), "utf8");
const topN = fs.readFileSync(path.join(ROOT, "templates", "top-n.html"), "utf8");
const paths = sitePaths(site);
// Owner rules for this site. They override the generic writing rules where they differ.
const siteRulesFile = path.join(paths.dir, "RULES.md");
const siteRules = fs.existsSync(siteRulesFile) ? fs.readFileSync(siteRulesFile, "utf8") : "";
const siteInfo = {
  name: config.name,
  mode: config.mode,
  brand: config.brand,
  ownDomains: config.ownDomains,
  cta: { label: config.cta.label, url: config.cta.url },
  ...(config.navCta ? { navCta: config.navCta } : {}),
  disclosure: config.disclosure,
};
const date = today();

// The SDK finds credentials itself: ANTHROPIC_API_KEY, or a profile from "ant auth login".
const client = new Anthropic();

const textOf = (content) => content.filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();

async function research() {
  const prompt = `You are researching a page for "${brief.keyword}". Today is ${date}.

Brief:
${JSON.stringify(brief, null, 2)}

Site owner: ${config.brand.name} (${config.brand.url}).
${siteRules ? `\nSite rules from the owner (they override anything else here; follow them when you pick and describe options):\n${siteRules}\n` : ""}
Task:
1. Search the web for the ${brief.itemCount + 3} strongest real options for this query, for this audience and market.
   Include every product in "mustInclude". Skip anything in "exclude".
2. Look at what ranks today for "${brief.keyword}". Note what those pages cover and what they miss.
3. For each option, open its official page. Record: exact name, official URL, what it is, who it is for,
   format, length, price as published (with currency), and 2-4 strengths and 1-3 weaknesses.
   Every fact needs the URL you got it from.
4. If you cannot confirm a fact, write "not confirmed". Do not guess.

Output a research memo in Markdown: one section per option with facts and source URLs,
then a short section "What current results miss". No page copy yet.`;

  const tools = [{ type: "web_search_20260209", name: "web_search", max_uses: 20 }];
  let assistantContent = [];
  let msg;
  // Web search runs on Anthropic's servers. A long search can pause; resend to continue.
  for (let turn = 0; turn < 6; turn++) {
    const messages = [{ role: "user", content: prompt }];
    if (assistantContent.length) messages.push({ role: "assistant", content: assistantContent });
    const stream = client.beta.messages.stream({
      model,
      max_tokens: 32000,
      thinking: { type: "adaptive" },
      output_config: { effort: "high" },
      tools,
      messages,
      // If a safety classifier declines, Anthropic retries on a suitable fallback model.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
    });
    msg = await stream.finalMessage();
    assistantContent = [...assistantContent, ...msg.content];
    if (msg.stop_reason !== "pause_turn") break;
    process.stdout.write("  (search paused, continuing)\n");
  }
  if (msg.stop_reason === "refusal") fail("Claude declined the research request. Check the brief.");
  if (msg.stop_reason === "max_tokens") console.warn("  Warning: research memo hit max_tokens and may be cut short.");
  const memo = textOf(assistantContent);
  if (!memo) fail("Research step returned no text.");
  return memo;
}

async function write(memo) {
  const common = `Today is ${date}.

Follow these rules exactly:
${rules}
${siteRules ? `\nSite rules (sites/${site}/RULES.md). They OVERRIDE the generic rules above wherever they differ:\n${siteRules}\n` : ""}
Site (mode "${config.mode}"${config.mode === "single" ? ": one page is the whole site, so do not use {{link:…}}" : config.mode === "hub" ? ": no hub pages, so do not use {{hub:…}}, {{guides}}, {{about}} or {{sitemap}}" : ""}). Do not add an author byline:
${JSON.stringify(siteInfo, null, 2)}

Brief:
${JSON.stringify(brief, null, 2)}

Research memo (your only source of facts; cite its URLs):
${memo}`;
  const prompt = `Write a web page for the keyword "${brief.keyword}". Page idea: ${brief.format}. ${common}

How to build the HTML:
${pageGuide}

For a ranked or "Top N" comparison, start from this template and replace every [[placeholder]]
(follow the site rules for the price line, the CTA label and any disclosure note). Remove the HTML comments:
${topN}

Return the title (60 characters or less, with the keyword), the description (155 characters or less) and the HTML body.`;
  const response = await client.messages.parse({
    model,
    max_tokens: 32000,
    output_config: { effort: "high", format: zodOutputFormat(GeneratedPageSchema) },
    messages: [{ role: "user", content: prompt }],
  });
  if (response.stop_reason === "refusal") fail("Claude declined the write request.");
  if (response.stop_reason === "max_tokens") fail("The page hit max_tokens before it finished. Ask for a shorter page and try again.");
  if (!response.parsed_output) fail("Claude's answer did not match the expected format. Try again.");
  return response.parsed_output;
}

const pageDir = path.join(paths.pages, brief.slug);
if (fs.existsSync(pageDir) && !flags.force) fail(`${path.relative(ROOT, pageDir)}/ exists. Pass --force to overwrite it.`);

try {
  console.log(`Researching "${brief.keyword}" with ${model}…`);
  const memo = await research();
  const memoFile = path.join(paths.research, `${brief.slug}.md`);
  fs.mkdirSync(paths.research, { recursive: true });
  fs.writeFileSync(memoFile, `# Research: ${brief.keyword}\n\n_Generated ${date} by ${model}. Check the facts before you approve the page._\n\n${memo}\n`);
  console.log(`  Saved research memo: ${path.relative(ROOT, memoFile)}`);

  console.log("Writing the page…");
  const out = await write(memo);
  fs.mkdirSync(pageDir, { recursive: true });
  let result;
  const ownProduct = out.html.toLowerCase().includes(config.brand.name.toLowerCase());
  const type = /calculator|checker|tool/i.test(brief.format) ? "tool" : /list|compar|vs\b|best/i.test(brief.format + " " + brief.keyword) ? "comparison" : "guide";
  const meta = { title: out.title, description: out.description, keyword: brief.keyword, status: "draft", updated: date, ownProduct, featured: false, type, hub: config.mode === "site" ? brief.hub : "" };
  writeJson(path.join(pageDir, "meta.json"), meta);
  fs.writeFileSync(path.join(pageDir, "page.html"), out.html.trim() + "\n");
  const a = lintHtml(out.html, meta, config); const b = checkMeta(meta);
  result = { errors: [...a.errors, ...b.errors], warnings: [...a.warnings, ...b.warnings] };
  console.log(`  Saved draft: ${path.relative(ROOT, pageDir)}/`);
  result.errors.forEach((e) => console.log(`  error: ${e}`));
  result.warnings.forEach((w) => console.log(`  warn:  ${w}`));
  console.log(`
Next:
  1. Read the memo and the page. Check every price and claim against its source.
  2. npm run dev -- --site ${site}      (preview)
  3. Set "status": "approved" in meta.json.
  4. npm run as:deploy -- --site ${site}`);
} catch (e) {
  if (e instanceof Anthropic.AuthenticationError) fail("No valid Claude API credentials. Put ANTHROPIC_API_KEY in .env, or run \"ant auth login\".");
  if (e instanceof Anthropic.RateLimitError) fail("Rate limited by the Claude API. Wait a minute and try again.");
  if (e instanceof Anthropic.APIError) fail(`Claude API error ${e.status}: ${e.message}`);
  throw e;
}
