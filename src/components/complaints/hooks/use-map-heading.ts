import type { RefObject } from "react";
import { useState } from "react";
import type MapView from "react-native-maps";

export function useMapHeading(mapRef: RefObject<MapView | null>) {
	const [mapHeading, setMapHeading] = useState(0);

	const handleResetNorth = () => {
		mapRef.current?.animateCamera({ heading: 0 }, { duration: 300 });
		setMapHeading(0);
	};

	const handleRegionChangeComplete = async () => {
		const camera = await mapRef.current?.getCamera();
		if (camera?.heading !== undefined) {
			setMapHeading(camera.heading);
		}
	};

	return { mapHeading, handleResetNorth, handleRegionChangeComplete };
}
