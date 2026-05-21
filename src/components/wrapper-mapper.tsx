"use client";

import * as Location from "expo-location";
import { LocateFixedIcon } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import MapView, {
	type MapPressEvent,
	Marker,
	PROVIDER_GOOGLE,
	type Region,
} from "react-native-maps";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

type LocationPoint = {
	latitude: number;
	longitude: number;
};

type WrapperMapperProps = {
	latitude?: number | null;
	longitude?: number | null;
	onChange?: (location: LocationPoint) => void;
};

const FALLBACK_COORDINATES: LocationPoint = {
	latitude: -23.55052,
	longitude: -46.633308,
};

export default function WrapperMapper({
	latitude,
	longitude,
	onChange,
}: WrapperMapperProps) {
	const [selectedLocation, setSelectedLocation] =
		useState<LocationPoint | null>(
			latitude != null && longitude != null ? { latitude, longitude } : null,
		);
	const [deviceLocation, setDeviceLocation] = useState<LocationPoint | null>(
		null,
	);
	const [isResolvingLocation, setIsResolvingLocation] = useState(false);
	const [permissionDenied, setPermissionDenied] = useState(false);

	useEffect(() => {
		if (latitude != null && longitude != null) {
			setSelectedLocation({ latitude, longitude });
		}
	}, [latitude, longitude]);

	const handleMapSelection = useCallback(
		(event: MapPressEvent) => {
			const { latitude: lat, longitude: lng } = event.nativeEvent.coordinate;

			const nextLocation = {
				latitude: lat,
				longitude: lng,
			};

			setSelectedLocation(nextLocation);
			onChange?.(nextLocation);
		},
		[onChange],
	);

	const handleUseDeviceLocation = useCallback(async () => {
		try {
			setIsResolvingLocation(true);
			setPermissionDenied(false);

			const permission = await Location.requestForegroundPermissionsAsync();
			if (permission.status !== "granted") {
				setPermissionDenied(true);
				return;
			}

			const currentPosition = await Location.getCurrentPositionAsync({
				accuracy: Location.Accuracy.High,
			});

			const nextLocation = {
				latitude: currentPosition.coords.latitude,
				longitude: currentPosition.coords.longitude,
			};

			setDeviceLocation(nextLocation);
			setSelectedLocation(nextLocation);
			onChange?.(nextLocation);
		} catch {
			setPermissionDenied(true);
		} finally {
			setIsResolvingLocation(false);
		}
	}, [onChange]);

	useEffect(() => {
		if (latitude != null && longitude != null) {
			return;
		}

		void handleUseDeviceLocation();
	}, [handleUseDeviceLocation, latitude, longitude]);

	const activeLocation =
		selectedLocation ?? deviceLocation ?? FALLBACK_COORDINATES;
	const region = useMemo<Region>(
		() => ({
			latitude: activeLocation.latitude,
			longitude: activeLocation.longitude,
			latitudeDelta: 0.005,
			longitudeDelta: 0.005,
		}),
		[activeLocation.latitude, activeLocation.longitude],
	);

	if (Platform.OS === "web") {
		return (
			<View className="gap-3 rounded-lg border border-border p-4">
				<Heading size="sm">Mapa indisponível no navegador</Heading>
				<Text className="text-sm text-muted-foreground">
					Use o aplicativo no iOS ou Android para selecionar o ponto exato da
					empresa.
				</Text>
			</View>
		);
	}

	return (
		<View className="gap-3">
			<View className="h-72 overflow-hidden rounded-lg border border-border">
				{isResolvingLocation && !selectedLocation && !deviceLocation ? (
					<View className="flex-1 items-center justify-center gap-2 bg-muted/30">
						<ActivityIndicator />
						<Text className="text-sm text-muted-foreground">
							Obtendo localização do dispositivo...
						</Text>
					</View>
				) : (
					<MapView
						style={{ flex: 1 }}
						provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
						region={region}
						onPress={handleMapSelection}
						showsUserLocation
						showsMyLocationButton
						showsCompass
						loadingEnabled
					>
						<Marker
							coordinate={{
								latitude: activeLocation.latitude,
								longitude: activeLocation.longitude,
							}}
							title="Local da empresa"
							description="Ponto selecionado"
						/>
					</MapView>
				)}
			</View>

			<View className="gap-2">
				<View className="gap-1">
					<Heading size="sm">Localização exata da empresa</Heading>
					<Text className="text-sm text-muted-foreground">
						Toque no mapa para ajustar o ponto com precisão ou use a localização
						do dispositivo.
					</Text>
				</View>

				<View className="flex-row items-center justify-between gap-2">
					<View className="flex-1 gap-1">
						<Text className="text-sm">
							Latitude: {activeLocation.latitude.toFixed(6)}
						</Text>
						<Text className="text-sm">
							Longitude: {activeLocation.longitude.toFixed(6)}
						</Text>
					</View>

					<Button variant="outline" size="sm" onPress={handleUseDeviceLocation}>
						<ButtonText>Usar minha localização</ButtonText>
						<ButtonIcon as={LocateFixedIcon} />
					</Button>
				</View>

				{permissionDenied ? (
					<Text className="text-xs text-destructive">
						Permissão de localização negada. Você ainda pode definir o ponto
						tocando no mapa.
					</Text>
				) : null}
			</View>
		</View>
	);
}
