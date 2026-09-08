import { putV1Profiles } from "@oikos-circular-environment/oikos-sdk";
import { setAuthToken } from "@/libs/api/oikos-api";
import { authClient } from "@/libs/auth/auth-client";
import {
	getCepV2,
	listIbgeMunicipios,
	listIbgeUfs,
} from "@/libs/brasil-api-sdk";
import { provisionSyntheticParticipant } from "@/libs/survey/synthetic-participant";

jest.mock("@oikos-circular-environment/oikos-sdk", () => ({
	putV1Profiles: jest.fn(),
}));

jest.mock("@/libs/auth/auth-client", () => ({
	authClient: { signIn: { anonymous: jest.fn() } },
}));

jest.mock("@/libs/api/oikos-api", () => ({
	setAuthToken: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/libs/brasil-api-sdk", () => ({
	getCepV2: jest.fn(),
	listIbgeUfs: jest.fn(),
	listIbgeMunicipios: jest.fn(),
}));

function mockAnonymousSignIn(token = "synthetic-token") {
	jest
		.mocked(authClient.signIn.anonymous)
		.mockImplementation(async (_body, options) => {
			await options?.onSuccess?.({
				response: { headers: new Headers({ "set-auth-token": token }) },
			} as never);
			return { data: {}, error: null } as never;
		});
}

describe("provisionSyntheticParticipant", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockAnonymousSignIn();
		jest
			.mocked(putV1Profiles)
			.mockResolvedValue(
				{} as unknown as Awaited<ReturnType<typeof putV1Profiles>>,
			);
	});

	it("faz sign-in anônimo e preenche o perfil de um participante sintético", async () => {
		await provisionSyntheticParticipant();

		expect(authClient.signIn.anonymous).toHaveBeenCalledTimes(1);
		expect(setAuthToken).toHaveBeenCalledWith("synthetic-token");

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

	it("propaga o erro e não preenche o perfil quando o sign-in anônimo falha", async () => {
		jest.mocked(authClient.signIn.anonymous).mockResolvedValueOnce({
			data: null,
			error: { code: "COULD_NOT_CREATE_SESSION" },
		} as never);

		await expect(provisionSyntheticParticipant()).rejects.toThrow(
			"sign-in anônimo falhou",
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
