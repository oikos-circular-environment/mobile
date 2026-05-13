import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
	input: "http://localhost:3333/docs/openapi.json",
	output: {
		path: "./src/libs/client",
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
