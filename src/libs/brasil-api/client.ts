import type { AxiosResponse } from "axios";
import z from "zod";
import { brasil_api } from "../api/brasil-api";

const cepParamsSchama = z.object({
	cep: z.string().regex(/^[0-9]{8}$|^[0-9]{5}-[0-9]{3}$/, {
		message: "CEP inválido. Use o formato 00000000 ou 00000-000",
	}),
});

export type GetCepV2BrasilApiParams = z.infer<typeof cepParamsSchama>;

const cepResponseSchema = z.object({
	cep: z.string(),
	state: z.string(),
	city: z.string(),
	neighborhood: z.string(),
	street: z.string(),
	timezoneName: z.string(),
	location: z.object({
		type: z.enum(["Point"]),
		longitude: z.string(),
		latitude: z.string(),
	}),
});

export type CepV2BrasilApi = z.infer<typeof cepResponseSchema>;

/**
 * Busca por CEP com múltiplos providers e geolocalização.
 */
export async function getCepV2BrasilApi({
	cep,
}: GetCepV2BrasilApiParams): Promise<AxiosResponse<CepV2BrasilApi>> {
	const response = await brasil_api.get(`/cep/v2/${cep}`);
	return response;
}

const stateParamsSchema = z.object({
	code: z.string(),
});

export type GetStateV1BrasilApiParams = z.infer<typeof stateParamsSchema>;

const stateResponseSchema = z.object({
	id: z.number(),
	sigla: z.string(),
	nome: z.string(),
	regiao: {
		id: z.number(),
		sigla: z.string(),
		nome: z.string(),
	},
	populacao_estimada: z.number(),
	periodo: z.string(),
});

export type StateV1BrasilApi = z.infer<typeof stateResponseSchema>;
/**
 * Busca as informações de um estado a partir da sigla ou código
 */
export async function getStateV1BrasilApi({
	code,
}: GetStateV1BrasilApiParams): Promise<AxiosResponse<StateV1BrasilApi>> {
	const response = await brasil_api.get(`/ibge/uf/v1/${code}`);
	return response;
}

/**
 * Retorna informações de todos estados do Brasil
 */
export async function getAllStatesV1BrasilApi(): Promise<
	AxiosResponse<StateV1BrasilApi[]>
> {
	const response = await brasil_api.get(`/ibge/uf/v1/`);
	return response;
}

const cityResponse = z.object({
	nome: z.string(),
	codigo_ibge: z.string(),
});

export type CityV1BrasilApi = z.infer<typeof cityResponse>;

/**
 * Retorna os municípios da unidade federativa
 */
export async function getCitiesByStateV1BrasilApi({
	code,
}: GetStateV1BrasilApiParams): Promise<AxiosResponse<CityV1BrasilApi[]>> {
	const response = await brasil_api.get(`/ibge/municipios/v1/${code}`);
	return response;
}
