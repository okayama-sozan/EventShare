/**
 * Apply production D1 migrations when Cloudflare build credentials are present.
 *
 * Workers Builds injects CLOUDFLARE_API_TOKEN for wrangler. Local `npm run build`
 * without a token skips this step — run `npm run db:migrate:remote` yourself
 * before deploying from a laptop.
 *
 * The token needs Account → D1 → Edit. If apply fails, fail the build so a
 * schema-behind Worker is not shipped again.
 */
import { spawnSync } from "node:child_process";

if (!process.env.CLOUDFLARE_API_TOKEN) {
  console.log("[migrate] skip (no CLOUDFLARE_API_TOKEN; use npm run db:migrate:remote)");
  process.exit(0);
}

console.log("[migrate] applying production D1 migrations…");
const result = spawnSync(
  "npx",
  ["wrangler", "d1", "migrations", "apply", "DB", "--remote", "--env", "production"],
  { stdio: "inherit", shell: true },
);
process.exit(result.status ?? 1);
