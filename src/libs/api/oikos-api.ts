import { Platform } from "react-native";
import { client } from "../client/client.gen";

const baseURL = Platform.select({
	ios: "http://192.168.18.44:3333",
	android: "http://10.0.2.2:3333",
});

client.setConfig({ baseURL });

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
	authToken = token;
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
