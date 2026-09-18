import { defineConfig } from "drizzle-kit";

export default defineConfig({
	dialect: "sqlite",
	driver: "expo",
	schema: "./src/libs/db/schema.ts",
	out: "./src/libs/db/migrations",
});
