import { fakerPT_BR as faker } from "@faker-js/faker";
import { putV1Profiles } from "@oikos-circular-environment/oikos-sdk";
import { Observe } from "expo-observe";
import { setAuthToken } from "@/libs/api/oikos-api";
import { authClient } from "@/libs/auth/auth-client";
import {
	getCepV2,
	listIbgeMunicipios,
	listIbgeUfs,
} from "@/libs/brasil-api-sdk";

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
		Observe.reportError(error);
		console.warn(
			"[survey] não foi possível resolver o endereço do participante sintético a partir da localização atual",
			error,
		);
		return null;
	}
}

/**
 * Nome genérico em vez de um nome real gerado por faker — um participante
 * sintético mostrado com um nome de pessoa real (ex.: "Larissa") pode soar
 * estranho ou desconfortável pra quem está de fato participando da pesquisa.
 */
function generateSyntheticName(): string {
	const suffix = faker.string.alphanumeric({ length: 6 }).toUpperCase();
	return `USUARIO-${suffix}`;
}

export async function provisionSyntheticParticipant(
	location?: SyntheticLocationInput | null,
): Promise<void> {
	const { error } = await authClient.signIn.anonymous(undefined, {
		onSuccess: ctx => {
			const token = ctx.response.headers.get("set-auth-token");
			if (token) setAuthToken(token);
		},
	});
	if (error) {
		throw new Error(
			"Não foi possível provisionar participante sintético (sign-in anônimo falhou)",
			{ cause: error },
		);
	}

	const address = location ? await resolveSyntheticAddress(location) : null;
	const syntheticName = generateSyntheticName();

	await putV1Profiles({
		body: {
			full_name: syntheticName,
			display_name: syntheticName,
			phone: faker.phone.number({ style: "national" }).replace(/\D/g, ""),
			...(address ? { address } : {}),
		},
	});
}
