import { expoClient } from "@better-auth/expo/client";
import { anonymousClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";

export const authClient = createAuthClient({
	baseURL: `${process.env.EXPO_PUBLIC_BASE_URL}/auth`,
	fetchOptions: {
		headers: {
			"X-Client-Key": process.env.EXPO_PUBLIC_CLIENT_API_KEY ?? "",
		},
	},
	plugins: [
		expoClient({
			scheme: "oikos",
			storagePrefix: "oikos",
			storage: SecureStore,
		}),
		anonymousClient(),
	],
});
