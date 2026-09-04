import {
	patchV1ComplaintsById,
	postV1ComplaintsByIdAttachments,
} from "@oikos-circular-environment/oikos-sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/toast";
import { useComplaintCreation } from "@/contexts/complaint-creation-context";
import { logComplaintEvent } from "@/libs/observe-events";
import type { Geospatial } from "@/libs/types/complaint";
import { useComplaintsStore } from "@/stores/complaints-store";
import type { OnUploadProgress } from "./upload-progress";
import { COMPLAINTS_QUERY_KEY } from "./use-complaints-list";

export type EditComplaintPayload = {
	id: string;
	geospatial: Geospatial;
	observations: string | null;
	newMedia: { id: string; uri: string; mediaType: "photo" | "video" }[];
	waste_category_ids: string[];
	onProgress?: OnUploadProgress;
};

export function useEditComplaint() {
	const queryClient = useQueryClient();
	const updateComplaint = useComplaintsStore(s => s.updateComplaint);
	const { exitEditMode } = useComplaintCreation();

	return useMutation({
		mutationFn: async ({
			id,
			geospatial,
			observations,
			newMedia,
			waste_category_ids,
			onProgress,
		}: EditComplaintPayload) => {
			await patchV1ComplaintsById({
				path: { id },
				body: {
					waste_category_ids,
					observations,
					geospatial: {
						heading: geospatial.heading,
						location: {
							coords: {
								latitude: geospatial.location.coords.latitude,
								longitude: geospatial.location.coords.longitude,
								altitude: geospatial.location.coords.altitude,
								accuracy: geospatial.location.coords.accuracy,
								altitudeAccuracy: geospatial.location.coords.altitudeAccuracy,
								heading: geospatial.location.coords.heading,
								speed: geospatial.location.coords.speed,
							},
							timestamp: geospatial.location.timestamp,
							mocked: geospatial.location.mocked,
						},
						addresses: {
							city: geospatial.addresses.city,
							district: geospatial.addresses.district,
							streetNumber: geospatial.addresses.streetNumber,
							street: geospatial.addresses.street,
							region: geospatial.addresses.region,
							subregion: geospatial.addresses.subregion,
							country: geospatial.addresses.country,
							postalCode: geospatial.addresses.postalCode,
							name: geospatial.addresses.name,
							isoCountryCode: geospatial.addresses.isoCountryCode,
							timezone: geospatial.addresses.timezone,
							formattedAddress: geospatial.addresses.formattedAddress,
						},
					},
				},
			});

			for (let i = 0; i < newMedia.length; i++) {
				const item = newMedia[i];
				onProgress?.({
					phase: "uploading",
					current: i + 1,
					total: newMedia.length,
				});
				const isPhoto = item.mediaType === "photo";
				const formData = new FormData();
				formData.append("file", {
					uri: item.uri,
					name: `complaint_${id}_${item.id}.${isPhoto ? "jpg" : "mp4"}`,
					type: isPhoto ? "image/jpeg" : "video/mp4",
				} as unknown as Blob);
				await postV1ComplaintsByIdAttachments({
					path: { id },
					body: formData as unknown as undefined,
				});
			}
		},
		onSuccess: async (_, { id, geospatial, observations, newMedia }) => {
			updateComplaint(id, { observations, geospatial });
			await queryClient.invalidateQueries({ queryKey: COMPLAINTS_QUERY_KEY });
			exitEditMode();
			logComplaintEvent("complaint.updated", {
				success: true,
				hasPhoto: newMedia.some(item => item.mediaType === "photo"),
				hasVideo: newMedia.some(item => item.mediaType === "video"),
			});
			toast.success("Denúncia atualizada", "As alterações foram salvas.");
		},
		onError: (_, { newMedia }) => {
			logComplaintEvent("complaint.updated", {
				success: false,
				hasPhoto: newMedia.some(item => item.mediaType === "photo"),
				hasVideo: newMedia.some(item => item.mediaType === "video"),
			});
			toast.error("Erro", "Não foi possível atualizar a denúncia.");
		},
	});
}
