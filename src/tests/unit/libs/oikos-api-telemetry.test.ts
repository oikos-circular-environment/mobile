import type { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import "@/libs/api/oikos-api";
import { networkTelemetryBus } from "@/libs/network-telemetry-bus";
import { client } from "@/libs/oikos-sdk/client.gen";

jest.mock("@/libs/storage", () => ({
	getAuthToken: jest.fn().mockResolvedValue(null),
	saveAuthToken: jest.fn().mockResolvedValue(undefined),
	removeAuthToken: jest.fn().mockResolvedValue(undefined),
	getRefreshToken: jest.fn().mockResolvedValue(null),
	saveRefreshToken: jest.fn().mockResolvedValue(undefined),
	removeRefreshToken: jest.fn().mockResolvedValue(undefined),
	clearTokens: jest.fn().mockResolvedValue(undefined),
}));

// O SDK gerado (hey-api) embute baseURL + querystring em `config.url` e nunca
// preenche `config.params` sem um `paramsSerializer` — reproduzimos exatamente
// essa forma para garantir que a telemetria não regrida ao formato de URL crua.
function fakeResponse(url: string, status = 200): AxiosResponse {
	return {
		status,
		data: {},
		statusText: "OK",
		headers: {},
		config: {
			url,
			method: "get",
			params: undefined,
		} as InternalAxiosRequestConfig,
	} as AxiosResponse;
}

describe("oikos-api network telemetry", () => {
	it("emite path/query derivados da URL absoluta gerada pelo SDK", () => {
		const events: Array<{ path: string; query?: Record<string, string> }> = [];
		const unsubscribe = networkTelemetryBus.subscribe(event =>
			events.push(event),
		);

		const responseInterceptor = (
			client.instance.interceptors.response as unknown as {
				handlers: Array<{ fulfilled: (r: AxiosResponse) => AxiosResponse }>;
			}
		).handlers.at(-1);

		responseInterceptor?.fulfilled(
			fakeResponse(
				"https://api.oikos.app/v1/market?lat=-23.55&lon=-46.63&radius=2000",
			),
		);

		unsubscribe();

		expect(events).toEqual([
			{
				method: "GET",
				path: "/v1/market",
				status: 200,
				query: { lat: "-23.55", lon: "-46.63", radius: "2000" },
			},
		]);
	});
});
