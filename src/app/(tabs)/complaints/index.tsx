import { router } from "expo-router";
import {
	ListIcon,
	LocateFixedIcon,
	LocateOffIcon,
	MapIcon,
	MapPinnedIcon,
	MinusIcon,
	Navigation2Icon,
	PlusIcon,
	Trash2Icon,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
	Platform,
	TouchableOpacity,
	useWindowDimensions,
	View,
} from "react-native";
import MapView, { Circle, Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AuthModal } from "@/components/auth/auth-modal";
import { ProfileCompletionModal } from "@/components/auth/profile-completion-modal";
import { useWasteCategories } from "@/components/companies/hooks/use-waste-categories";
import { ComplaintBottomSheet } from "@/components/complaints/complaint-bottom-sheet";
import {
	type BottomSheetRef,
	ComplaintFilterBottomSheet,
	DEFAULT_FILTERS,
	type FilterState,
	RADIUS_OPTIONS,
} from "@/components/complaints/complaint-filter-bottom-sheet";
import { ComplaintFilterRow } from "@/components/complaints/complaint-pressable-filter";
import { ComplaintsListBottomSheet } from "@/components/complaints/complaints-list-bottom-sheet";
import type { MapComplaint } from "@/components/complaints/hooks/use-complaints-map";
import { useComplaintsMap } from "@/components/complaints/hooks/use-complaints-map";
import { LocationPermissionAlert } from "@/components/location-permission-alert";
import { colors } from "@/components/style/colors";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Spinner } from "@/components/ui/spinner";
import { useAuthContext } from "@/contexts/auth-context";
import { useGeospatial } from "@/contexts/geospatial-context";
import { useRouteInteractive } from "@/libs/use-route-interactive";
import { cn } from "@/libs/utils";

const controlShadow = {
	shadowColor: colors.black,
	shadowOffset: { width: 0, height: 2 },
	shadowOpacity: 0.15,
	shadowRadius: 3,
	elevation: 3,
};

const LIST_SHEET_MIN_SNAP_RATIO = 0.15;

export default function ComplaintsMapScreen() {
	useRouteInteractive();
	const insets = useSafeAreaInsets();
	const { height: windowHeight } = useWindowDimensions();
	const { isAuthenticated, needsProfileCompletion } = useAuthContext();
	const { location, permissionDenied } = useGeospatial();
	const mapRef = useRef<MapView>(null);
	const filterSheetRef = useRef<BottomSheetRef>(null);
	const hasAnimatedRef = useRef(false);
	const suppressMapPressRef = useRef(false);
	const [isMapReady, setIsMapReady] = useState(false);

	const userLocation = location
		? { lat: location.coords.latitude, lon: location.coords.longitude }
		: null;

	const { categories } = useWasteCategories();

	const [showAuthModal, setShowAuthModal] = useState(false);
	const [showProfileModal, setShowProfileModal] = useState(false);
	const [mapHeading, setMapHeading] = useState(0);
	const [showUserLocation, setShowUserLocation] = useState(true);

	const [appliedFilters, setAppliedFilters] =
		useState<FilterState>(DEFAULT_FILTERS);
	const [draftFilters, setDraftFilters] =
		useState<FilterState>(DEFAULT_FILTERS);

	const hazardLevelForApi = appliedFilters.hazardLevel.toUpperCase() as
		| "ALL"
		| "LOW"
		| "MEDIUM"
		| "HIGH"
		| "VERY_HIGH";

	const {
		complaints,
		isLoadingMap,
		selectedMapComplaint,
		setSelectedMapComplaint,
	} = useComplaintsMap({
		userLocation,
		status: appliedFilters.status,
		wasteCategoryId: appliedFilters.category?.id ?? "ALL",
		hazardLevel: hazardLevelForApi,
		radius: appliedFilters.radius,
	});

	useEffect(() => {
		if (!isMapReady || !location || hasAnimatedRef.current) return;
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
	}, [isMapReady, location]);

	const handleOpenFilterSheet = () => {
		setDraftFilters(appliedFilters);
		filterSheetRef.current?.open();
	};

	const handleApplyFilters = () => {
		setAppliedFilters(draftFilters);
		filterSheetRef.current?.close();
	};

	const handleClearFilters = () => {
		setAppliedFilters(DEFAULT_FILTERS);
		setDraftFilters(DEFAULT_FILTERS);
		filterSheetRef.current?.close();
	};

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

	const handleComplaintListItemPress = (complaint: MapComplaint) => {
		if (!complaint.location) return;
		mapRef.current?.animateToRegion(
			{
				latitude: complaint.location.lat,
				longitude: complaint.location.lon,
				latitudeDelta: 0.01,
				longitudeDelta: 0.01,
			},
			500,
		);
		setSelectedMapComplaint(complaint);
	};

	const handleZoomIn = async () => {
		if (!isMapReady) return;
		const camera = await mapRef.current?.getCamera();
		if (!camera) return;
		mapRef.current?.animateCamera({
			zoom: (camera.zoom ?? 14) + 1,
			altitude: (camera.altitude ?? 1000) / 2,
		});
	};

	const handleZoomOut = async () => {
		if (!isMapReady) return;
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
		if (!isMapReady) return;
		const camera = await mapRef.current?.getCamera();
		if (camera?.heading !== undefined) {
			setMapHeading(camera.heading);
		}
	};

	return (
		<View className="flex-1">
			<MapView
				ref={mapRef}
				style={{ flex: 1 }}
				provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
				initialRegion={
					location
						? {
								latitude: location.coords.latitude,
								longitude: location.coords.longitude,
								latitudeDelta: 0.04,
								longitudeDelta: 0.04,
							}
						: undefined
				}
				onMapReady={() => setIsMapReady(true)}
				showsUserLocation={showUserLocation}
				showsMyLocationButton={false}
				showsCompass={false}
				onPress={handleClosePanel}
				onRegionChangeComplete={handleRegionChangeComplete}
			>
				{userLocation && (
					<Circle
						key={`${userLocation.lat}-${userLocation.lon}-${appliedFilters.radius}`}
						center={{ latitude: userLocation.lat, longitude: userLocation.lon }}
						radius={appliedFilters.radius}
						strokeColor={colors.lime[500]}
						strokeWidth={2}
						fillColor="rgba(63, 98, 18, 0.1)"
					/>
				)}
				{complaints.map(complaint => {
					if (!complaint.location) return null;

					const pinColor = colors.amber[500];
					const isSelected = selectedMapComplaint?.id === complaint.id;
					const Icon = Trash2Icon;
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

			{/* Filter row */}
			<View
				className="absolute left-0 right-0 gap-2 px-4"
				style={{ top: 32 }}
				pointerEvents="box-none"
			>
				<ComplaintFilterRow
					status={appliedFilters.status}
					categoryName={appliedFilters.category?.name ?? null}
					hazardLevel={appliedFilters.hazardLevel}
					radiusLabel={
						RADIUS_OPTIONS.find(o => o.value === appliedFilters.radius)
							?.label ?? "10 km"
					}
					onPress={handleOpenFilterSheet}
				/>
				{permissionDenied && (
					<LocationPermissionAlert message="Habilite a localização para ver sua posição e denúncias por perto no mapa." />
				)}
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
					onPress={() => setShowUserLocation(v => !v)}
					className={cn(
						"h-11 w-11 items-center justify-center rounded-xl",
						showUserLocation ? "bg-lime-800" : "bg-white",
					)}
					style={controlShadow}
				>
					{showUserLocation ? (
						<MapPinnedIcon size={18} color={colors.white} strokeWidth={2.2} />
					) : (
						<MapIcon size={18} color={colors.gray[700]} strokeWidth={2.2} />
					)}
				</TouchableOpacity>

				<TouchableOpacity
					activeOpacity={0.85}
					onPress={handleResetNorth}
					className="h-11 w-11 items-center justify-center rounded-xl bg-primary"
					style={controlShadow}
				>
					<View style={{ transform: [{ rotate: `${-mapHeading}deg` }] }}>
						<Navigation2Icon size={20} color={colors.white} strokeWidth={2.2} />
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

			{/* FABs */}
			<View
				className="absolute right-4 flex-row gap-2 items-center"
				style={{
					bottom: windowHeight * LIST_SHEET_MIN_SNAP_RATIO + 12,
				}}
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

			<ComplaintsListBottomSheet
				complaints={complaints}
				userLocation={userLocation}
				onSelectComplaint={handleComplaintListItemPress}
			/>

			<ComplaintBottomSheet />

			<ComplaintFilterBottomSheet
				ref={filterSheetRef}
				filters={draftFilters}
				categories={categories}
				onFiltersChange={setDraftFilters}
				onApply={handleApplyFilters}
				onClear={handleClearFilters}
			/>
		</View>
	);
}
