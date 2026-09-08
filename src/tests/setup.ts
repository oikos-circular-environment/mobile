import { notifyManager } from "@tanstack/query-core";
import { configure } from "@testing-library/react-native";

// createAuthClient (better-auth) valida a baseURL de forma síncrona no boot do
// módulo — diferente do axios, que só falha ao disparar uma request de verdade.
process.env.EXPO_PUBLIC_BASE_URL ??= "https://test.oikos.invalid";

jest.mock("react-native-worklets", () =>
	require("react-native-worklets/src/mock"),
);
jest.mock("react-native-reanimated", () =>
	require("react-native-reanimated/mock"),
);
jest.mock(
	"react-native-safe-area-context",
	() => require("react-native-safe-area-context/jest/mock").default,
);
jest.mock("expo-crypto", () => ({
	randomUUID: () => require("node:crypto").randomUUID(),
}));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Make TanStack Query notifications synchronous so state updates from
// mutations fire within the current act() scope instead of via setTimeout,
// preventing "overlapping act()" warnings and open handle warnings.
notifyManager.setScheduler(callback => callback());

configure({
	asyncUtilTimeout: 3000,
});
