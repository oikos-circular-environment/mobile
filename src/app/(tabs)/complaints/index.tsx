import { router } from "expo-router";
import {
	ListIcon,
	LocateFixedIcon,
	MinusIcon,
	PlusIcon,
	RadarIcon,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
	Image,
	Platform,
	ScrollView,
	TouchableOpacity,
	View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AuthModal } from "@/components/auth/auth-modal";
import { ProfileCompletionModal } from "@/components/auth/profile-completion-modal";
import { ComplaintStatusChip } from "@/components/complaints/complaint-chip/complaint-status-chip";
import { ComplaintTypeChip } from "@/components/complaints/complaint-chip/complaint-type-chip";
import { COMPLAINT_TYPE_COLORS } from "@/components/complaints/complaint-chip/tokens";
import type { MapComplaint } from "@/components/complaints/hooks/use-complaints-map";
import { useComplaintsMap } from "@/components/complaints/hooks/use-complaints-map";
import { colors } from "@/components/style/colors";
import {
	BottomSheet,
	BottomSheetBackdrop,
	BottomSheetDragIndicator,
	BottomSheetPortal,
	type BottomSheetRef,
	BottomSheetScrollView,
} from "@/components/ui/bottomsheet";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { useAuthContext } from "@/contexts/auth-context";
import { useGeospatial } from "@/contexts/geospatial-context";
import {
	type ComplaintStatus,
	type ComplaintType,
	complaintStatuses,
	complaintTypeValues,
} from "@/libs/types/complaint";

const RADIUS_OPTIONS = [
	{ label: "2 km", value: 2000 },
	{ label: "5 km", value: 5000 },
	{ label: "10 km", value: 10000 },
	{ label: "15 km", value: 15000 },
	{ label: "20 km", value: 20000 },
	{ label: "30 km", value: 30000 },
	{ label: "40 km", value: 40000 },
];

const controlShadow = {
	shadowColor: colors.black,
	shadowOffset: { width: 0, height: 2 },
	shadowOpacity: 0.15,
	shadowRadius: 3,
	elevation: 3,
};

export default function ComplaintsMapScreen() {
	const insets = useSafeAreaInsets();
	const { isAuthenticated, needsProfileCompletion } = useAuthContext();
	const { location } = useGeospatial();
	const mapRef = useRef<MapView>(null);
	const radarSheetRef = useRef<BottomSheetRef>(null);
	const hasAnimatedRef = useRef(false);
	const suppressMapPressRef = useRef(false);

	const userLocation = location
		? { lat: location.coords.latitude, lon: location.coords.longitude }
		: null;

	const [showAuthModal, setShowAuthModal] = useState(false);
	const [showProfileModal, setShowProfileModal] = useState(false);
	const [mapHeading, setMapHeading] = useState(0);
	const [activeRadius, setActiveRadius] = useState(10000);
	const [activeTypeFilter, setActiveTypeFilter] =
		useState<ComplaintType | null>("IRREGULAR_DISPOSAL");
	const [activeStatusFilter, setActiveStatusFilter] =
		useState<ComplaintStatus | null>("OPEN");

	const {
		complaints,
		isLoadingMap,
		selectedMapComplaint,
		setSelectedMapComplaint,
	} = useComplaintsMap({
		userLocation,
		activeTypeFilter,
		activeStatusFilter,
		radius: activeRadius,
	});

	useEffect(() => {
		if (!location || hasAnimatedRef.current) return;
		hasAnimatedRef.current = true;
		mapRef.current?.animateToRegion(
			{
				latitude: location.coords.latitude,
				longitude: location.coords.longitude,
				latitudeDelta: 0.04,
				longitudeDelta: 0.04,
			},
			600,
		);
	}, [location]);

	const handleMarkerPress = (complaint: MapComplaint) => {
		suppressMapPressRef.current = true;
		setSelectedMapComplaint(
			selectedMapComplaint?.id === complaint.id ? null : complaint,
		);
		setTimeout(() => {
			suppressMapPressRef.current = false;
		}, 100);
	};

	const handleClosePanel = () => {
		if (suppressMapPressRef.current) return;
		setSelectedMapComplaint(null);
	};

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

	const handleRadiusSelect = (value: number) => {
		setActiveRadius(value);
		radarSheetRef.current?.close();
	};

	const activeRadiusLabel =
		RADIUS_OPTIONS.find(o => o.value === activeRadius)?.label ?? "10 km";

	return (
		<View className="flex-1">
			<MapView
				ref={mapRef}
				style={{ flex: 1 }}
				provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
				showsUserLocation
				showsMyLocationButton={false}
				showsCompass={false}
				onPress={handleClosePanel}
				onRegionChangeComplete={handleRegionChangeComplete}
			>
				{complaints.map(complaint => {
					if (!complaint.location) return null;
					const typeInfo = complaintTypeValues.find(
						t => t.value === complaint.type,
					);
					const pinColor =
						COMPLAINT_TYPE_COLORS[complaint.type as ComplaintType] ??
						colors.gray[500];
					const isSelected = selectedMapComplaint?.id === complaint.id;
					const Icon = typeInfo?.icon;
					return (
						<Marker
							key={complaint.id}
							coordinate={{
								latitude: complaint.location.lat,
								longitude: complaint.location.lon,
							}}
							onPress={() => handleMarkerPress(complaint)}
							tracksViewChanges={false}
						>
							<View
								className="w-12 h-12 rounded-full items-center justify-center border-white"
								style={{
									backgroundColor: pinColor,
									borderWidth: isSelected ? 2 : 1,
									shadowColor: colors.black,
									shadowOffset: { width: 0, height: 2 },
									shadowOpacity: 0.35,
									shadowRadius: 3,
								}}
							>
								{Icon && (
									<Icon
										size={isSelected ? 18 : 15}
										color={colors.white}
										strokeWidth={2.5}
									/>
								)}
							</View>
						</Marker>
					);
				})}
			</MapView>

			{/* Filters */}
			<View
				className="absolute left-0 right-0 gap-2 pl-4"
				style={{ top: 32 }}
				pointerEvents="box-none"
			>
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerClassName="gap-2"
					pointerEvents="auto"
				>
					{complaintTypeValues.map(({ value }) => (
						<ComplaintTypeChip.Pressable
							key={value}
							type={value}
							size="lg"
							active={activeTypeFilter === value}
							onPress={() => setActiveTypeFilter(value)}
						/>
					))}
				</ScrollView>
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerClassName="gap-2"
					pointerEvents="auto"
				>
					{complaintStatuses.map(({ value }) => {
						const isActive = activeStatusFilter === value;
						return (
							<ComplaintStatusChip.Pressable
								key={value}
								status={value}
								size="lg"
								active={isActive}
								onPress={() => setActiveStatusFilter(isActive ? null : value)}
							/>
						);
					})}
				</ScrollView>
			</View>

			{/* Loading indicator */}
			{isLoadingMap && (
				<View
					className="absolute self-center items-center justify-center"
					style={{ top: insets.top + 100 }}
					pointerEvents="none"
				>
					<Card>
						<HStack className="gap-2">
							<Heading>Carregando denúncias</Heading>
							<Spinner size="small" />
						</HStack>
					</Card>
				</View>
			)}

			{/* Map controls — right side, vertically centered */}
			<View
				className="absolute right-4 gap-2 justify-center"
				style={{
					top: 0,
					bottom: 0,
				}}
				pointerEvents="box-none"
			>
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
					onPress={handleResetNorth}
					className="h-11 w-11 items-center justify-center rounded-xl bg-primary"
					style={controlShadow}
				>
					<Image
						source={require("@/assets/images/compass.png")}
						style={{
							width: 28,
							height: 28,
							transform: [{ rotate: `${-mapHeading}deg` }],
						}}
					/>
				</TouchableOpacity>

				<TouchableOpacity
					activeOpacity={0.85}
					onPress={handleGoToLocation}
					className="h-11 w-11 items-center justify-center rounded-xl bg-white"
					style={controlShadow}
				>
					<LocateFixedIcon
						size={18}
						color={colors.gray[700]}
						strokeWidth={2.2}
					/>
				</TouchableOpacity>

				<TouchableOpacity
					activeOpacity={0.85}
					onPress={() => radarSheetRef.current?.open()}
					className="h-[52px] w-11 items-center justify-center rounded-xl bg-white gap-0.5"
					style={controlShadow}
				>
					<RadarIcon size={16} color={colors.gray[700]} strokeWidth={2.2} />
					<Text className="text-[9px] font-semibold text-gray-700 leading-none">
						{activeRadiusLabel.replace(" ", "").toUpperCase()}
					</Text>
				</TouchableOpacity>
			</View>

			{/* FABs */}
			<View
				className="absolute bottom-4 right-4 flex-row gap-2 items-center"
				style={{ bottom: insets.bottom }}
				pointerEvents="box-none"
			>
				<TouchableOpacity
					activeOpacity={0.9}
					onPress={() => {
						if (!isAuthenticated) {
							setShowAuthModal(true);
							return;
						}
						if (needsProfileCompletion) {
							setShowProfileModal(true);
							return;
						}
						router.push("/(tabs)/complaints/list");
					}}
					className="h-[50px] w-[50px] items-center justify-center rounded-xl bg-white"
					style={{
						shadowColor: colors.black,
						shadowOffset: { width: 0, height: 2 },
						shadowOpacity: 0.18,
						shadowRadius: 4,
						elevation: 4,
					}}
				>
					<ListIcon size={20} color={colors.gray[700]} strokeWidth={2} />
				</TouchableOpacity>

				<TouchableOpacity
					activeOpacity={0.9}
					onPress={() => {
						if (!isAuthenticated) {
							setShowAuthModal(true);
							return;
						}
						if (needsProfileCompletion) {
							setShowProfileModal(true);
							return;
						}
						router.push("/(tabs)/complaints/(create)");
					}}
					className="h-[50px] w-[50px] items-center justify-center rounded-[14px] bg-lime-800"
					style={{
						shadowColor: colors.black,
						shadowOffset: { width: 0, height: 2 },
						shadowOpacity: 0.25,
						shadowRadius: 4,
						elevation: 4,
					}}
				>
					<PlusIcon size={24} color={colors.white} strokeWidth={2.2} />
				</TouchableOpacity>
			</View>

			<AuthModal
				isOpen={showAuthModal}
				onClose={() => setShowAuthModal(false)}
			/>
			<ProfileCompletionModal
				isOpen={showProfileModal}
				onClose={() => setShowProfileModal(false)}
				description="Para visualizar e registrar denúncias você precisa finalizar o seu cadastro."
			/>

			{/* Radar bottom sheet */}
			<BottomSheet ref={radarSheetRef}>
				<BottomSheetPortal
					snapPoints={["42%"]}
					backdropComponent={BottomSheetBackdrop}
					handleComponent={BottomSheetDragIndicator}
				>
					<BottomSheetScrollView
						contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
					>
						<Heading size="md" className="mb-4 text-gray-900">
							Raio de busca
						</Heading>
						{RADIUS_OPTIONS.map(({ label, value }) => {
							const isActive = activeRadius === value;
							return (
								<TouchableOpacity
									key={value}
									activeOpacity={0.85}
									onPress={() => handleRadiusSelect(value)}
									className={`mb-2 h-12 flex-row items-center justify-between rounded-xl px-4 ${
										isActive
											? "bg-lime-800"
											: "bg-gray-50 border border-gray-100"
									}`}
								>
									<Text
										className={`font-semibold ${isActive ? "text-white" : "text-gray-800"}`}
									>
										{label}
									</Text>
									{isActive && (
										<View className="h-2 w-2 rounded-full bg-white" />
									)}
								</TouchableOpacity>
							);
						})}
					</BottomSheetScrollView>
				</BottomSheetPortal>
			</BottomSheet>
		</View>
	);
}
