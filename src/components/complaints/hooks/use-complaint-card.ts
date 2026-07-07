import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { Alert, Linking, Platform } from "react-native";
import { toast } from "@/components/toast";
import { useComplaintCreation } from "@/contexts/complaint-creation-context";
import { logComplaintEvent } from "@/libs/observe-events";
import { patchV1ComplaintsByIdCanceled } from "@/libs/oikos-sdk";
import type { Complaint, MapComplaint } from "@/libs/types/complaint";
import { useComplaintsStore } from "@/stores/complaints-store";

export function useComplaintCard(complaint: Complaint) {
	const shiftComplaintStatus = useComplaintsStore(s => s.shiftComplaintStatus);
	const setSelectedMapComplaint = useComplaintsStore(
		s => s.setSelectedMapComplaint,
	);
	const { enterEditMode } = useComplaintCreation();

	const cancelMutation = useMutation({
		mutationFn: () =>
			patchV1ComplaintsByIdCanceled({ path: { id: complaint.id } }),
		onSuccess: () => {
			shiftComplaintStatus(complaint.id, "CANCELED");
			logComplaintEvent("complaint.cancelled", { success: true });
			toast.success("Denúncia cancelada", "A denúncia foi cancelada.");
		},
		onError: () => {
			logComplaintEvent("complaint.cancelled", { success: false });
			toast.error("Erro", "Não foi possível cancelar a denúncia.");
		},
	});

	const coords = complaint.geospatial.location.coords;
	const latitude = coords.latitude;
	const longitude = coords.longitude;

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

	const editComplaint = () => {
		enterEditMode(complaint);
		router.push("/(tabs)/complaints/(create)");
	};

	return {
		cancelComplaint: () => cancelMutation.mutate(),
		isCancelingComplaint: cancelMutation.isPending,
		openInMaps,
		openBottomSheet,
		editComplaint,
	};
}
