import { useMemo } from "react";
import type { MapComplaint } from "@/libs/types/complaint";
import { useComplaintsStore } from "@/stores/complaints-store";

export function useComplaintForId(id: string): MapComplaint | null {
	const selectedMapComplaint = useComplaintsStore(s => s.selectedMapComplaint);
	const complaintsInList = useComplaintsStore(s => s.complaints);

	return useMemo(() => {
		if (selectedMapComplaint?.id === id) return selectedMapComplaint;
		const found = complaintsInList.find(c => c.id === id);
		if (!found) return null;
		const coords = found.geospatial.location.coords;
		return {
			...found,
			location: { lat: coords.latitude, lon: coords.longitude },
		} as MapComplaint;
	}, [selectedMapComplaint, complaintsInList, id]);
}
