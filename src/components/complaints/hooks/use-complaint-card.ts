import { patchV1ComplaintsByIdCanceled } from "@oikos-circular-environment/oikos-sdk";
import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { Alert } from "react-native";
import { toast } from "@/components/toast";
import { useComplaintCreation } from "@/contexts/complaint-creation-context";
import { logComplaintEvent } from "@/libs/observe-events";
import { openAppleMaps, openGoogleMaps } from "@/libs/open-in-maps";
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

	const openInGoogleMaps = async () => {
		try {
			await openGoogleMaps(coords.latitude, coords.longitude);
		} catch {
			Alert.alert("Maps", "Não foi possível abrir o Google Maps.");
		}
	};

	const openInAppleMaps = async () => {
		try {
			await openAppleMaps(coords.latitude, coords.longitude);
		} catch {
			Alert.alert("Maps", "Não foi possível abrir o Apple Maps.");
		}
	};

	const openComplaintDetail = () => {
		const location = coords
			? { lat: coords.latitude, lon: coords.longitude }
			: null;
		setSelectedMapComplaint({ ...complaint, location } as MapComplaint);
		router.push({
			pathname: "/(tabs)/complaints/[id]",
			params: { id: complaint.id, source: "list" },
		});
	};

	const editComplaint = () => {
		enterEditMode(complaint);
		router.push("/(tabs)/complaints/(create)");
	};

	return {
		cancelComplaint: () => cancelMutation.mutate(),
		isCancelingComplaint: cancelMutation.isPending,
		openInGoogleMaps,
		openInAppleMaps,
		openComplaintDetail,
		editComplaint,
	};
}
