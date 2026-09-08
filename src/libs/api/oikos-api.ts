import { client } from "@oikos-circular-environment/oikos-sdk/client.gen";
import type { AxiosError, AxiosResponse } from "axios";
import Constants from "expo-constants";
import { networkTelemetryBus } from "../network-telemetry-bus";
import {
	clearTokens,
	getAuthToken as getStoredToken,
	removeAuthToken,
	saveAuthToken,
} from "../storage";

// Development
// const baseURL = Platform.select({
// 	ios: "http://192.168.18.44:3333",
// 	android: "http://10.0.2.2:3333",
// });

// Production
const baseURL = process.env.EXPO_PUBLIC_BASE_URL;

const clientKey = process.env.EXPO_PUBLIC_CLIENT_API_KEY;
const appVersion = Constants.expoConfig?.version;

client.setConfig({ baseURL, throwOnError: true });

let authToken: string | null = null;
let onUnauthenticated: (() => void) | null = null;

// Initialize token from storage
getStoredToken().then(token => {
	if (token) authToken = token;
});

export async function setAuthToken(token: string | null) {
	authToken = token;
	if (token) {
		await saveAuthToken(token);
	} else {
		await removeAuthToken();
	}
}

export function getAuthToken(): string | null {
	return authToken;
}

export function setOnUnauthenticated(callback: (() => void) | null) {
	onUnauthenticated = callback;
}

// Headers every authenticated request needs — also used by <Image>/expo-image
// sources that fetch from /storage directly, bypassing this Axios instance.
export function getAuthenticatedImageHeaders(): Record<string, string> {
	const headers: Record<string, string> = {};
	if (authToken) headers.Authorization = `Bearer ${authToken}`;
	if (clientKey) headers["X-Client-Key"] = clientKey;
	if (appVersion) headers["X-App-Version"] = appVersion;
	return headers;
}

// Request interceptor: inject Bearer token, client-key and app version
client.instance.interceptors.request.use(config => {
	const headers = getAuthenticatedImageHeaders();
	for (const [key, value] of Object.entries(headers)) {
		config.headers.set(key, value);
	}
	return config;
});

function emitNetworkTelemetry(
	config: { url?: string } | undefined,
	status: number,
) {
	if (!config?.url) return;

	// O SDK gerado embute baseURL + querystring na própria `config.url` (sem usar
	// `config.params`), então extraímos pathname e query de volta a partir dela —
	// caso contrário sinais `kind: "api"` nunca casam com `path_pattern`.
	const url = new URL(config.url, baseURL ?? "http://localhost");
	const query: Record<string, string> = {};
	url.searchParams.forEach((value, key) => {
		query[key] = value;
	});

	networkTelemetryBus.emit({
		method: (config as { method?: string }).method?.toUpperCase() ?? "GET",
		path: url.pathname,
		status,
		query,
	});
}

// Response interceptor: on 401, end the local session — better-auth sessions
// have no client-side refresh flow to retry.
client.instance.interceptors.response.use(
	(response: AxiosResponse) => {
		emitNetworkTelemetry(response.config, response.status);
		return response;
	},
	async (error: AxiosError) => {
		emitNetworkTelemetry(error.config, error.response?.status ?? 0);

		if (error.response?.status === 401) {
			authToken = null;
			await clearTokens();
			onUnauthenticated?.();
		}

		return Promise.reject(error);
	},
);
