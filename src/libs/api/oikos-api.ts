import { Platform } from "react-native";
import type { CreateClientConfig } from "../client/client.gen";

const baseURL = Platform.select({
	ios: "http://localhost:3333",
	android: "http://10.0.2.2:333",
});

export const createClientConfig: CreateClientConfig = config => ({
	...config,
	baseURL: baseURL,
});
