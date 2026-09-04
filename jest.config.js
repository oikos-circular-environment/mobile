/** @type {import('jest-expo').JestExpoConfig} */
module.exports = {
	preset: "jest-expo",
	testMatch: ["<rootDir>/src/tests/**/*.test.{ts,tsx}"],
	/** O preset do jest-expo cobre .js/.jsx/.ts/.tsx; scripts/ usa .mjs. */
	transform: {
		...require("jest-expo/jest-preset").transform,
		"\\.mjs$": "babel-jest",
	},
	moduleNameMapper: {
		"^nativewind/jsx-runtime$": "react/jsx-runtime",
		"^nativewind/jsx-dev-runtime$": "react/jsx-dev-runtime",
		"^react-native-svg$": "<rootDir>/src/tests/__mocks__/react-native-svg.tsx",
		"^@gorhom/bottom-sheet$":
			"<rootDir>/src/tests/__mocks__/@gorhom/bottom-sheet.tsx",
		"^react-native-reanimated-carousel$":
			"<rootDir>/src/tests/__mocks__/react-native-reanimated-carousel.tsx",
		"^@/(.*)$": "<rootDir>/src/$1",
	},
	setupFilesAfterEnv: ["<rootDir>/src/tests/setup.ts"],
	// Estende o padrão do jest-expo para incluir pacotes ESM usados no projeto
	transformIgnorePatterns: [
		"/node_modules/(?!(.pnpm|react-native|@react-native|@react-native-community|expo|@expo|@expo-google-fonts|react-navigation|@react-navigation|@sentry/react-native|native-base|nativewind|@gluestack-ui|lucide-react-native|@legendapp|@gorhom|tailwind-merge|@faker-js/faker|standard-navigation|@oikos-circular-environment/oikos-sdk))",
		"/node_modules/react-native-reanimated/plugin/",
	],
	collectCoverageFrom: [
		"src/**/*.{ts,tsx}",
		"!src/components/ui/**",
		"!src/libs/oikos-sdk/**",
		"!src/tests/**",
	],
};
