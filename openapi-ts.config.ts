import "dotenv/config";
import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
	input: {
		path: "https://local.oikos.company/docs/openapi.json",
		fetch: {
			headers: {
				Authorization:
					"Basic " +
					btoa(`${process.env.ADMIN_USERNAME}:${process.env.ADMIN_PASSWORD}`),
			},
		},
	},
	output: {
		path: "./src/libs/oikos-sdk",
		postProcess: ["biome:format"],
	},
	plugins: [
		"@hey-api/client-axios",
		"@hey-api/schemas",
		{
			dates: true,
			name: "@hey-api/transformers",
		},
		{
			enums: "javascript",
			name: "@hey-api/typescript",
		},
		{
			name: "@hey-api/sdk",
			transformer: true,
		},
	],
});
