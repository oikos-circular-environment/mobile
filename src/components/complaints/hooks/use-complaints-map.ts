import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { roundCoord } from "@/libs/geospatial";
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

	const lat = userLocation ? roundCoord(userLocation.lat) : 0;
	const lon = userLocation ? roundCoord(userLocation.lon) : 0;

	const { data: mapData, isLoading: isLoadingMap } = useQuery({
		queryKey: [
			"complaints",
			"map",
			lat,
			lon,
			status,
			wasteCategoryId,
			hazardLevel,
			radius,
		],
		queryFn: async () => {
			const res = await getV1ComplaintsMap({
				query: {
					lat,
					lon,
					radius,
					status,
					waste_category_id: wasteCategoryId,
					hazard_level: hazardLevel,
				},
			});
			return res.data;
		},
		enabled: !!userLocation,
		placeholderData: keepPreviousData,
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
