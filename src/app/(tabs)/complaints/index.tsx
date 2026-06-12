import { router } from "expo-router";
import {
	ListIcon,
	LocateFixedIcon,
	MapIcon,
	MapPinnedIcon,
	MinusIcon,
	PlusIcon,
	RecycleIcon,
	SearchIcon,
	Settings2Icon,
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
import { useWasteCategories } from "@/components/companies/hooks/use-waste-categories";
import { ComplaintHazardLevelFilter } from "@/components/complaints/filter-components/complaint-hazard-level";
import { ComplaintRadiusFilter } from "@/components/complaints/filter-components/complaint-radius";
import {
	ComplaintStatusChip,
	type ComplaintStatusPressableVariant,
} from "@/components/complaints/filter-components/complaint-status-chip";
import { COMPLAINT_TYPE_COLORS } from "@/components/complaints/filter-components/tokens";
import type { MapComplaint } from "@/components/complaints/hooks/use-complaints-map";
import { useComplaintsMap } from "@/components/complaints/hooks/use-complaints-map";
import {
	type HazardLevelVariant,
	WasteCategoryHazardLevel,
} from "@/components/custom/waste-category";
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
import { Divider } from "@/components/ui/divider";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { useAuthContext } from "@/contexts/auth-context";
import { useGeospatial } from "@/contexts/geospatial-context";
import {
	type ComplaintStatus,
	complaintTypeValues,
} from "@/libs/types/complaint";
import type { WasteCategory } from "@/libs/types/waste-category";
import { cn } from "@/libs/utils";

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

const STATUS_FILTER_VARIANTS: ComplaintStatusPressableVariant[] = [
	"all",
	"OPEN",
	"RESOLVED",
];

const HAZARD_LEVELS: HazardLevelVariant[] = [
	"low",
	"medium",
	"high",
	"very_high",
];

type FilterState = {
	status: "OPEN" | "RESOLVED" | null;
	category: WasteCategory | null;
	hazardLevel: HazardLevelVariant | null;
	radius: number;
};

const DEFAULT_FILTERS: FilterState = {
	status: "OPEN",
	category: null,
	hazardLevel: null,
	radius: 10000,
};

export default function ComplaintsMapScreen() {
	const insets = useSafeAreaInsets();
	const { isAuthenticated, needsProfileCompletion } = useAuthContext();
	const { location } = useGeospatial();
	const mapRef = useRef<MapView>(null);
	const filterSheetRef = useRef<BottomSheetRef>(null);
	const hasAnimatedRef = useRef(false);
	const suppressMapPressRef = useRef(false);

	const userLocation = location
		? { lat: location.coords.latitude, lon: location.coords.longitude }
		: null;

	const { categories } = useWasteCategories();

	const [showAuthModal, setShowAuthModal] = useState(false);
	const [showProfileModal, setShowProfileModal] = useState(false);
	const [mapHeading, setMapHeading] = useState(0);
	const [showUserLocation, setShowUserLocation] = useState(false);

	const [appliedFilters, setAppliedFilters] =
		useState<FilterState>(DEFAULT_FILTERS);
	const [draftFilters, setDraftFilters] =
		useState<FilterState>(DEFAULT_FILTERS);

	const hazardLevelForApi = appliedFilters.hazardLevel
		? (appliedFilters.hazardLevel.toUpperCase() as
				| "LOW"
				| "MEDIUM"
				| "HIGH"
				| "VERY_HIGH")
		: null;

	const {
		complaints,
		isLoadingMap,
		selectedMapComplaint,
		setSelectedMapComplaint,
	} = useComplaintsMap({
		userLocation,
		status: appliedFilters.status,
		wasteCategoryId: appliedFilters.category?.id ?? null,
		hazardLevel: hazardLevelForApi,
		radius: appliedFilters.radius,
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

	return (
		<View className="flex-1">
			<MapView
				ref={mapRef}
				style={{ flex: 1 }}
				provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
				showsUserLocation={showUserLocation}
				showsMyLocationButton={false}
				showsCompass={false}
				onPress={handleClosePanel}
				onRegionChangeComplete={handleRegionChangeComplete}
			>
				{complaints.map(complaint => {
					if (!complaint.location) return null;
					const typeInfo = complaintTypeValues.find(
						t => t.value === "IRREGULAR_DISPOSAL",
					);
					const pinColor =
						COMPLAINT_TYPE_COLORS.IRREGULAR_DISPOSAL ?? colors.gray[500];
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

			{/* Filter row */}
			<View
				className="absolute left-0 right-0 px-4"
				style={{ top: 32 }}
				pointerEvents="box-none"
			>
				<FilterRow filters={appliedFilters} onPress={handleOpenFilterSheet} />
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

			{/* Filter bottom sheet */}
			<BottomSheet ref={filterSheetRef}>
				<BottomSheetPortal
					snapPoints={["90%"]}
					backdropComponent={BottomSheetBackdrop}
					handleComponent={BottomSheetDragIndicator}
				>
					<BottomSheetScrollView
						contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
					>
						<Heading size="md" className="mb-4 text-gray-900">
							Filtros
						</Heading>

						<Text className="text-sm font-semibold text-muted-foreground mb-3">
							Categorias
						</Text>
						<View className="flex-row flex-wrap gap-2 mb-4">
							<FilterOption
								label="Todos"
								active={draftFilters.category === null}
								onPress={() =>
									setDraftFilters(prev => ({ ...prev, category: null }))
								}
							/>
							{categories.map(cat => (
								<FilterOption
									key={cat.id}
									label={cat.name}
									active={draftFilters.category?.id === cat.id}
									onPress={() =>
										setDraftFilters(prev => ({
											...prev,
											category: prev.category?.id === cat.id ? null : cat,
										}))
									}
								/>
							))}
						</View>

						<Divider className="mb-4" />

						<Text className="text-sm font-semibold text-muted-foreground mb-3">
							Periculosidade
						</Text>
						<View className="flex-row flex-wrap gap-2 mb-4">
							<ComplaintHazardLevelFilter
								variant="all"
								selected={draftFilters.hazardLevel === null}
								onPress={() =>
									setDraftFilters(prev => ({ ...prev, hazardLevel: null }))
								}
							/>
							{HAZARD_LEVELS.map(level => (
								<ComplaintHazardLevelFilter
									key={level}
									variant={level}
									selected={draftFilters.hazardLevel === level}
									onPress={() =>
										setDraftFilters(prev => ({
											...prev,
											hazardLevel: prev.hazardLevel === level ? null : level,
										}))
									}
								/>
							))}
						</View>

						<Divider className="mb-4" />

						<Text className="text-sm font-semibold text-muted-foreground mb-3">
							Status
						</Text>
						<View className="flex-row flex-wrap gap-2 mb-4">
							{STATUS_FILTER_VARIANTS.map(variant => (
								<ComplaintStatusChip.Pressable
									key={variant}
									variant={variant}
									selected={
										variant === "all"
											? draftFilters.status === null
											: draftFilters.status === variant
									}
									onPress={() =>
										setDraftFilters(prev => ({
											...prev,
											status:
												variant === "all"
													? null
													: (variant as "OPEN" | "RESOLVED"),
										}))
									}
								/>
							))}
						</View>

						<Divider className="mb-4" />

						<Text className="text-sm font-semibold text-muted-foreground mb-3">
							Raio de busca
						</Text>
						<View className="flex-row flex-wrap gap-2 mb-6">
							{RADIUS_OPTIONS.map(({ label, value }) => (
								<ComplaintRadiusFilter
									key={value}
									label={label}
									selected={draftFilters.radius === value}
									onPress={() =>
										setDraftFilters(prev => ({ ...prev, radius: value }))
									}
								/>
							))}
						</View>

						<HStack className="gap-3">
							<TouchableOpacity
								activeOpacity={0.8}
								onPress={handleClearFilters}
								className="flex-1 h-11 items-center justify-center rounded-xl border border-border bg-white"
							>
								<Text className="text-sm font-semibold text-foreground">
									Limpar
								</Text>
							</TouchableOpacity>
							<TouchableOpacity
								activeOpacity={0.85}
								onPress={handleApplyFilters}
								className="flex-1 h-11 items-center justify-center rounded-xl bg-lime-800"
							>
								<Text className="text-sm font-semibold text-white">
									Aplicar
								</Text>
							</TouchableOpacity>
						</HStack>
					</BottomSheetScrollView>
				</BottomSheetPortal>
			</BottomSheet>
		</View>
	);
}

type FilterRowProps = {
	filters: FilterState;
	onPress: () => void;
};

function FilterRow({ filters, onPress }: FilterRowProps) {
	const radiusLabel =
		RADIUS_OPTIONS.find(o => o.value === filters.radius)?.label ?? "10 km";

	const hasActiveFilter =
		filters.category !== null ||
		filters.hazardLevel !== null ||
		filters.status !== null;

	return (
		<HStack className="gap-2 items-center" pointerEvents="auto">
			<TouchableOpacity
				activeOpacity={0.9}
				onPress={onPress}
				className="flex-1 flex-row items-center gap-2 bg-white rounded-xl px-3 border border-border"
				style={{ height: 42 }}
			>
				<SearchIcon size={16} color={colors.gray[400]} strokeWidth={2} />
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerClassName="gap-1.5 items-center py-2"
				>
					{!hasActiveFilter && (
						<Text className="text-sm text-muted-foreground">
							Todos os filtros
						</Text>
					)}
					{filters.hazardLevel && (
						<WasteCategoryHazardLevel variant={filters.hazardLevel} />
					)}
					{filters.category && (
						<View className="flex-row items-center gap-1 bg-gray-100 rounded-full px-2.5 py-0.5">
							<RecycleIcon
								size={10}
								color={colors.gray[700]}
								strokeWidth={2.5}
							/>
							<Text className="text-[10px] font-semibold text-gray-700 uppercase">
								{filters.category.name}
							</Text>
						</View>
					)}
					{filters.status && (
						<ComplaintStatusChip
							status={filters.status as ComplaintStatus}
							size="xs"
						/>
					)}
					<View className="flex-row items-center gap-1 bg-gray-100 rounded-full px-2.5 py-0.5">
						<Text className="text-[10px] font-semibold text-gray-700">
							{radiusLabel}
						</Text>
					</View>
				</ScrollView>
			</TouchableOpacity>

			<TouchableOpacity
				activeOpacity={0.85}
				onPress={onPress}
				className="h-[42px] w-[42px] items-center justify-center rounded-xl bg-lime-800"
				style={{
					shadowColor: colors.black,
					shadowOffset: { width: 0, height: 2 },
					shadowOpacity: 0.2,
					shadowRadius: 3,
					elevation: 3,
				}}
			>
				<Settings2Icon size={18} color={colors.white} strokeWidth={2} />
			</TouchableOpacity>
		</HStack>
	);
}

type FilterOptionProps = {
	label: string;
	active: boolean;
	onPress: () => void;
};

function FilterOption({ label, active, onPress }: FilterOptionProps) {
	return (
		<TouchableOpacity
			onPress={onPress}
			activeOpacity={0.8}
			className={cn(
				"h-9 px-4 rounded-xl border items-center justify-center",
				active ? "bg-lime-800 border-lime-800" : "bg-white border-border",
			)}
		>
			<Text
				className={cn(
					"text-sm font-medium",
					active ? "text-white" : "text-foreground",
				)}
			>
				{label}
			</Text>
		</TouchableOpacity>
	);
}
