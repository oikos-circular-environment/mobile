import { useMutation } from "@tanstack/react-query";
import { getCepV2 } from "@/libs/brasil-api-sdk";
import { geocodeAddress } from "@/libs/google/geocode-address";
import { mask } from "@/libs/mask";

export type ResolvedCepAddress = {
	cep: string;
	street: string;
	district: string;
	city: string;
	stateCode: string;
	latitude: string | null;
	longitude: string | null;
};

export function useCepLookup() {
	const { mutateAsync, isPending } = useMutation({
		mutationKey: ["get", "cep", "brasil-api"],
		mutationFn: async (digits: string): Promise<ResolvedCepAddress> => {
			const res = await getCepV2({ path: { cep: digits } });
			if (!res.data) throw new Error("CEP não encontrado");

			const data = res.data;
			const addressLine = `${data.street ?? ""}, ${data.neighborhood ?? ""}, ${data.city}, ${data.state}, ${data.cep}`;
			const coords = await geocodeAddress(addressLine);

			return {
				cep: mask.cep(data.cep),
				street: data.street ?? "",
				district: data.neighborhood ?? "",
				city: data.city,
				stateCode: data.state,
				latitude: coords?.latitude ?? null,
				longitude: coords?.longitude ?? null,
			};
		},
	});

	return { lookupCep: mutateAsync, isLookingUpCep: isPending };
}
