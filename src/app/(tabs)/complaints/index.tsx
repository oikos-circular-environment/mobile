import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { ListIcon, PlusIcon } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Platform, ScrollView, TouchableOpacity, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
	ComplaintBottomSheet,
	type MapComplaint,
} from "@/components/complaints/complaint-bottom-sheet";
import { ComplaintStatusChip } from "@/components/complaints/complaint-chip/complaint-status-chip";
import { ComplaintTypeChip } from "@/components/complaints/complaint-chip/complaint-type-chip";
import { COMPLAINT_TYPE_COLORS } from "@/components/complaints/complaint-chip/tokens";
import { colors } from "@/components/style/colors";
import { toast } from "@/components/toast";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Spinner } from "@/components/ui/spinner";
import { useAuthContext } from "@/contexts/auth-context";
import { useGeospatial } from "@/contexts/geospatial-context";
import {
	deleteV1ComplaintsByIdVotes,
	getV1ComplaintsMap,
	postV1ComplaintsByIdVotes,
} from "@/libs/oikos-sdk";
import {
	type ComplaintStatus,
	type ComplaintType,
	complaintStatuses,
	complaintTypeValues,
} from "@/libs/types/complaint";

const MAP_QUERY_KEY = (
	lat: number,
	lon: number,
	type: ComplaintType | null,
	status: ComplaintStatus | null,
) => ["complaints", "map", lat, lon, type, status] as const;

export default function ComplaintsMapScreen() {
	const insets = useSafeAreaInsets();
	const { isAuthenticated } = useAuthContext();
	const { location } = useGeospatial();
	const queryClient = useQueryClient();
	const mapRef = useRef<MapView>(null);
	const hasAnimatedRef = useRef(false);
	const suppressMapPressRef = useRef(false);

	const userLocation = location
		? { lat: location.coords.latitude, lon: location.coords.longitude }
		: null;

	const [activeTypeFilter, setActiveTypeFilter] =
		useState<ComplaintType | null>("IRREGULAR_DISPOSAL");
	const [activeStatusFilter, setActiveStatusFilter] =
		useState<ComplaintStatus | null>("OPEN");
	const [selectedComplaint, setSelectedComplaint] =
		useState<MapComplaint | null>(null);
	const [userVotes, setUserVotes] = useState<
		Record<string, "RESOLVED" | "NOT_RESOLVED">
	>({});
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

	const { data: mapData, isLoading: isLoadingMap } = useQuery({
		queryKey: MAP_QUERY_KEY(
			userLocation?.lat ?? 0,
			userLocation?.lon ?? 0,
			activeTypeFilter,
			activeStatusFilter,
		),
		queryFn: async () => {
			const res = await getV1ComplaintsMap({
				query: {
					lat: userLocation?.lat ?? 0,
					lon: userLocation?.lon ?? 0,
					radius: 10000,
					...(activeTypeFilter ? { type: activeTypeFilter } : {}),
					...(activeStatusFilter ? { status: activeStatusFilter } : {}),
				},
			});
			return res.data;
		},
		enabled: !!userLocation,
	});

	const complaints = mapData?.complaints ?? [];

	const voteMutation = useMutation({
		mutationFn: async ({
			complaintId,
			voteType,
		}: {
			complaintId: string;
			voteType: "RESOLVED" | "NOT_RESOLVED" | null;
		}) => {
			if (voteType === null) {
				await deleteV1ComplaintsByIdVotes({ path: { id: complaintId } });
			} else {
				await postV1ComplaintsByIdVotes({
					path: { id: complaintId },
					body: { vote_type: voteType },
				});
			}
		},
		onSuccess: (_, { complaintId, voteType }) => {
			setUserVotes(prev => {
				if (voteType === null) {
					const next = { ...prev };
					delete next[complaintId];
					return next;
				}
				return { ...prev, [complaintId]: voteType };
			});
			void queryClient.invalidateQueries({
				queryKey: MAP_QUERY_KEY(
					userLocation?.lat ?? 0,
					userLocation?.lon ?? 0,
					activeTypeFilter,
					activeStatusFilter,
				),
			});
		},
		onError: () => toast.error("Erro", "Não foi possível registrar seu voto."),
	});

	const handleVote = (voteType: "RESOLVED" | "NOT_RESOLVED") => {
		if (!isAuthenticated) {
			toast.info("Login necessário", "Entre para votar em denúncias.");
			return;
		}
		if (!selectedComplaint) return;

		const current = userVotes[selectedComplaint.id];
		const next = current === voteType ? null : voteType;
		voteMutation.mutate({ complaintId: selectedComplaint.id, voteType: next });
	};

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

	const currentVote = selectedComplaint
		? userVotes[selectedComplaint.id]
		: undefined;

	return (
		<View className="flex-1">
			{/* Full-screen map */}
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
				style={{ top: 24 }}
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

			{/* Loading indicator*/}
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

			{/* FABs: bottom-right */}
			<View
				className="absolute bottom-4 right-4 flex-row gap-2 items-center"
				style={{ bottom: insets.bottom }}
				pointerEvents="box-none"
			>
				{/* My complaints list */}
				<TouchableOpacity
					activeOpacity={0.9}
					onPress={() => router.push("/(tabs)/complaints/list")}
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

				{/* New complaint */}
				<TouchableOpacity
					activeOpacity={0.9}
					onPress={() => {
						if (!isAuthenticated) {
							toast.info(
								"Login necessário",
								"Entre para registrar uma denúncia.",
							);
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

			<ComplaintBottomSheet
				isOpen={!!selectedComplaint}
				onClose={() => setSelectedComplaint(null)}
				complaint={selectedComplaint}
				currentVote={currentVote}
				onVote={handleVote}
				isPendingVote={voteMutation.isPending}
				userLocation={userLocation}
			/>
		</View>
	);
}
