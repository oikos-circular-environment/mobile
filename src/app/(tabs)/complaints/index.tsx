import { router } from "expo-router";
import { ListIcon, PlusIcon } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Platform, ScrollView, TouchableOpacity, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ComplaintBottomSheet } from "@/components/complaints/complaint-bottom-sheet";
import { ComplaintStatusChip } from "@/components/complaints/complaint-chip/complaint-status-chip";
import { ComplaintTypeChip } from "@/components/complaints/complaint-chip/complaint-type-chip";
import { COMPLAINT_TYPE_COLORS } from "@/components/complaints/complaint-chip/tokens";
import type { MapComplaint } from "@/components/complaints/hooks/use-complaints-map";
import { useComplaintsMap } from "@/components/complaints/hooks/use-complaints-map";
import { colors } from "@/components/style/colors";
import { AuthModal } from "@/components/auth/auth-modal";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Spinner } from "@/components/ui/spinner";
import { useAuthContext } from "@/contexts/auth-context";
import { useGeospatial } from "@/contexts/geospatial-context";
import {
	type ComplaintStatus,
	type ComplaintType,
	complaintStatuses,
	complaintTypeValues,
} from "@/libs/types/complaint";

export default function ComplaintsMapScreen() {
	const insets = useSafeAreaInsets();
	const { isAuthenticated } = useAuthContext();
	const { location } = useGeospatial();
	const mapRef = useRef<MapView>(null);
	const hasAnimatedRef = useRef(false);
	const suppressMapPressRef = useRef(false);

	const userLocation = location
		? { lat: location.coords.latitude, lon: location.coords.longitude }
		: null;

	const [showAuthModal, setShowAuthModal] = useState(false);
	const [activeTypeFilter, setActiveTypeFilter] =
		useState<ComplaintType | null>("IRREGULAR_DISPOSAL");
	const [activeStatusFilter, setActiveStatusFilter] =
		useState<ComplaintStatus | null>("OPEN");

	const {
		complaints,
		isLoadingMap,
		selectedComplaint,
		setSelectedComplaint,
		currentVote,
		handleVote,
		isPendingVote,
	} = useComplaintsMap({ userLocation, activeTypeFilter, activeStatusFilter });

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
		setSelectedComplaint(prev =>
			prev?.id === complaint.id ? null : complaint,
		);
		setTimeout(() => {
			suppressMapPressRef.current = false;
		}, 100);
	};

	const handleClosePanel = () => {
		if (suppressMapPressRef.current) return;
		setSelectedComplaint(null);
	};

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
			>
				{complaints.map(complaint => {
					if (!complaint.location) return null;
					const typeInfo = complaintTypeValues.find(
						t => t.value === complaint.type,
					);
					const pinColor =
						COMPLAINT_TYPE_COLORS[complaint.type as ComplaintType] ??
						colors.gray[500];
					const isSelected = selectedComplaint?.id === complaint.id;
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
						router.push("/(tabs)/complaints/(create)/camera");
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

			<ComplaintBottomSheet
				isOpen={!!selectedComplaint}
				onClose={() => setSelectedComplaint(null)}
				complaint={selectedComplaint}
				currentVote={currentVote}
				onVote={handleVote}
				isPendingVote={isPendingVote}
				userLocation={userLocation}
			/>
		</View>
	);
}
