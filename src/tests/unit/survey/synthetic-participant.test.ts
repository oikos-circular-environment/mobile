import {
	postV1AuthLogin,
	postV1UsersRegister,
	putV1Profiles,
} from "@oikos-circular-environment/oikos-sdk";
import { AxiosError } from "axios";
import { setAuthToken, setRefreshToken } from "@/libs/api/oikos-api";
import {
	getCepV2,
	listIbgeMunicipios,
	listIbgeUfs,
} from "@/libs/brasil-api-sdk";
import { provisionSyntheticParticipant } from "@/libs/survey/synthetic-participant";

jest.mock("@oikos-circular-environment/oikos-sdk", () => ({
	postV1AuthLogin: jest.fn(),
	postV1UsersRegister: jest.fn(),
	putV1Profiles: jest.fn(),
}));

jest.mock("@/libs/api/oikos-api", () => ({
	setAuthToken: jest.fn().mockResolvedValue(undefined),
	setRefreshToken: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/libs/brasil-api-sdk", () => ({
	getCepV2: jest.fn(),
	listIbgeUfs: jest.fn(),
	listIbgeMunicipios: jest.fn(),
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
		expect(profileBody.full_name).toMatch(/^USUARIO-[A-Z0-9]{6}$/);
		expect(profileBody.display_name).toEqual(profileBody.full_name);
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

	describe("endereço a partir da localização atual", () => {
		const location = {
			latitude: -23.55,
			longitude: -46.63,
			postalCode: "01310-100",
			streetNumber: "1000",
		};

		beforeEach(() => {
			jest.mocked(getCepV2).mockResolvedValue({
				data: {
					cep: "01310100",
					state: "SP",
					city: "São Paulo",
					neighborhood: "Bela Vista",
					street: "Avenida Paulista",
				},
			} as unknown as Awaited<ReturnType<typeof getCepV2>>);
			jest.mocked(listIbgeUfs).mockResolvedValue({
				data: [{ id: 35, sigla: "SP", nome: "São Paulo" }],
			} as unknown as Awaited<ReturnType<typeof listIbgeUfs>>);
			jest.mocked(listIbgeMunicipios).mockResolvedValue({
				data: [{ nome: "São Paulo", codigo_ibge: "3550308" }],
			} as unknown as Awaited<ReturnType<typeof listIbgeMunicipios>>);
		});

		it("resolve e envia o endereço quando a localização tem CEP", async () => {
			await provisionSyntheticParticipant(location);

			expect(getCepV2).toHaveBeenCalledWith({ path: { cep: "01310100" } });
			expect(listIbgeMunicipios).toHaveBeenCalledWith({
				path: { siglaUF: "SP" },
			});

			const profileBody = jest.mocked(putV1Profiles).mock.calls[0][0]?.body as {
				address?: Record<string, unknown>;
			};
			expect(profileBody.address).toEqual({
				zip_code: "01310100",
				street: "Avenida Paulista",
				number: "1000",
				district: "Bela Vista",
				city: "São Paulo",
				city_ibge_id: 3550308,
				state: "São Paulo",
				state_code: "SP",
				state_ibge_id: 35,
				latitude: -23.55,
				longitude: -46.63,
			});
		});

		it("cria a conta sem endereço quando a localização não tem CEP", async () => {
			await provisionSyntheticParticipant({ ...location, postalCode: null });

			expect(getCepV2).not.toHaveBeenCalled();
			const profileBody = jest.mocked(putV1Profiles).mock.calls[0][0]?.body as {
				address?: unknown;
			};
			expect(profileBody.address).toBeUndefined();
		});

		it("cria a conta sem endereço quando a resolução falha (erro de rede)", async () => {
			jest.mocked(getCepV2).mockRejectedValueOnce(new Error("network down"));

			await provisionSyntheticParticipant(location);

			expect(putV1Profiles).toHaveBeenCalledTimes(1);
			const profileBody = jest.mocked(putV1Profiles).mock.calls[0][0]?.body as {
				address?: unknown;
			};
			expect(profileBody.address).toBeUndefined();
		});

		it("cria a conta sem endereço quando UF ou município não são encontrados", async () => {
			jest.mocked(listIbgeUfs).mockResolvedValueOnce({
				data: [],
			} as unknown as Awaited<ReturnType<typeof listIbgeUfs>>);

			await provisionSyntheticParticipant(location);

			const profileBody = jest.mocked(putV1Profiles).mock.calls[0][0]?.body as {
				address?: unknown;
			};
			expect(profileBody.address).toBeUndefined();
		});

		it("cria a conta sem endereço quando o CEP não tem rua ou bairro detalhados", async () => {
			jest.mocked(getCepV2).mockResolvedValueOnce({
				data: {
					cep: "01310100",
					state: "SP",
					city: "São Paulo",
					neighborhood: null,
					street: null,
				},
			} as unknown as Awaited<ReturnType<typeof getCepV2>>);

			await provisionSyntheticParticipant(location);

			expect(putV1Profiles).toHaveBeenCalledTimes(1);
			const profileBody = jest.mocked(putV1Profiles).mock.calls[0][0]?.body as {
				address?: unknown;
			};
			expect(profileBody.address).toBeUndefined();
		});
	});
});
