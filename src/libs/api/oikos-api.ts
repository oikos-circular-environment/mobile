import type { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { AxiosError } from "axios";
import Constants from "expo-constants";
import { networkTelemetryBus } from "../network-telemetry-bus";
import { client } from "../oikos-sdk/client.gen";
import {
	clearTokens,
	getRefreshToken as getStoredRefreshToken,
	getAuthToken as getStoredToken,
	removeAuthToken,
	removeRefreshToken,
	saveAuthToken,
	saveRefreshToken,
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
let refreshToken: string | null = null;
let onUnauthenticated: (() => void) | null = null;

// Initialize tokens from storage
getStoredToken().then(token => {
	if (token) authToken = token;
});
getStoredRefreshToken().then(token => {
	if (token) refreshToken = token;
});

export function setAuthToken(token: string | null) {
	authToken = token;
	if (token) {
		saveAuthToken(token);
	} else {
		removeAuthToken();
	}
}

export function getAuthToken(): string | null {
	return authToken;
}

export function setRefreshToken(token: string | null) {
	refreshToken = token;
	if (token) {
		saveRefreshToken(token);
	} else {
		removeRefreshToken();
	}
}

export function getRefreshToken(): string | null {
	return refreshToken;
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

// Response interceptor: handle 401 with auto-refresh
let isRefreshing = false;
let failedQueue: Array<{
	resolve: (token: string) => void;
	reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
	failedQueue.forEach(prom => {
		if (error) prom.reject(error);
		else prom.resolve(token!);
	});
	failedQueue = [];
}

function emitNetworkTelemetry(
	config: InternalAxiosRequestConfig | undefined,
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
		method: (config.method ?? "get").toUpperCase(),
		path: url.pathname,
		status,
		query,
	});
}

client.instance.interceptors.response.use(
	(response: AxiosResponse) => {
		emitNetworkTelemetry(response.config, response.status);
		return response;
	},
	async (error: AxiosError) => {
		emitNetworkTelemetry(error.config, error.response?.status ?? 0);

		const originalRequest = error.config as {
			_retry?: boolean;
			url?: string;
			headers: Record<string, string>;
		} & typeof error.config;

		if (
			error.response?.status !== 401 ||
			originalRequest?._retry ||
			originalRequest?.url?.includes("/v1/auth/refresh")
		) {
			return Promise.reject(error);
		}

		if (isRefreshing) {
			return new Promise<string>((resolve, reject) => {
				failedQueue.push({ resolve, reject });
			}).then(token => {
				originalRequest.headers.Authorization = `Bearer ${token}`;
				return client.instance(originalRequest);
			});
		}

		originalRequest._retry = true;
		isRefreshing = true;

		try {
			const storedRefreshToken = await getStoredRefreshToken();
			if (!storedRefreshToken) throw new Error("No refresh token");

			const response = await client.instance.patch(
				"/v1/auth/refresh",
				{ refreshToken: storedRefreshToken },
				{ headers: { "Content-Type": "application/json" } },
			);

			const { token: newToken, refreshToken: newRefreshToken } =
				response.data as { token: string; refreshToken: string };

			authToken = newToken;
			refreshToken = newRefreshToken;
			await Promise.all([
				saveAuthToken(newToken),
				saveRefreshToken(newRefreshToken),
			]);

			processQueue(null, newToken);

			originalRequest.headers.Authorization = `Bearer ${newToken}`;
			return client.instance(originalRequest);
		} catch (refreshError) {
			processQueue(refreshError, null);

			if (
				refreshError instanceof AxiosError &&
				refreshError.response?.status === 401
			) {
				authToken = null;
				refreshToken = null;
				await clearTokens();
				onUnauthenticated?.();
			}

			return Promise.reject(refreshError);
		} finally {
			isRefreshing = false;
		}
	},
);
