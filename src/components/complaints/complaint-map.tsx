"use client";

import { useState } from "react";
import { Platform, View } from "react-native";
import MapView, {
	Marker,
	PROVIDER_GOOGLE,
	type Region,
} from "react-native-maps";
import { Heading } from "@/components/ui/heading";
import { MapSkeleton } from "@/components/ui/map-skeleton";
import { Text } from "@/components/ui/text";

type ComplaintMapProps = {
	latitude: number;
	longitude: number;
};

export function ComplaintMap({ latitude, longitude }: ComplaintMapProps) {
	const [isMapReady, setIsMapReady] = useState(false);
	const region: Region = {
		latitude,
		longitude,
		latitudeDelta: 0.005,
		longitudeDelta: 0.005,
	};

	if (Platform.OS === "web") {
		return (
			<View className="gap-2 rounded-lg border border-gray-200 bg-gray-50 p-4">
				<Heading size="sm">Mapa indisponível no navegador</Heading>
				<Text className="text-xs text-gray-500">
					Use o aplicativo no iOS ou Android para visualizar a localização.
				</Text>
			</View>
		);
	}

	return (
		<View className="h-48 overflow-hidden rounded-lg border border-gray-200">
			<MapView
				style={{ flex: 1 }}
				provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
				region={region}
				scrollEnabled={false}
				zoomEnabled={true}
				rotateEnabled={false}
				pitchEnabled={false}
				onMapReady={() => setIsMapReady(true)}
			>
				<Marker
					coordinate={{ latitude, longitude }}
					title="Local da denúncia"
				/>
			</MapView>
			{!isMapReady && <MapSkeleton />}
		</View>
	);
}
