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

export async function getCepV2({
	cep,
}: GetCepV2BrasilApiParams): Promise<CepV2BrasilApi> {
	const response = await brasil_api.get(`/cep/v2/${cep}`);
	return response.data;
}
