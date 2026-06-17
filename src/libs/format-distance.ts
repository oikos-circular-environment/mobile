export function formatDistance(meters: number) {
	if (meters >= 1000) {
		return `${(meters / 1000).toFixed(1).replace(".", ",")} km`;
	}
	return `${Math.round(meters)} m`;
}
