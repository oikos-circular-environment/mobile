import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "oikos_auth_token";

export async function saveAuthToken(token: string) {
	await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getAuthToken() {
	return await SecureStore.getItemAsync(TOKEN_KEY);
}

export async function removeAuthToken() {
	await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function clearTokens() {
	await Promise.all([
		removeAuthToken(),
		// Chave órfã do par refresh-token do auth v1 (aposentado) — limpa best-effort
		// pra não deixar lixo permanente no Keychain/Keystore de quem já tinha o app.
		SecureStore.deleteItemAsync("oikos_refresh_token"),
	]);
}
