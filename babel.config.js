module.exports = api => {
	api.cache(true);
	return {
		presets: [["babel-preset-expo"]],
		plugins: [
			[
				"module-resolver",
				{
					root: ["./src"],
					alias: {
						"@": "./src",
					},
				},
			],
			["inline-import", { extensions: [".sql"] }],
			"react-native-reanimated/plugin",
		],
	};
};
