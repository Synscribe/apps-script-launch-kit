// npm run schema  -> writes schema/*.schema.json from src/lib/schema.js (for agents and editors)
import path from "node:path";
import { z } from "zod";
import { ROOT, writeJson } from "../lib/project.js";
import { MetaSchema, BriefSchema, SiteSchema } from "../lib/schema.js";

for (const [name, schema] of [["meta", MetaSchema], ["brief", BriefSchema], ["site", SiteSchema]]) {
  const file = path.join(ROOT, "schema", `${name}.schema.json`);
  writeJson(file, z.toJSONSchema(schema));
  console.log(`Wrote ${path.relative(ROOT, file)}`);
}
