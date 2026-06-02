import { useMutation } from "@tanstack/react-query";
import { Alert, Linking, Platform } from "react-native";
import { toast } from "@/components/toast";
import { patchV1ComplaintsByIdCanceled } from "@/libs/oikos-sdk";
import type { MapComplaint } from "@/libs/types/complaint";
import type { ApiComplaint } from "@/stores/complaints-store";
import { useComplaintsStore } from "@/stores/complaints-store";

export function useComplaintCard(complaint: ApiComplaint) {
	const shiftComplaintStatus = useComplaintsStore(s => s.shiftComplaintStatus);
	const setSelectedMapComplaint = useComplaintsStore(
		s => s.setSelectedMapComplaint,
	);

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

	const openBottomSheet = () => {
		const location = coords
			? { lat: coords.latitude, lon: coords.longitude }
			: null;
		setSelectedMapComplaint({ ...complaint, location } as MapComplaint);
	};

	return {
		cancelComplaint: () => cancelMutation.mutate(),
		isCancelingComplaint: cancelMutation.isPending,
		openInMaps,
		openBottomSheet,
	};
}
