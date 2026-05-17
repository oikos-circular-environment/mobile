import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "oikos_auth_token";
const REFRESH_TOKEN_KEY = "oikos_refresh_token";

export async function saveAuthToken(token: string) {
	await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getAuthToken() {
	return await SecureStore.getItemAsync(TOKEN_KEY);
}

export async function removeAuthToken() {
	await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function saveRefreshToken(token: string) {
	await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
}

export async function getRefreshToken() {
	return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function removeRefreshToken() {
	await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}

export async function clearTokens() {
	await Promise.all([
		removeAuthToken(),
		removeRefreshToken(),
	]);
}
