import { router } from "expo-router";
import {
	ListIcon,
	LocateFixedIcon,
	MinusIcon,
	PlusIcon,
	RecycleIcon,
	SearchIcon,
	Settings2Icon,
} from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { ComplaintStatusChip } from "@/components/complaints/complaint-chip/complaint-status-chip";
import { COMPLAINT_TYPE_COLORS } from "@/components/complaints/complaint-chip/tokens";
import type { MapComplaint } from "@/components/complaints/hooks/use-complaints-map";
import { useComplaintsMap } from "@/components/complaints/hooks/use-complaints-map";
import { colors } from "@/components/style/colors";
import {
	WasteCategoryHazardLevel,
	type HazardLevelVariant,
} from "@/components/custom/waste-category";
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

const STATUS_FILTER_OPTIONS: { label: string; value: ComplaintStatus | null }[] =
	[
		{ label: "Todos", value: null },
		{ label: "Aberto", value: "OPEN" },
		{ label: "Resolvido", value: "RESOLVED" },
	];

const HAZARD_LEVELS: HazardLevelVariant[] = ["low", "medium", "high", "very_high"];

const HAZARD_SELECTED_STYLE: Record<HazardLevelVariant, string> = {
	low: "border-lime-400 bg-lime-100",
	medium: "border-yellow-400 bg-yellow-100",
	high: "border-orange-400 bg-orange-100",
	very_high: "border-red-400 bg-red-100",
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
	const [activeRadius, setActiveRadius] = useState(10000);
	const [activeStatusFilter, setActiveStatusFilter] =
		useState<ComplaintStatus | null>("OPEN");
	const [activeCategory, setActiveCategory] = useState<WasteCategory | null>(null);
	const [activeHazardLevel, setActiveHazardLevel] =
		useState<HazardLevelVariant | null>(null);

	const {
		complaints,
		isLoadingMap,
		selectedMapComplaint,
		setSelectedMapComplaint,
	} = useComplaintsMap({
		userLocation,
		activeTypeFilter: null,
		activeStatusFilter,
		radius: activeRadius,
	});

	const filteredComplaints = useMemo(
		() =>
			complaints.filter(complaint => {
				if (activeCategory) {
					if (
						!complaint.categories?.some(cat => cat.id === activeCategory.id)
					)
						return false;
				}
				if (activeHazardLevel) {
					if (
						!complaint.categories?.some(cat =>
							cat.hazard_levels?.some(
								h => h.toLowerCase() === activeHazardLevel,
							),
						)
					)
						return false;
				}
				return true;
			}),
		[complaints, activeCategory, activeHazardLevel],
	);

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

	return (
		<View className="flex-1">
			<MapView
				ref={mapRef}
				style={{ flex: 1 }}
				provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
				showsUserLocation={false}
				showsMyLocationButton={false}
				showsCompass={false}
				onPress={handleClosePanel}
				onRegionChangeComplete={handleRegionChangeComplete}
			>
				{filteredComplaints.map(complaint => {
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
				<FilterRow
					activeCategory={activeCategory}
					activeHazardLevel={activeHazardLevel}
					activeStatusFilter={activeStatusFilter}
					activeRadius={activeRadius}
					onPress={() => filterSheetRef.current?.open()}
				/>
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
								active={activeCategory === null}
								onPress={() => setActiveCategory(null)}
							/>
							{categories.map(cat => (
								<FilterOption
									key={cat.id}
									label={cat.name}
									active={activeCategory?.id === cat.id}
									onPress={() =>
										setActiveCategory(
											activeCategory?.id === cat.id ? null : cat,
										)
									}
								/>
							))}
						</View>

						<Divider className="mb-4" />

						<Text className="text-sm font-semibold text-muted-foreground mb-3">
							Periculosidade
						</Text>
						<View className="flex-row flex-wrap gap-2 mb-4">
							<FilterOption
								label="Todos"
								active={activeHazardLevel === null}
								onPress={() => setActiveHazardLevel(null)}
							/>
							{HAZARD_LEVELS.map(level => (
								<TouchableOpacity
									key={level}
									activeOpacity={0.8}
									onPress={() =>
										setActiveHazardLevel(
											activeHazardLevel === level ? null : level,
										)
									}
									className={cn(
										"rounded-xl border px-3 py-2",
										activeHazardLevel === level
											? HAZARD_SELECTED_STYLE[level]
											: "border-border bg-white",
									)}
								>
									<WasteCategoryHazardLevel variant={level} />
								</TouchableOpacity>
							))}
						</View>

						<Divider className="mb-4" />

						<Text className="text-sm font-semibold text-muted-foreground mb-3">
							Status
						</Text>
						<View className="gap-2">
							{STATUS_FILTER_OPTIONS.map(opt => {
								const isActive = activeStatusFilter === opt.value;
								return (
									<TouchableOpacity
										key={opt.label}
										activeOpacity={0.85}
										onPress={() => setActiveStatusFilter(opt.value)}
										className={cn(
											"h-12 flex-row items-center justify-between rounded-xl px-4",
											isActive
												? "bg-lime-800"
												: "bg-gray-50 border border-gray-100",
										)}
									>
										<Text
											className={cn(
												"font-semibold",
												isActive ? "text-white" : "text-gray-800",
											)}
										>
											{opt.label}
										</Text>
										{isActive && (
											<View className="h-2 w-2 rounded-full bg-white" />
										)}
									</TouchableOpacity>
								);
							})}
						</View>

						<Divider className="mb-4" />

						<Text className="text-sm font-semibold text-muted-foreground mb-3">
							Raio de busca
						</Text>
						<View className="gap-2">
							{RADIUS_OPTIONS.map(({ label, value }) => {
								const isActive = activeRadius === value;
								return (
									<TouchableOpacity
										key={value}
										activeOpacity={0.85}
										onPress={() => setActiveRadius(value)}
										className={cn(
											"h-12 flex-row items-center justify-between rounded-xl px-4",
											isActive
												? "bg-lime-800"
												: "bg-gray-50 border border-gray-100",
										)}
									>
										<Text
											className={cn(
												"font-semibold",
												isActive ? "text-white" : "text-gray-800",
											)}
										>
											{label}
										</Text>
										{isActive && (
											<View className="h-2 w-2 rounded-full bg-white" />
										)}
									</TouchableOpacity>
								);
							})}
						</View>
					</BottomSheetScrollView>
				</BottomSheetPortal>
			</BottomSheet>
		</View>
	);
}

type FilterRowProps = {
	activeCategory: WasteCategory | null;
	activeHazardLevel: HazardLevelVariant | null;
	activeStatusFilter: ComplaintStatus | null;
	activeRadius: number;
	onPress: () => void;
};

function FilterRow({
	activeCategory,
	activeHazardLevel,
	activeStatusFilter,
	activeRadius,
	onPress,
}: FilterRowProps) {
	const radiusLabel =
		RADIUS_OPTIONS.find(o => o.value === activeRadius)?.label ?? "10 km";

	const hasActiveFilter =
		activeCategory !== null ||
		activeHazardLevel !== null ||
		activeStatusFilter !== null;

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
					{activeHazardLevel && (
						<WasteCategoryHazardLevel variant={activeHazardLevel} />
					)}
					{activeCategory && (
						<View className="flex-row items-center gap-1 bg-gray-100 rounded-full px-2.5 py-0.5">
							<RecycleIcon size={10} color={colors.gray[700]} strokeWidth={2.5} />
							<Text className="text-[10px] font-semibold text-gray-700 uppercase">
								{activeCategory.name}
							</Text>
						</View>
					)}
					{activeStatusFilter && (
						<ComplaintStatusChip status={activeStatusFilter} size="xs" />
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
