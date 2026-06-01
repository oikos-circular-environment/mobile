import { useMutation } from "@tanstack/react-query";
import { Alert, Linking, Platform } from "react-native";
import { toast } from "@/components/toast";
import {
	patchV1ComplaintsByIdCanceled,
	patchV1ComplaintsByIdResolved,
} from "@/libs/oikos-sdk";
import type { ApiComplaint } from "@/stores/complaints-store";
import { useComplaintsStore } from "@/stores/complaints-store";

export type ResolveComplaintData = {
	description: string;
	resolver: string;
	rating: number;
};

export function useComplaintCard(complaint: ApiComplaint) {
	const shiftComplaintStatus = useComplaintsStore(s => s.shiftComplaintStatus);

	const resolveMutation = useMutation({
		mutationFn: (data: ResolveComplaintData) =>
			patchV1ComplaintsByIdResolved({
				path: { id: complaint.id },
				body: {
					description: data.description,
					resolver: data.resolver,
					rating: data.rating,
				},
			}),
		onSuccess: () => {
			shiftComplaintStatus(complaint.id, "RESOLVED");
			toast.success("Denúncia resolvida", "Marcada como resolvida.");
		},
		onError: () =>
			toast.error("Erro", "Não foi possível marcar como resolvida."),
	});

	const cancelMutation = useMutation({
		mutationFn: () =>
			patchV1ComplaintsByIdCanceled({ path: { id: complaint.id } }),
		onSuccess: () => {
			shiftComplaintStatus(complaint.id, "CANCELED");
			toast.success("Denúncia cancelada", "A denúncia foi cancelada.");
		},
		onError: () => toast.error("Erro", "Não foi possível cancelar a denúncia."),
	});

	const coords = complaint.captures[0]?.geospatial.location.coords;
	const latitude = coords?.latitude ?? 0;
	const longitude = coords?.longitude ?? 0;

	const mapsUrl =
		Platform.OS === "ios"
			? `maps://?ll=${latitude},${longitude}`
			: `geo:${latitude},${longitude}?q=${latitude},${longitude}`;

	const fallbackUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

	const openInMaps = async () => {
		try {
			const canOpen = await Linking.canOpenURL(mapsUrl);
			await Linking.openURL(canOpen ? mapsUrl : fallbackUrl);
		} catch {
			Alert.alert("Maps", "Não foi possível abrir o aplicativo de mapas.");
		}
	};

	return {
		resolveComplaint: (data: ResolveComplaintData) =>
			resolveMutation.mutate(data),
		cancelComplaint: () => cancelMutation.mutate(),
		isResolvingComplaint: resolveMutation.isPending,
		isCancelingComplaint: cancelMutation.isPending,
		openInMaps,
	};
}
