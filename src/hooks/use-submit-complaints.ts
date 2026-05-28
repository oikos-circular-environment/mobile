import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/toast";
import {
	COMPLAINTS_QUERY_KEY,
	DASHBOARD_QUERY_KEY,
} from "@/contexts/complaints-context";
import {
	postV1Complaints,
	postV1ComplaintsByIdCapturesByCaptureIdAttachments,
} from "@/libs/oikos-sdk";
import type { ComplaintCapture } from "@/libs/types/complaint";

export function useSubmitComplaints() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (captures: ComplaintCapture[]) => {
			for (const capture of captures) {
				const res = await postV1Complaints({
					body: {
						date: capture.date,
						type: capture.type,
						observations: capture.observation || null,
						geospatial: {
							heading: {
								trueHeading: capture.geospatial.heading.trueHeading,
								magHeading: capture.geospatial.heading.magHeading,
								accuracy: capture.geospatial.heading.accuracy,
							},
							location: {
								coords: {
									latitude: capture.geospatial.location.coords.latitude,
									longitude: capture.geospatial.location.coords.longitude,
									altitude: capture.geospatial.location.coords.altitude,
									accuracy: capture.geospatial.location.coords.accuracy,
									altitudeAccuracy:
										capture.geospatial.location.coords.altitudeAccuracy,
									heading: capture.geospatial.location.coords.heading,
									speed: capture.geospatial.location.coords.speed,
								},
								timestamp: capture.geospatial.location.timestamp,
								mocked: capture.geospatial.location.mocked,
							},
							addresses: {
								city: capture.geospatial.addresses.city,
								district: capture.geospatial.addresses.district,
								streetNumber: capture.geospatial.addresses.streetNumber,
								street: capture.geospatial.addresses.street,
								region: capture.geospatial.addresses.region,
								subregion: capture.geospatial.addresses.subregion,
								country: capture.geospatial.addresses.country,
								postalCode: capture.geospatial.addresses.postalCode,
								name: capture.geospatial.addresses.name,
								isoCountryCode: capture.geospatial.addresses.isoCountryCode,
								timezone: capture.geospatial.addresses.timezone,
								formattedAddress: capture.geospatial.addresses.formattedAddress,
							},
						},
					},
				});

				const complaintId = res.data?.complaint.id;
				const captureId = res.data?.complaint.captures[0]?.id;

				const uri = capture.capture.object?.uri;
				if (uri && complaintId && captureId) {
					const isPhoto = capture.capture.type === "photo";
					const formData = new FormData();
					formData.append("file", {
						uri,
						name: `complaint_${complaintId}.${isPhoto ? "jpg" : "mp4"}`,
						type: isPhoto ? "image/jpeg" : "video/mp4",
					} as unknown as Blob);
					await postV1ComplaintsByIdCapturesByCaptureIdAttachments({
						path: { id: complaintId, captureId },
						body: formData as any,
					});
				}
			}

			return captures.length;
		},
		onSuccess: async count => {
			await queryClient.invalidateQueries({ queryKey: COMPLAINTS_QUERY_KEY });
			await queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });
			toast.success(
				"Denúncia registrada",
				count > 1
					? `${count} denúncias enviadas com sucesso.`
					: "Sua denúncia foi enviada com sucesso.",
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
