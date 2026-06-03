import type { MapComplaint } from "@/libs/types/complaint";

export type Attachment = MapComplaint["attachments"][number];

export function haversineKm(
	lat1: number,
	lon1: number,
	lat2: number,
	lon2: number,
): number {
	const R = 6371;
	const dLat = ((lat2 - lat1) * Math.PI) / 180;
	const dLon = ((lon2 - lon1) * Math.PI) / 180;
	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos((lat1 * Math.PI) / 180) *
			Math.cos((lat2 * Math.PI) / 180) *
			Math.sin(dLon / 2) ** 2;
	return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistance(km: number): string {
	return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
}

export function getAddress(complaint: MapComplaint): string | null {
	const { addresses } = complaint.geospatial;
	const streetPart = [addresses.street, addresses.streetNumber]
		.filter(Boolean)
		.join(", ");
	return [streetPart, addresses.district].filter(Boolean).join(" — ") || null;
}
