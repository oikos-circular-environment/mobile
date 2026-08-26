import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import "@/libs/api/oikos-api";
import { setRefreshToken } from "@/libs/api/oikos-api";
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

function fakeUnauthorizedError(url: string): AxiosError {
	return {
		isAxiosError: true,
		name: "AxiosError",
		message: "Unauthorized",
		response: { status: 401, data: {} },
		config: {
			url,
			method: "get",
			headers: {},
		} as InternalAxiosRequestConfig,
	} as AxiosError;
}

describe("oikos-api refresh token — race condition pós-login", () => {
	it("usa o refresh token em memória quando o SecureStore ainda não persistiu a escrita", async () => {
		await setRefreshToken("mem-refresh-token");

		const patchSpy = jest.spyOn(client.instance, "patch").mockResolvedValue({
			data: { token: "new-token", refreshToken: "new-refresh" },
		});

		const rejectedHandler = (
			client.instance.interceptors.response as unknown as {
				handlers: Array<{ rejected: (e: AxiosError) => Promise<unknown> }>;
			}
		).handlers.at(-1)?.rejected;

		await rejectedHandler?.(
			fakeUnauthorizedError("https://api.oikos.app/v1/market"),
		).catch(() => {});

		expect(patchSpy).toHaveBeenCalledWith(
			"/v1/auth/refresh",
			{ refreshToken: "mem-refresh-token" },
			expect.anything(),
		);

		patchSpy.mockRestore();
	});
});
