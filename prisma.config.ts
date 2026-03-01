// Prisma configuration file
import "dotenv/config";
import { defineConfig } from "prisma/config";

// Construct DATABASE_URL from individual variables
const dbHost = process.env.DATABASE_HOST || "localhost";
const dbUser = process.env.DATABASE_USER || "root";
const dbPassword = process.env.DATABASE_PASSWORD || "";
const dbName = process.env.DATABASE_NAME || "bitsphotomart";
const dbPort = process.env.DATABASE_PORT || "3306";
const databaseUrl = `mysql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts",
  },
  datasource: {
    url: databaseUrl,
  },
});
