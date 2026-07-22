import { AxiosError } from "axios";
import Constants from "expo-constants";
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

// Request interceptor: inject Bearer token, client-key and app version
client.instance.interceptors.request.use(config => {
	if (authToken) {
		config.headers.set("Authorization", `Bearer ${authToken}`);
	}
	if (clientKey) {
		config.headers.set("X-Client-Key", clientKey);
	}
	if (appVersion) {
		config.headers.set("X-App-Version", appVersion);
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

client.instance.interceptors.response.use(
	response => response,
	async (error: AxiosError) => {
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
