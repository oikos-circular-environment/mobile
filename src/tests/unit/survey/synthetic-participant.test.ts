import { AxiosError } from "axios";
import { setAuthToken, setRefreshToken } from "@/libs/api/oikos-api";
import {
	postV1AuthLogin,
	postV1UsersRegister,
	putV1Profiles,
} from "@/libs/oikos-sdk";
import { provisionSyntheticParticipant } from "@/libs/survey/synthetic-participant";

jest.mock("@/libs/oikos-sdk", () => ({
	postV1AuthLogin: jest.fn(),
	postV1UsersRegister: jest.fn(),
	putV1Profiles: jest.fn(),
}));

jest.mock("@/libs/api/oikos-api", () => ({
	setAuthToken: jest.fn().mockResolvedValue(undefined),
	setRefreshToken: jest.fn().mockResolvedValue(undefined),
}));

function conflictError() {
	return Object.assign(new AxiosError("Conflict"), {
		response: { status: 409, data: { code: "EMAIL_ALREADY_EXISTS" } },
	});
}

describe("provisionSyntheticParticipant", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest
			.mocked(postV1UsersRegister)
			.mockResolvedValue(
				{} as unknown as Awaited<ReturnType<typeof postV1UsersRegister>>,
			);
		jest.mocked(postV1AuthLogin).mockResolvedValue({
			data: { token: "synthetic-token", refreshToken: "synthetic-refresh" },
		} as unknown as Awaited<ReturnType<typeof postV1AuthLogin>>);
		jest
			.mocked(putV1Profiles)
			.mockResolvedValue(
				{} as unknown as Awaited<ReturnType<typeof putV1Profiles>>,
			);
	});

	it("registra, loga e preenche o perfil de um participante sintético", async () => {
		await provisionSyntheticParticipant();

		expect(postV1UsersRegister).toHaveBeenCalledTimes(1);
		const registerBody = jest.mocked(postV1UsersRegister).mock.calls[0][0]
			?.body as { email: string; password: string };
		expect(registerBody.email).toMatch(
			/^oikos-survey-[0-9a-f-]{36}@participant\.invalid$/,
		);
		expect(registerBody.password).toHaveLength(16);

		expect(postV1AuthLogin).toHaveBeenCalledWith({ body: registerBody });

		expect(setAuthToken).toHaveBeenCalledWith("synthetic-token");
		expect(setRefreshToken).toHaveBeenCalledWith("synthetic-refresh");

		expect(putV1Profiles).toHaveBeenCalledTimes(1);
		const profileBody = jest.mocked(putV1Profiles).mock.calls[0][0]?.body as {
			full_name: string;
			display_name: string;
			phone: string;
			address?: unknown;
		};
		expect(profileBody.full_name).toEqual(expect.any(String));
		expect(profileBody.display_name).toEqual(expect.any(String));
		expect(profileBody.phone).toMatch(/^\d+$/);
		expect(profileBody.address).toBeUndefined();
	});

	it("gera novas credenciais e tenta novamente uma vez quando o e-mail já existe (409)", async () => {
		jest
			.mocked(postV1UsersRegister)
			.mockRejectedValueOnce(conflictError())
			.mockResolvedValueOnce(
				{} as unknown as Awaited<ReturnType<typeof postV1UsersRegister>>,
			);

		await provisionSyntheticParticipant();

		expect(postV1UsersRegister).toHaveBeenCalledTimes(2);
		const firstEmail =
			jest.mocked(postV1UsersRegister).mock.calls[0][0]?.body?.email;
		const secondEmail =
			jest.mocked(postV1UsersRegister).mock.calls[1][0]?.body?.email;
		expect(firstEmail).not.toEqual(secondEmail);

		expect(postV1AuthLogin).toHaveBeenCalledWith({
			body: jest.mocked(postV1UsersRegister).mock.calls[1][0]?.body,
		});
	});

	it("propaga o erro sem retry quando não é um conflito de e-mail (409)", async () => {
		const serverError = Object.assign(new AxiosError("Server error"), {
			response: { status: 500, data: {} },
		});
		jest.mocked(postV1UsersRegister).mockRejectedValueOnce(serverError);

		await expect(provisionSyntheticParticipant()).rejects.toBe(serverError);
		expect(postV1UsersRegister).toHaveBeenCalledTimes(1);
		expect(postV1AuthLogin).not.toHaveBeenCalled();
	});

	it("lança erro quando token ou refreshToken não vêm na resposta de login", async () => {
		jest.mocked(postV1AuthLogin).mockResolvedValueOnce({
			data: { token: undefined, refreshToken: undefined },
		} as unknown as Awaited<ReturnType<typeof postV1AuthLogin>>);

		await expect(provisionSyntheticParticipant()).rejects.toThrow(
			"Token não recebido",
		);
		expect(putV1Profiles).not.toHaveBeenCalled();
	});
});
