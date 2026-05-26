import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import {
	LocateIcon,
	LocateOffIcon,
	ZapIcon,
	ZapOffIcon,
} from "lucide-react-native";
import { useMemo, useState } from "react";
import { TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { useGeospatial } from "@/contexts/geospatial-context";
import {
	formatHeading,
	formatMeters,
	formatSexagesimalCoordinate,
} from "@/libs/geospatial";
import { colors } from "@/components/style/colors";
import { useCameraContext } from "./context";

const textStrokeStyle = {
	textShadowColor: colors.overlay.black92,
	textShadowOffset: { width: 0, height: 1 },
	textShadowRadius: 6,
};

type CameraGeospatialOverlayProps = {
	defaultVisible?: boolean;
	bottomOffset?: number;
};

export function CameraGeospatialOverlay({
	defaultVisible = true,
	bottomOffset = 280,
}: CameraGeospatialOverlayProps) {
	const [isVisible, setIsVisible] = useState(defaultVisible);
	const { addresses, currentDate, location, heading } = useGeospatial();
	const { flash, toggleFlash } = useCameraContext();
	const insets = useSafeAreaInsets();

	const date = useMemo(
		() => format(currentDate, "dd/MM/yyyy", { locale: ptBR }),
		[currentDate],
	);
	const time = useMemo(
		() => format(currentDate, "HH:mm:ss", { locale: ptBR }),
		[currentDate],
	);
	const dayOfWeek = useMemo(
		() => format(currentDate, "EEEE", { locale: ptBR }),
		[currentDate],
	);

	const addressFormatted = useMemo(() => {
		if (addresses.length === 0) return "indisponível";
		const address = addresses[0];
		const parts = [
			address.street,
			address.streetNumber,
			address.district,
			address.city,
			address.region,
			address.postalCode,
		].filter(Boolean);
		return parts.length > 0 ? parts.join(", ") : "indisponível";
	}, [addresses]);

	const headingFormatted = useMemo(
		() => formatHeading(heading?.magHeading, { includeCompass: true }),
		[heading?.magHeading],
	);

	const latitudeFormatted = useMemo(
		() =>
			location?.coords.latitude != null
				? formatSexagesimalCoordinate(location.coords.latitude, "latitude")
				: "indisponível",
		[location?.coords.latitude],
	);

	const longitudeFormatted = useMemo(
		() =>
			location?.coords.longitude != null
				? formatSexagesimalCoordinate(location.coords.longitude, "longitude")
				: "indisponível",
		[location?.coords.longitude],
	);

	const altitudeFormatted = useMemo(
		() => formatMeters(location?.coords.altitude),
		[location?.coords.altitude],
	);

	const LocateToggleIcon = isVisible ? LocateIcon : LocateOffIcon;
	const FlashToggleIcon = flash === "on" ? ZapIcon : ZapOffIcon;

	return (
		<>
			<View className="absolute right-5 gap-2" style={{ top: insets.top + 16 }}>
				<TouchableOpacity
					className="rounded-xl bg-white/90 p-3"
					onPress={toggleFlash}
				>
					<FlashToggleIcon
						size={20}
						color={flash === "on" ? colors.lime[800] : colors.gray[600]}
						strokeWidth={2.2}
					/>
				</TouchableOpacity>

				<TouchableOpacity
					className="rounded-xl bg-white/90 p-3"
					onPress={() => setIsVisible(v => !v)}
				>
					<LocateToggleIcon
						size={20}
						color={isVisible ? colors.lime[800] : colors.gray[600]}
						strokeWidth={2.2}
					/>
				</TouchableOpacity>
			</View>

			{isVisible && (
				<View
					className="absolute left-0 right-0 px-4"
					style={{ bottom: insets.bottom + bottomOffset }}
				>
					<View className="rounded-2xl bg-black/35 p-3">
						<Heading className="text-white text-4xl" style={textStrokeStyle}>
							{date}
						</Heading>
						<View className="flex-row gap-4">
							<Text className="text-white text-xl" style={textStrokeStyle}>
								{time}
							</Text>
							<Text className="text-white text-xl" style={textStrokeStyle}>
								{dayOfWeek}
							</Text>
						</View>
						<View className="mt-1">
							<Text className="text-white text-md" style={textStrokeStyle}>
								{addressFormatted}
							</Text>
							<Text className="text-white text-md" style={textStrokeStyle}>
								{latitudeFormatted}, {longitudeFormatted}
							</Text>
							<Text className="text-white text-md" style={textStrokeStyle}>
								{altitudeFormatted}
							</Text>
							<Text className="text-white text-md" style={textStrokeStyle}>
								{headingFormatted}
							</Text>
						</View>
					</View>
				</View>
			)}
		</>
	);
}
