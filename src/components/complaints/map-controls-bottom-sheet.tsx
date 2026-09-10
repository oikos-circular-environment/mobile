import GorhomBottomSheet, {
	BottomSheetBackdrop,
	type BottomSheetBackdropProps,
	BottomSheetView,
} from "@gorhom/bottom-sheet";
import {
	LocateFixedIcon,
	LocateOffIcon,
	MapIcon,
	MapPinnedIcon,
	MinusIcon,
	MoonIcon,
	Navigation2Icon,
	PlusIcon,
	SunIcon,
} from "lucide-react-native";
import type { RefObject } from "react";
import { useCallback, useImperativeHandle, useRef } from "react";
import { TouchableOpacity, View } from "react-native";
import type MapView from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/components/style/colors";
import { Heading } from "@/components/ui/heading";
import { useGeospatial } from "@/contexts/geospatial-context";
import { cn } from "@/libs/utils";

export type MapControlsSheetRef = { open: () => void };

type MapControlsBottomSheetProps = {
	ref?: React.Ref<MapControlsSheetRef>;
	mapRef: RefObject<MapView | null>;
	permissionDenied: boolean;
	showUserLocation: boolean;
	onToggleUserLocation: () => void;
	isDarkMap: boolean;
	onToggleDarkMap: () => void;
	mapHeading: number;
	onResetNorth: () => void;
};

const controlShadow = {
	shadowColor: colors.black,
	shadowOffset: { width: 0, height: 2 },
	shadowOpacity: 0.15,
	shadowRadius: 3,
	elevation: 3,
};

export function MapControlsBottomSheet({
	ref,
	mapRef,
	permissionDenied,
	showUserLocation,
	onToggleUserLocation,
	isDarkMap,
	onToggleDarkMap,
	mapHeading,
	onResetNorth,
}: MapControlsBottomSheetProps) {
	const sheetRef = useRef<GorhomBottomSheet>(null);
	const insets = useSafeAreaInsets();
	const { location } = useGeospatial();

	useImperativeHandle(
		ref,
		() => ({ open: () => sheetRef.current?.snapToIndex(0) }),
		[],
	);

	const backdropComponent = useCallback(
		(props: BottomSheetBackdropProps) => (
			<BottomSheetBackdrop
				{...props}
				appearsOnIndex={0}
				disappearsOnIndex={-1}
			/>
		),
		[],
	);

	const handleZoomIn = async () => {
		const camera = await mapRef.current?.getCamera();
		if (!camera) return;
		mapRef.current?.animateCamera({
			zoom: (camera.zoom ?? 14) + 1,
			altitude: (camera.altitude ?? 1000) / 2,
		});
	};

	const handleZoomOut = async () => {
		const camera = await mapRef.current?.getCamera();
		if (!camera) return;
		mapRef.current?.animateCamera({
			zoom: (camera.zoom ?? 14) - 1,
			altitude: (camera.altitude ?? 1000) * 2,
		});
	};

	const handleGoToLocation = () => {
		if (!location) return;
		mapRef.current?.animateToRegion(
			{
				latitude: location.coords.latitude,
				longitude: location.coords.longitude,
				latitudeDelta: 0.02,
				longitudeDelta: 0.02,
			},
			600,
		);
	};

	return (
		<GorhomBottomSheet
			ref={sheetRef}
			index={-1}
			enableDynamicSizing
			enablePanDownToClose
			backdropComponent={backdropComponent}
			handleIndicatorStyle={{ backgroundColor: "#d1d5db", width: 40 }}
		>
			<BottomSheetView>
				<View
					className="gap-4 pb-8 pt-2"
					style={{
						paddingLeft: 16 + insets.left,
						paddingRight: 16 + insets.right,
					}}
				>
					<Heading size="md" className="text-gray-900">
						Controles do mapa
					</Heading>

					<View className="flex-row flex-wrap justify-center gap-3">
						<TouchableOpacity
							activeOpacity={0.85}
							onPress={handleZoomIn}
							className="h-11 w-11 items-center justify-center rounded-xl bg-white"
							style={controlShadow}
						>
							<PlusIcon size={18} color={colors.gray[700]} strokeWidth={2.2} />
						</TouchableOpacity>

						<TouchableOpacity
							activeOpacity={0.85}
							onPress={handleZoomOut}
							className="h-11 w-11 items-center justify-center rounded-xl bg-white"
							style={controlShadow}
						>
							<MinusIcon size={18} color={colors.gray[700]} strokeWidth={2.2} />
						</TouchableOpacity>

						<TouchableOpacity
							activeOpacity={0.85}
							onPress={onToggleUserLocation}
							className={cn(
								"h-11 w-11 items-center justify-center rounded-xl",
								showUserLocation ? "bg-lime-800" : "bg-white",
							)}
							style={controlShadow}
						>
							{showUserLocation ? (
								<MapPinnedIcon
									size={18}
									color={colors.white}
									strokeWidth={2.2}
								/>
							) : (
								<MapIcon size={18} color={colors.gray[700]} strokeWidth={2.2} />
							)}
						</TouchableOpacity>

						<TouchableOpacity
							activeOpacity={0.85}
							onPress={onToggleDarkMap}
							className="h-11 w-11 items-center justify-center rounded-xl bg-white"
							style={controlShadow}
						>
							{isDarkMap ? (
								<SunIcon
									size={18}
									color={colors.amber[500]}
									strokeWidth={2.2}
								/>
							) : (
								<MoonIcon
									size={18}
									color={colors.gray[700]}
									strokeWidth={2.2}
								/>
							)}
						</TouchableOpacity>

						<TouchableOpacity
							activeOpacity={0.85}
							onPress={onResetNorth}
							className="h-11 w-11 items-center justify-center rounded-xl bg-primary"
							style={controlShadow}
						>
							<View style={{ transform: [{ rotate: `${-mapHeading}deg` }] }}>
								<Navigation2Icon
									size={20}
									color={colors.white}
									strokeWidth={2.2}
								/>
							</View>
						</TouchableOpacity>

						<TouchableOpacity
							activeOpacity={0.85}
							onPress={handleGoToLocation}
							className="h-11 w-11 items-center justify-center rounded-xl bg-white"
							style={controlShadow}
						>
							{permissionDenied ? (
								<LocateOffIcon
									size={18}
									color={colors.red[500]}
									strokeWidth={2.2}
								/>
							) : (
								<LocateFixedIcon
									size={18}
									color={colors.gray[700]}
									strokeWidth={2.2}
								/>
							)}
						</TouchableOpacity>
					</View>
				</View>
			</BottomSheetView>
		</GorhomBottomSheet>
	);
}
