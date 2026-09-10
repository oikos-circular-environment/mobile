import { type ErrorBoundaryProps, router } from "expo-router";
import { ListIcon, PlusIcon, SlidersHorizontalIcon } from "lucide-react-native";
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
import { ComplaintMarkerPin } from "@/components/complaints/complaint-marker-pin";
import { ComplaintsListBottomSheet } from "@/components/complaints/complaints-list-bottom-sheet";
import {
	type BottomSheetRef,
	ComplaintFilterBottomSheet,
	ComplaintFilterRow,
	DEFAULT_FILTERS,
	type FilterState,
	RADIUS_OPTIONS,
} from "@/components/complaints/filters";
import type { MapComplaint } from "@/components/complaints/hooks/use-complaints-map";
import { useComplaintsMap } from "@/components/complaints/hooks/use-complaints-map";
import { useMapHeading } from "@/components/complaints/hooks/use-map-heading";
import {
	MapControlsBottomSheet,
	type MapControlsSheetRef,
} from "@/components/complaints/map-controls-bottom-sheet";
import { ErrorFallback } from "@/components/error-fallback";
import { LocationPermissionAlert } from "@/components/location-permission-alert";
import { colors } from "@/components/style/colors";
import { TestingWarningAlert } from "@/components/testing-warning-alert";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { MapSkeleton } from "@/components/ui/map-skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useAuthContext } from "@/contexts/auth-context";
import { useGeospatial } from "@/contexts/geospatial-context";
import { useRecordScreenError } from "@/libs/moderation/use-record-screen-error";
import { useRouteInteractive } from "@/libs/use-route-interactive";

const fabShadow = {
	shadowColor: colors.black,
	shadowOffset: { width: 0, height: 2 },
	shadowOpacity: 0.18,
	shadowRadius: 4,
	elevation: 4,
};

const NIGHT_MAP_STYLE = [
	{ elementType: "geometry", stylers: [{ color: "#212121" }] },
	{ elementType: "labels.icon", stylers: [{ visibility: "off" }] },
	{ elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
	{ elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
	{
		featureType: "administrative",
		elementType: "geometry",
		stylers: [{ color: "#757575" }],
	},
	{
		featureType: "administrative.country",
		elementType: "labels.text.fill",
		stylers: [{ color: "#9e9e9e" }],
	},
	{
		featureType: "administrative.land_parcel",
		stylers: [{ visibility: "off" }],
	},
	{
		featureType: "administrative.locality",
		elementType: "labels.text.fill",
		stylers: [{ color: "#bdbdbd" }],
	},
	{
		featureType: "poi",
		elementType: "labels.text.fill",
		stylers: [{ color: "#757575" }],
	},
	{
		featureType: "poi.park",
		elementType: "geometry",
		stylers: [{ color: "#181818" }],
	},
	{
		featureType: "poi.park",
		elementType: "labels.text.fill",
		stylers: [{ color: "#616161" }],
	},
	{
		featureType: "poi.park",
		elementType: "labels.text.stroke",
		stylers: [{ color: "#1b1b1b" }],
	},
	{
		featureType: "road",
		elementType: "geometry.fill",
		stylers: [{ color: "#2c2c2c" }],
	},
	{
		featureType: "road",
		elementType: "labels.text.fill",
		stylers: [{ color: "#8a8a8a" }],
	},
	{
		featureType: "road.arterial",
		elementType: "geometry",
		stylers: [{ color: "#373737" }],
	},
	{
		featureType: "road.highway",
		elementType: "geometry",
		stylers: [{ color: "#3c3c3c" }],
	},
	{
		featureType: "road.highway.controlled_access",
		elementType: "geometry",
		stylers: [{ color: "#4e4e4e" }],
	},
	{
		featureType: "road.local",
		elementType: "labels.text.fill",
		stylers: [{ color: "#616161" }],
	},
	{
		featureType: "transit",
		elementType: "labels.text.fill",
		stylers: [{ color: "#757575" }],
	},
	{
		featureType: "water",
		elementType: "geometry",
		stylers: [{ color: "#000000" }],
	},
	{
		featureType: "water",
		elementType: "labels.text.fill",
		stylers: [{ color: "#3d3d3d" }],
	},
];

const LIST_SHEET_MIN_SNAP_RATIO = 0.15;
const FAB_SIZE = 50;
const FAB_GROUP_GAP = 12;

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
	useRecordScreenError(error);

	return (
		<ErrorFallback
			title="Não foi possível carregar o mapa"
			message="Tente novamente. Se o problema continuar, verifique sua conexão."
			onRetry={retry}
		/>
	);
}

export default function ComplaintsMapScreen() {
	useRouteInteractive();
	const insets = useSafeAreaInsets();
	const { height: windowHeight } = useWindowDimensions();
	const { isAuthenticated, needsProfileCompletion } = useAuthContext();
	const { location, permissionDenied } = useGeospatial();
	const mapRef = useRef<MapView>(null);
	const filterSheetRef = useRef<BottomSheetRef>(null);
	const mapControlsSheetRef = useRef<MapControlsSheetRef>(null);
	const hasAnimatedRef = useRef(false);
	const suppressMapPressRef = useRef(false);
	const [isMapReady, setIsMapReady] = useState(false);
	const { mapHeading, handleResetNorth, handleRegionChangeComplete } =
		useMapHeading(mapRef, isMapReady);

	const userLocation = location
		? { lat: location.coords.latitude, lon: location.coords.longitude }
		: null;

	const { categories } = useWasteCategories();

	const [showAuthModal, setShowAuthModal] = useState(false);
	const [showProfileModal, setShowProfileModal] = useState(false);
	const [showUserLocation, setShowUserLocation] = useState(true);
	const [isDarkMap, setIsDarkMap] = useState(false);

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

	const handleOpenMapControlsSheet = () => {
		mapControlsSheetRef.current?.open();
	};

	return (
		<View className="flex-1">
			<MapView
				ref={mapRef}
				style={{ flex: 1 }}
				provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
				userInterfaceStyle={isDarkMap ? "dark" : "light"}
				customMapStyle={isDarkMap ? NIGHT_MAP_STYLE : []}
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
					return (
						<Marker
							key={complaint.id}
							coordinate={{
								latitude: complaint.location.lat,
								longitude: complaint.location.lon,
							}}
							anchor={{ x: 0.5, y: 0.95 }}
							onPress={() => handleMarkerPress(complaint)}
							tracksViewChanges={false}
						>
							<ComplaintMarkerPin color={pinColor} selected={isSelected} />
						</Marker>
					);
				})}
			</MapView>
			{!isMapReady && <MapSkeleton />}

			<View
				className="absolute left-0 right-0 gap-2 px-4"
				style={{ top: insets.top + 16 }}
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
				<TestingWarningAlert />
				{permissionDenied && (
					<LocationPermissionAlert message="Habilite a localização para ver sua posição e denúncias por perto no mapa." />
				)}
			</View>

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

			<View
				className="absolute"
				style={{
					right: 16 + insets.right,
					bottom:
						windowHeight * LIST_SHEET_MIN_SNAP_RATIO +
						FAB_GROUP_GAP +
						FAB_SIZE +
						FAB_GROUP_GAP,
				}}
				pointerEvents="box-none"
			>
				<TouchableOpacity
					activeOpacity={0.9}
					onPress={handleOpenMapControlsSheet}
					className="h-12 w-12 items-center justify-center rounded-xl bg-white"
					style={fabShadow}
				>
					<SlidersHorizontalIcon
						size={20}
						color={colors.gray[700]}
						strokeWidth={2}
					/>
				</TouchableOpacity>
			</View>

			<View
				className="absolute flex-row gap-2 items-center"
				style={{
					right: 16 + insets.right,
					bottom: windowHeight * LIST_SHEET_MIN_SNAP_RATIO + FAB_GROUP_GAP,
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
					className="h-12 w-12 items-center justify-center rounded-xl bg-white"
					style={fabShadow}
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
					className="h-12 w-12 items-center justify-center rounded-xl bg-lime-800"
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

			<ComplaintBottomSheet source="map" />

			<ComplaintFilterBottomSheet
				ref={filterSheetRef}
				filters={draftFilters}
				categories={categories}
				onFiltersChange={setDraftFilters}
				onApply={handleApplyFilters}
				onClear={handleClearFilters}
			/>

			<MapControlsBottomSheet
				ref={mapControlsSheetRef}
				mapRef={mapRef}
				isMapReady={isMapReady}
				permissionDenied={permissionDenied}
				showUserLocation={showUserLocation}
				onToggleUserLocation={() => setShowUserLocation(v => !v)}
				isDarkMap={isDarkMap}
				onToggleDarkMap={() => setIsDarkMap(v => !v)}
				mapHeading={mapHeading}
				onResetNorth={handleResetNorth}
			/>
		</View>
	);
}
