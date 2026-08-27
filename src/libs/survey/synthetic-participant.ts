import { fakerPT_BR as faker } from "@faker-js/faker";
import { AxiosError } from "axios";
import { Asset } from "expo-asset";
import { setAuthToken, setRefreshToken } from "@/libs/api/oikos-api";
import {
	getCepV2,
	listIbgeMunicipios,
	listIbgeUfs,
} from "@/libs/brasil-api-sdk";
import {
	postV1AuthLogin,
	postV1UsersRegister,
	putV1Profiles,
	putV1ProfilesAvatar,
} from "@/libs/oikos-sdk";

async function uploadSyntheticAvatar(): Promise<void> {
	try {
		const icon = Asset.fromModule(require("@/assets/icons/icon.png"));
		await icon.downloadAsync();
		if (!icon.localUri) return;

		const formData = new FormData();
		formData.append("file", {
			uri: icon.localUri,
			name: "icon.png",
			type: "image/png",
		} as unknown as Blob);

		await putV1ProfilesAvatar({ body: formData as unknown as undefined });
	} catch (error) {
		console.warn(
			"[survey] não foi possível definir o avatar do participante sintético",
			error,
		);
	}
}

type SyntheticCredentials = { email: string; password: string };

export type SyntheticLocationInput = {
	latitude: number;
	longitude: number;
	postalCode: string | null;
	streetNumber: string | null;
};

async function resolveSyntheticAddress(location: SyntheticLocationInput) {
	if (!location.postalCode) return null;

	try {
		const cepDigits = location.postalCode.replace(/\D/g, "");
		const cepResponse = await getCepV2({ path: { cep: cepDigits } });
		const cepData = cepResponse.data;
		if (!cepData) return null;

		const [ufsResponse, municipiosResponse] = await Promise.all([
			listIbgeUfs(),
			listIbgeMunicipios({ path: { siglaUF: cepData.state } }),
		]);

		const uf = ufsResponse.data?.find(u => u.sigla === cepData.state);
		const municipio = municipiosResponse.data?.find(
			m =>
				m.nome.localeCompare(cepData.city, undefined, {
					sensitivity: "base",
				}) === 0,
		);
		if (!uf || !municipio || !cepData.street || !cepData.neighborhood) {
			return null;
		}

		return {
			zip_code: cepDigits,
			street: cepData.street,
			number: location.streetNumber ?? "S/N",
			district: cepData.neighborhood,
			city: cepData.city,
			city_ibge_id: Number(municipio.codigo_ibge),
			state: uf.nome,
			state_code: cepData.state,
			state_ibge_id: uf.id,
			latitude: location.latitude,
			longitude: location.longitude,
		};
	} catch (error) {
		console.warn(
			"[survey] não foi possível resolver o endereço do participante sintético a partir da localização atual",
			error,
		);
		return null;
	}
}

function generateCredentials(): SyntheticCredentials {
	return {
		email: `oikos-survey-${faker.string.uuid()}@participant.invalid`,
		password: faker.internet.password({ length: 16 }),
	};
}

/**
 * Nome genérico em vez de um nome real gerado por faker — um participante
 * sintético mostrado com um nome de pessoa real (ex.: "Larissa") pode soar
 * estranho ou desconfortável pra quem está de fato participando da pesquisa.
 */
function generateSyntheticName(): string {
	const suffix = faker.string.alphanumeric({ length: 6 }).toUpperCase();
	return `usuario-${suffix}`;
}

async function registerParticipant(): Promise<SyntheticCredentials> {
	const credentials = generateCredentials();

	try {
		await postV1UsersRegister({ body: credentials });
		return credentials;
	} catch (error) {
		if (!(error instanceof AxiosError) || error.response?.status !== 409) {
			throw error;
		}
	}

	const retryCredentials = generateCredentials();
	await postV1UsersRegister({ body: retryCredentials });
	return retryCredentials;
}

export async function provisionSyntheticParticipant(
	location?: SyntheticLocationInput | null,
): Promise<void> {
	const credentials = await registerParticipant();

	const authResponse = await postV1AuthLogin({ body: credentials });
	const { token, refreshToken } = authResponse.data ?? {};
	if (!token || !refreshToken) {
		throw new Error("Token não recebido ao provisionar participante sintético");
	}

	await Promise.all([setAuthToken(token), setRefreshToken(refreshToken)]);

	const address = location ? await resolveSyntheticAddress(location) : null;
	const syntheticName = generateSyntheticName();

	await Promise.all([
		putV1Profiles({
			body: {
				full_name: syntheticName,
				display_name: syntheticName,
				phone: faker.phone.number({ style: "national" }).replace(/\D/g, ""),
				...(address ? { address } : {}),
			},
		}),
		uploadSyntheticAvatar(),
	]);
}
