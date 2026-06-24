import { useQuery } from "@tanstack/react-query";
import { getV1ComplaintsMap } from "@/libs/oikos-sdk";
import type { ComplaintStatus } from "@/libs/types/complaint";
import { useComplaintsStore } from "@/stores/complaints-store";

export type { MapComplaint } from "@/libs/types/complaint";

type HazardLevel = "ALL" | "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";

type Params = {
	userLocation: { lat: number; lon: number } | null;
	status: "ALL" | "OPEN" | "RESOLVED";
	wasteCategoryId: "ALL" | string;
	hazardLevel: HazardLevel;
	radius: number;
};

export function useComplaintsMap({
	userLocation,
	status,
	wasteCategoryId,
	hazardLevel,
	radius,
}: Params) {
	const selectedMapComplaint = useComplaintsStore(s => s.selectedMapComplaint);
	const setSelectedMapComplaint = useComplaintsStore(
		s => s.setSelectedMapComplaint,
	);

	const { data: mapData, isLoading: isLoadingMap } = useQuery({
		queryKey: [
			"complaints",
			"map",
			userLocation?.lat ?? 0,
			userLocation?.lon ?? 0,
			status,
			wasteCategoryId,
			hazardLevel,
			radius,
		],
		queryFn: async () => {
			const res = await getV1ComplaintsMap({
				query: {
					lat: userLocation?.lat ?? 0,
					lon: userLocation?.lon ?? 0,
					radius,
					status,
					waste_category_id: wasteCategoryId,
					hazard_level: hazardLevel,
				},
			});
			return res.data;
		},
		enabled: !!userLocation,
	});

	const complaints = mapData?.complaints ?? [];

	return {
		complaints,
		isLoadingMap,
		selectedMapComplaint,
		setSelectedMapComplaint,
	};
}

export type { ComplaintStatus };
