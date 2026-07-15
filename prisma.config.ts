import path from "node:path";
import { config as loadEnv } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Next.js keeps secrets in .env.local; the Prisma CLI only auto-loads .env, so load it explicitly.
loadEnv({ path: path.resolve(process.cwd(), ".env.local") });

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    // Migrate/introspect require a direct (unpooled) connection — not the pgbouncer endpoint.
    url: env("NEON_DIRECT_URL"),
  },
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
