// Data shapes. Pages are freeform HTML plus a small meta.json.
import { z } from "zod";

// pages/<slug>/meta.json (for freeform page.html)
export const MetaSchema = z.object({
  title: z.string().describe("Browser and Google title, 60 characters or less, contains the keyword"),
  description: z.string().describe("155 characters or less. Meta description on the static site; card text on the home page"),
  keyword: z.string().describe("The main search query this page targets"),
  status: z.enum(["draft", "approved"]).describe('"draft" until a person reviews the page'),
  updated: z.string().describe("Date of the last real change, YYYY-MM-DD"),
  ownProduct: z.boolean().describe("True if the page names or recommends the site owner's product. If site.json has a non-empty disclosure, the shell shows it"),
  featured: z.boolean().describe("Site mode only: list first on the home page and hub pages. No effect in hub or single mode"),
  type: z.enum(["guide", "comparison", "tool"]).default("guide").describe('Page type: "guide" (how-to or explainer), "comparison" (ranked list or X vs Y), "tool" (calculator or checker). Sets the label and the grouping on hub pages'),
  layout: z.enum(["guide", "landing", "article"]).default("guide").describe('Page shell. "guide" (default): article column with meta line, "On this page", CTA box and (site mode) related guides. "landing": full-width sections, header with logo + CTA only, no meta line, rail or CTA box; start from templates/landing.html. "article": narrow centred reading column with serif headings, no header, no rail or CTA box, slim footer; start from templates/blog-article.html'),
  hub: z.string().default("").describe("Slug of the hub (topic) this page belongs to, from site.json hubs. Empty = no hub"),
  related: z.array(z.string()).default([]).describe("Slugs to show first under Related guides. The build fills the rest by hub and keyword"),
  cta: z.object({ label: z.string(), url: z.string(), text: z.string() }).optional().describe("Override the site CTA on this page only: the CTA box, the sticky bar, the hub-mode footer button and {{cta_url}}. In hub and single mode the header button keeps site.navCta when it is set; otherwise the header follows this too. E.g. a course page that promotes the course"),
});

export const BriefSchema = z.object({
  keyword: z.string(),
  slug: z.string(),
  market: z.string().describe('Country and language, e.g. "Global, English"'),
  audience: z.string(),
  searchIntent: z.string().describe("What the searcher wants to do or decide"),
  angle: z.string().describe("What makes this page more useful than the current results"),
  format: z.string().describe('Page idea, e.g. "listicle", "how-to guide", "comparison with a cost chart", "calculator"'),
  itemCount: z.number().int().describe("For lists: how many items. 0 if not a list"),
  mustInclude: z.array(z.object({ name: z.string(), url: z.string(), isOwn: z.boolean(), notes: z.string() })),
  exclude: z.array(z.string()),
  notes: z.string(),
  hub: z.string().default("").describe("Hub slug from site.json hubs. The generator copies it into the page"),
});

export const SiteSchema = z.object({
  forbid: z.array(z.object({ pattern: z.string().describe("JavaScript regular expression, case-insensitive"), message: z.string() })).default([]).describe("Site rules the validator enforces on every page.html, e.g. banned wording. Mirrors sites/<site>/RULES.md"),
  mode: z.enum(["site", "hub", "single"]).default("site").describe('"site": full site with nav, hubs and related links. "hub": a home page that lists every page; each page has a logo + CTA header and a footer that links to home and every other page. "single": one page is the whole site'),
  name: z.string().describe("Site name shown in the header"),
  tagline: z.string().describe("One line under the name on the home page"),
  language: z.string(),
  brand: z.object({ name: z.string(), url: z.string() }),
  author: z.object({ name: z.string(), url: z.string(), bio: z.string() }).describe("Site mode: the bio shows on the home page and About. Pages never show an author byline. Article JSON-LD names the author only when name is not empty"),
  disclosure: z.string().default("").describe("Optional. Shown under the page meta line when a page sets ownProduct, in the footer and on About. Empty = nothing renders and the validator does not require it"),
  ownDomains: z.array(z.string()).default([]).describe('Hostnames you own, e.g. ["example.com", "www.example.com"]. The validator errors when page.html links to one of them without {{utm:…}}, {{cta_url}} or {{brand_url}}. The hosts of brand.url and cta.url always count'),
  footer: z.boolean().default(true).describe("false = no footer at all on any page. Use it for a one-page site that needs nothing under the closing CTA. Hub and site modes need the footer for crawl links; keep it on there"),
  sitemap: z.boolean().default(true).describe("false = no XML sitemap: ?page=sitemap.xml is not served, no footer link, no static sitemap.xml. Fine for a one-page site: the /exec URL is the only URL"),
  navCta: z.object({ label: z.string(), url: z.string() }).optional().describe("Hub and single mode: the header button on every page (meta.cta does not change it). Defaults to the CTA. Use it when the header should say something different, e.g. \"Best AI Agent for SEO & GEO\". Site mode ignores it"),
  cta: z.object({
    label: z.string(),
    url: z.string(),
    text: z.string(),
    sticky: z.boolean().default(false).describe("Show a small bottom CTA bar on phones on every page (not the home page). Same for every visitor. It adds bottom padding so it never covers text, and it can be dismissed"),
  }),
  home: z.object({ title: z.string(), headline: z.string(), intro: z.string() }),
  static: z.object({ baseUrl: z.string() }),
  appsScript: z.object({
    projectTitle: z.string(),
    scriptId: z.string(),
    deploymentId: z.string(),
    urlDomain: z.string().regex(/^[A-Za-z0-9.-]*$/, "letters, digits, dots and hyphens only").default("viral").describe("The <x> in https://script.google.com/a/<x>/macros/s/<deploymentId>/exec. Every public Apps Script URL the kit writes (links between pages, JSON-LD, the XML sitemap, as:urls) uses this form, because it is the form Google indexes. Any value works; both forms serve the same page. Default \"viral\". Set \"\" to use the short form https://script.google.com/macros/s/<deploymentId>/exec. Keep it the same once pages are indexed"),
    timeZone: z.string(),
    urlStyle: z.enum(["query", "path"]),
  }),
  utm: z.object({ medium: z.string(), campaign: z.string() }),
  theme: z.object({
    name: z.string().default("default").describe("Folder under themes/"),
    accent: z.string().describe("Hex colour. Sets --accent for the whole site"),
    scheme: z.enum(["auto", "light", "dark"]).default("auto").describe('"auto" follows the visitor\'s system setting. "light" or "dark" forces one look'),
    fontsUrl: z.string().default("").describe("Optional stylesheet URL for a web font (Google Fonts works as a <link> on both targets). Empty = system font stack. Set --font-sans in sites/<site>/theme.css with a system fallback stack"),
    serifFontsUrl: z.string().default("https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,500..700;1,6..72,400&display=swap").describe('Stylesheet URL for the serif display font that pages with "layout": "article" use for headings (--font-serif, Newsreader by default, with a system serif fallback). Only article pages load it. Empty = no extra font request, system serif'),
  }),
  hubs: z.array(z.object({
    slug: z.string().describe("lowercase-words-with-hyphens. Becomes /<slug>/ and ?page=<slug>. Must not clash with a page slug"),
    title: z.string().describe("Short topic name, shown in the nav and as the hub page h1"),
    description: z.string().describe("One or two sentences under the hub title and on the home page"),
  })).default([]).describe("Topics. Each hub gets its own page that lists the pages assigned to it with meta.hub"),
});

// Generated freeform page from the AI script: meta + HTML body in one object.
export const GeneratedPageSchema = z.object({
  title: z.string(),
  description: z.string(),
  html: z.string().describe("The page body as an HTML fragment: one <h1>, then sections. May include <style> and <script> (CDN charts). No <html>, <head> or <body> tags"),
});
