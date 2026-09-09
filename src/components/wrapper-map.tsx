"use client";

import * as Location from "expo-location";
import { Observe } from "expo-observe";
import {
	LocateFixedIcon,
	LocateOffIcon,
	MapPinIcon,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import MapView, {
	type MapPressEvent,
	Marker,
	PROVIDER_GOOGLE,
	type Region,
} from "react-native-maps";
import { Alert, AlertIcon, AlertText } from "@/components/ui/alert";
import { Badge, BadgeText } from "@/components/ui/badge";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { MapSkeleton } from "@/components/ui/map-skeleton";
import { Text } from "@/components/ui/text";

type LocationPoint = {
	latitude: number;
	longitude: number;
};

type WrapperMapProps = {
	latitude?: number | null;
	longitude?: number | null;
	onChange?: (location: LocationPoint) => void;
};

const FALLBACK_COORDINATES: LocationPoint = {
	latitude: -23.55052,
	longitude: -46.633308,
};

export default function WrapperMap({
	latitude,
	longitude,
	onChange,
}: WrapperMapProps) {
	const [selectedLocation, setSelectedLocation] =
		useState<LocationPoint | null>(
			latitude != null && longitude != null ? { latitude, longitude } : null,
		);
	const [deviceLocation, setDeviceLocation] = useState<LocationPoint | null>(
		null,
	);
	const [isResolvingLocation, setIsResolvingLocation] = useState(false);
	const [permissionDenied, setPermissionDenied] = useState(false);
	const [isMapReady, setIsMapReady] = useState(false);

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
		} catch (error) {
			Observe.reportError(error);
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
		<View className="gap-2">
			<View className="h-96 overflow-hidden rounded-lg border border-border">
				{isResolvingLocation && !selectedLocation && !deviceLocation ? (
					<View className="flex-1 items-center justify-center gap-2 bg-muted/30">
						<ActivityIndicator />
						<Text className="text-sm text-muted-foreground">
							Obtendo localização do dispositivo...
						</Text>
					</View>
				) : (
					<>
						<MapView
							style={{ flex: 1 }}
							provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
							region={region}
							onPress={handleMapSelection}
							onMapReady={() => setIsMapReady(true)}
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
						{!isMapReady && <MapSkeleton />}

						<View className="absolute inset-x-0 bottom-0 flex-row items-center justify-between gap-2 bg-background/95 px-3 py-2">
							<Badge variant="secondary">
								<BadgeText>
									{activeLocation.latitude.toFixed(6)},{" "}
									{activeLocation.longitude.toFixed(6)}
								</BadgeText>
							</Badge>

							<Button
								variant="outline"
								size="sm"
								onPress={handleUseDeviceLocation}
							>
								<ButtonText>Usar minha localização</ButtonText>
								<ButtonIcon as={LocateFixedIcon} />
							</Button>
						</View>
					</>
				)}
			</View>

			<View className="gap-2">
				<Alert className="gap-3 bg-sky-100 border-sky-400">
					<AlertIcon as={MapPinIcon} className="text-sky-400" />
					<AlertText className="text-foreground/80">
						Toque no mapa para ajustar o ponto com precisão ou use a localização
						do dispositivo.
					</AlertText>
				</Alert>

				{permissionDenied && (
					<Alert className="gap-3 bg-red-50 border-red-200">
						<AlertIcon as={LocateOffIcon} className="text-red-500" />
						<AlertText className="text-red-500">
							Permissão de localização negada. Você ainda pode definir o ponto
							tocando no mapa.
						</AlertText>
					</Alert>
				)}
			</View>
		</View>
	);
}
