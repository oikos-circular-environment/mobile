import { Platform } from "react-native";
import { client } from "../client/client.gen";
import { getAuthToken as getStoredToken, saveAuthToken, removeAuthToken } from "../storage";

const baseURL = Platform.select({
	ios: "http://192.168.18.44:3333",
	android: "http://10.0.2.2:3333",
});

client.setConfig({ baseURL, throwOnError: true });

let authToken: string | null = null;

// Initialize token from storage
getStoredToken().then(token => {
	if (token) {
		authToken = token;
	}
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

client.instance.interceptors.request.use(config => {
	if (authToken) {
		config.headers.set("Authorization", `Bearer ${authToken}`);
	}
	return config;
});
