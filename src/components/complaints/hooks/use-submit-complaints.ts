import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/toast";
import { compressMedia } from "@/libs/media-compression";
import {
	postV1Complaints,
	postV1ComplaintsByIdAttachments,
} from "@/libs/oikos-sdk";
import type { Geospatial } from "@/libs/types/complaint";
import {
	COMPLAINTS_QUERY_KEY,
	DASHBOARD_QUERY_KEY,
} from "./use-complaints-list";

export type MediaItem = {
	id: string;
	uri: string;
	mediaType: "photo" | "video";
};

export type SubmitComplaintPayload = {
	geospatial: Geospatial;
	observations: string | null;
	media: MediaItem[];
	waste_category_ids: string[];
};

export function useSubmitComplaints() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			geospatial,
			observations,
			media,
			waste_category_ids,
		}: SubmitComplaintPayload) => {
			const res = await postV1Complaints({
				body: {
					date: new Date().toISOString(),
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

			const complaintId = res.data?.complaint.id;
			if (!complaintId) return;

			for (const item of media) {
				if (!item.uri) continue;
				const isPhoto = item.mediaType === "photo";
				const compressedUri = await compressMedia(item.uri, item.mediaType);
				const formData = new FormData();
				formData.append("file", {
					uri: compressedUri,
					name: `complaint_${complaintId}_${item.id}.${isPhoto ? "jpg" : "mp4"}`,
					type: isPhoto ? "image/jpeg" : "video/mp4",
				} as unknown as Blob);
				await postV1ComplaintsByIdAttachments({
					path: { id: complaintId },
					body: formData as unknown as undefined,
				});
			}
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: COMPLAINTS_QUERY_KEY });
			await queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });
			toast.success(
				"Denúncia registrada",
				"Sua denúncia foi enviada com sucesso.",
			);
		},
		onError: () => {
			toast.error(
				"Erro ao enviar",
				"Não foi possível registrar a denúncia. Tente novamente.",
			);
		},
	});
}
