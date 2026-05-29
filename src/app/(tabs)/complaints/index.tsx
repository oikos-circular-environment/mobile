import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Location from "expo-location";
import { router } from "expo-router";
import {
	ListIcon,
	MapPinIcon,
	PlusIcon,
	ThumbsDownIcon,
	ThumbsUpIcon,
	XIcon,
} from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	Alert,
	Animated,
	Linking,
	Platform,
	ScrollView,
	TouchableOpacity,
	View,
} from "react-native";
import MapView, {
	Marker,
	PROVIDER_GOOGLE,
	type Region,
} from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/components/style/colors";
import { toast } from "@/components/toast";
import { Heading } from "@/components/ui/heading";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { useAuthContext } from "@/contexts/auth-context";
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

type MapComplaint = NonNullable<
	Awaited<ReturnType<typeof getV1ComplaintsMap>>["data"]
>["complaints"][number];

const COMPLAINT_COLORS: Record<ComplaintType, string> = {
	IRREGULAR_DISPOSAL: colors.amber[500],
	DEFORESTATION: colors.lime[600],
	BURNING: colors.red[500],
	VACANT_LOT: colors.gray[500],
};

const STATUS_LABELS: Record<string, string> = {
	OPEN: "Aberta",
	IN_PROGRESS: "Em andamento",
	RESOLVED: "Resolvida",
	REJECTED: "Rejeitada",
	CANCELED: "Cancelada",
};

const STATUS_COLORS: Record<string, string> = {
	OPEN: colors.sky[500],
	IN_PROGRESS: colors.amber[500],
	RESOLVED: colors.lime[600],
	REJECTED: colors.orange[600],
	CANCELED: colors.red[600],
};

const DEFAULT_REGION: Region = {
	latitude: -15.7801,
	longitude: -47.9292,
	latitudeDelta: 0.05,
	longitudeDelta: 0.05,
};

const MAP_QUERY_KEY = (
	lat: number,
	lon: number,
	type: ComplaintType | null,
	status: ComplaintStatus | null,
) => ["complaints", "map", lat, lon, type, status] as const;

export default function ComplaintsMapScreen() {
	const insets = useSafeAreaInsets();
	const { isAuthenticated } = useAuthContext();
	const queryClient = useQueryClient();
	const mapRef = useRef<MapView>(null);

	const [region, setRegion] = useState<Region>(DEFAULT_REGION);
	const [userLocation, setUserLocation] = useState<{
		lat: number;
		lon: number;
	} | null>(null);
	const [activeTypeFilter, setActiveTypeFilter] =
		useState<ComplaintType | null>("IRREGULAR_DISPOSAL");
	const [activeStatusFilter, setActiveStatusFilter] =
		useState<ComplaintStatus | null>("OPEN");
	const [selectedComplaint, setSelectedComplaint] =
		useState<MapComplaint | null>(null);
	const [userVotes, setUserVotes] = useState<
		Record<string, "RESOLVED" | "NOT_RESOLVED">
	>({});
	const [markersReady, setMarkersReady] = useState(false);

	const panelAnim = useRef(new Animated.Value(0)).current;

	// Get user location on mount
	useEffect(() => {
		void (async () => {
			const { status } = await Location.requestForegroundPermissionsAsync();
			if (status !== "granted") return;
			const loc = await Location.getCurrentPositionAsync({
				accuracy: Location.Accuracy.Balanced,
			});
			const pos = {
				lat: loc.coords.latitude,
				lon: loc.coords.longitude,
			};
			setUserLocation(pos);
			const newRegion: Region = {
				latitude: pos.lat,
				longitude: pos.lon,
				latitudeDelta: 0.04,
				longitudeDelta: 0.04,
			};
			setRegion(newRegion);
			mapRef.current?.animateToRegion(newRegion, 600);
		})();
	}, []);

	// Animate bottom panel in/out
	useEffect(() => {
		Animated.spring(panelAnim, {
			toValue: selectedComplaint ? 1 : 0,
			useNativeDriver: true,
			tension: 80,
			friction: 12,
		}).start();
	}, [selectedComplaint, panelAnim]);

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

	// Switch tracksViewChanges to false after SVG icons finish rendering
	useEffect(() => {
		if (complaints.length === 0) return;
		setMarkersReady(false);
		const t = setTimeout(() => setMarkersReady(true), 300);
		return () => clearTimeout(t);
	}, [complaints]);

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

	const handleOpenInMaps = useCallback(() => {
		if (!selectedComplaint?.location) return;
		const { lat, lon } = selectedComplaint.location;
		const label = encodeURIComponent(
			complaintTypeValues.find(t => t.value === selectedComplaint.type)
				?.label ?? "Denúncia",
		);
		const url =
			Platform.OS === "ios"
				? `maps://?ll=${lat},${lon}&q=${label}`
				: `geo:${lat},${lon}?q=${lat},${lon}(${label})`;
		const fallback = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;

		Linking.canOpenURL(url)
			.then(can => Linking.openURL(can ? url : fallback))
			.catch(() =>
				Alert.alert("Erro", "Não foi possível abrir o aplicativo de mapas."),
			);
	}, [selectedComplaint]);

	const suppressMapPressRef = useRef(false);

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

	const panelTranslate = panelAnim.interpolate({
		inputRange: [0, 1],
		outputRange: [240, 0],
	});

	const typeLabel =
		selectedComplaint &&
		complaintTypeValues.find(t => t.value === selectedComplaint.type)?.label;
	const typeColor =
		selectedComplaint &&
		COMPLAINT_COLORS[selectedComplaint.type as ComplaintType];
	const statusLabel =
		selectedComplaint && STATUS_LABELS[selectedComplaint.status];
	const statusColor =
		selectedComplaint && STATUS_COLORS[selectedComplaint.status];
	const currentVote = selectedComplaint
		? userVotes[selectedComplaint.id]
		: undefined;

	const createdAtLabel =
		selectedComplaint &&
		new Date(selectedComplaint.created_at).toLocaleDateString("pt-BR", {
			dateStyle: "short",
		});

	return (
		<View className="flex-1">
			{/* Full-screen map */}
			<MapView
				ref={mapRef}
				style={{ flex: 1 }}
				provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
				initialRegion={region}
				showsUserLocation
				showsMyLocationButton={false}
				onPress={handleClosePanel}
			>
				{complaints.map(complaint => {
					if (!complaint.location) return null;
					const typeInfo = complaintTypeValues.find(
						t => t.value === complaint.type,
					);
					const pinColor =
						COMPLAINT_COLORS[complaint.type as ComplaintType] ??
						colors.gray[500];
					const isSelected = selectedComplaint?.id === complaint.id;
					const Icon = typeInfo?.icon;
					const size = isSelected ? 38 : 32;
					return (
						<Marker
							key={complaint.id}
							coordinate={{
								latitude: complaint.location.lat,
								longitude: complaint.location.lon,
							}}
							onPress={() => handleMarkerPress(complaint)}
							tracksViewChanges={!markersReady || isSelected}
						>
							<View
								style={{
									width: size,
									height: size,
									borderRadius: 999,
									backgroundColor: pinColor,
									borderWidth: isSelected ? 3 : 2,
									borderColor: colors.white,
									alignItems: "center",
									justifyContent: "center",
									shadowColor: colors.black,
									shadowOffset: { width: 0, height: 2 },
									shadowOpacity: 0.35,
									shadowRadius: 3,
									elevation: 4,
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

			{/* Type filter chips */}
			<View
				className="absolute left-0 right-0"
				style={{ top: insets.top + 8 }}
				pointerEvents="box-none"
			>
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}
					pointerEvents="auto"
				>
					{complaintTypeValues.map(({ value, label, icon: Icon }) => {
						const isActive = activeTypeFilter === value;
						const color = COMPLAINT_COLORS[value as ComplaintType];
						return (
							<TouchableOpacity
								key={value}
								activeOpacity={0.8}
								onPress={() => setActiveTypeFilter(value as ComplaintType)}
								style={{
									flexDirection: "row",
									alignItems: "center",
									gap: 5,
									paddingHorizontal: 14,
									paddingVertical: 7,
									borderRadius: 8,
									backgroundColor: isActive ? color : colors.white,
									shadowColor: colors.black,
									shadowOffset: { width: 0, height: 1 },
									shadowOpacity: 0.15,
									shadowRadius: 3,
									elevation: 3,
								}}
							>
								{Icon && (
									<Icon
										size={13}
										color={isActive ? colors.white : colors.gray[600]}
										strokeWidth={2}
									/>
								)}
								<Text
									style={{
										fontSize: 13,
										fontWeight: "600",
										color: isActive ? colors.white : colors.gray[800],
									}}
								>
									{label}
								</Text>
							</TouchableOpacity>
						);
					})}
				</ScrollView>
			</View>

			{/* Status filter chips */}
			<View
				className="absolute left-0 right-0"
				style={{ top: insets.top + 46 }}
				pointerEvents="box-none"
			>
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}
					pointerEvents="auto"
				>
					{complaintStatuses.map(({ value, icon: Icon }) => {
						if (!Icon) return null;
						const isActive = activeStatusFilter === value;
						const label = STATUS_LABELS[value];
						return (
							<TouchableOpacity
								key={value}
								activeOpacity={0.8}
								onPress={() => setActiveStatusFilter(isActive ? null : value)}
								style={{
									flexDirection: "row",
									alignItems: "center",
									gap: 5,
									paddingHorizontal: 14,
									paddingVertical: 7,
									borderRadius: 8,
									backgroundColor: isActive
										? STATUS_COLORS[value]
										: colors.white,
									shadowColor: colors.black,
									shadowOffset: { width: 0, height: 1 },
									shadowOpacity: 0.15,
									shadowRadius: 3,
									elevation: 3,
								}}
							>
								<Icon
									size={13}
									color={isActive ? colors.white : colors.gray[600]}
									strokeWidth={2}
								/>
								<Text
									style={{
										fontSize: 13,
										fontWeight: "600",
										color: isActive ? colors.white : colors.gray[800],
									}}
								>
									{label}
								</Text>
							</TouchableOpacity>
						);
					})}
				</ScrollView>
			</View>

			{/* Loading indicator */}
			{isLoadingMap && (
				<View
					className="absolute self-center items-center justify-center"
					style={{ top: insets.top + 56 }}
					pointerEvents="none"
				>
					<View
						style={{
							backgroundColor: colors.white,
							borderRadius: 8,
							padding: 8,
							shadowColor: colors.black,
							shadowOffset: { width: 0, height: 1 },
							shadowOpacity: 0.15,
							shadowRadius: 3,
							elevation: 3,
						}}
					>
						<Spinner size="small" />
					</View>
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
					style={{
						width: 50,
						height: 50,
						borderRadius: 12,
						backgroundColor: colors.white,
						alignItems: "center",
						justifyContent: "center",
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
					style={{
						width: 50,
						height: 50,
						borderRadius: 14,
						backgroundColor: colors.lime[800],
						alignItems: "center",
						justifyContent: "center",
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

			{/* Bottom complaint panel */}
			<Animated.View
				style={{
					position: "absolute",
					left: 0,
					right: 0,
					bottom: 0,
					transform: [{ translateY: panelTranslate }],
				}}
				pointerEvents={selectedComplaint ? "auto" : "none"}
			>
				<View
					style={{
						backgroundColor: colors.white,
						borderTopLeftRadius: 20,
						borderTopRightRadius: 20,
						paddingTop: 16,
						paddingHorizontal: 20,
						paddingBottom: insets.bottom + 16,
						shadowColor: colors.black,
						shadowOffset: { width: 0, height: -3 },
						shadowOpacity: 0.12,
						shadowRadius: 8,
						elevation: 8,
					}}
				>
					{selectedComplaint && (
						<>
							{/* Drag handle + close */}
							<View
								style={{
									flexDirection: "row",
									alignItems: "center",
									marginBottom: 12,
								}}
							>
								<View
									style={{
										flex: 1,
										height: 4,
										backgroundColor: colors.gray[200],
										borderRadius: 8,
										marginHorizontal: 60,
									}}
								/>
								<TouchableOpacity onPress={handleClosePanel}>
									<XIcon size={18} color={colors.gray[500]} strokeWidth={2} />
								</TouchableOpacity>
							</View>

							{/* Type + status row */}
							<View
								style={{
									flexDirection: "row",
									alignItems: "center",
									gap: 8,
									marginBottom: 6,
								}}
							>
								<View
									style={{
										width: 10,
										height: 10,
										borderRadius: 8,
										backgroundColor: typeColor ?? colors.gray[400],
									}}
								/>
								<Text
									style={{
										fontSize: 12,
										fontWeight: "600",
										color: typeColor ?? colors.gray[600],
										textTransform: "uppercase",
										letterSpacing: 0.5,
									}}
								>
									{typeLabel}
								</Text>
								<View
									style={{
										width: 3,
										height: 3,
										borderRadius: 8,
										backgroundColor: colors.gray[400],
									}}
								/>
								<Text
									style={{
										fontSize: 12,
										fontWeight: "600",
										color: statusColor ?? colors.gray[600],
									}}
								>
									{statusLabel}
								</Text>
							</View>

							{/* Complaint heading */}
							<Heading size="md" style={{ marginBottom: 4 }}>
								{complaintTypeValues
									.find(t => t.value === selectedComplaint.type)
									?.label?.toUpperCase() ?? "Denúncia"}
							</Heading>

							{/* Meta row */}
							<View style={{ flexDirection: "row", gap: 16, marginBottom: 14 }}>
								<View
									style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
								>
									<ThumbsUpIcon
										size={13}
										color={colors.gray[400]}
										strokeWidth={2}
									/>
									<Text style={{ fontSize: 12, color: colors.gray[500] }}>
										{selectedComplaint.vote_counts.resolved} resolvida
									</Text>
								</View>
								<View
									style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
								>
									<ThumbsDownIcon
										size={13}
										color={colors.gray[400]}
										strokeWidth={2}
									/>
									<Text style={{ fontSize: 12, color: colors.gray[500] }}>
										{selectedComplaint.vote_counts.not_resolved} não resolvida
									</Text>
								</View>
								{createdAtLabel && (
									<Text style={{ fontSize: 12, color: colors.gray[400] }}>
										{createdAtLabel}
									</Text>
								)}
							</View>

							{/* Action buttons */}
							<View style={{ flexDirection: "row", gap: 10 }}>
								{/* Abrir no mapa */}
								<TouchableOpacity
									onPress={handleOpenInMaps}
									activeOpacity={0.8}
									style={{
										flexDirection: "row",
										alignItems: "center",
										gap: 6,
										paddingHorizontal: 14,
										paddingVertical: 10,
										borderRadius: 10,
										borderWidth: 1,
										borderColor: colors.gray[200],
										backgroundColor: colors.gray[50],
									}}
								>
									<MapPinIcon
										size={15}
										color={colors.gray[600]}
										strokeWidth={2}
									/>
									<Text
										style={{
											fontSize: 13,
											fontWeight: "600",
											color: colors.gray[700],
										}}
									>
										Navegar
									</Text>
								</TouchableOpacity>

								{/* Não Resolvida */}
								<TouchableOpacity
									onPress={() => handleVote("NOT_RESOLVED")}
									disabled={voteMutation.isPending}
									activeOpacity={0.8}
									style={{
										flex: 1,
										flexDirection: "row",
										alignItems: "center",
										justifyContent: "center",
										gap: 6,
										paddingVertical: 10,
										borderRadius: 10,
										borderWidth: 1,
										borderColor:
											currentVote === "NOT_RESOLVED"
												? colors.red[500]
												: colors.gray[200],
										backgroundColor:
											currentVote === "NOT_RESOLVED"
												? colors.red[50]
												: colors.white,
									}}
								>
									{voteMutation.isPending ? (
										<Spinner size="small" />
									) : (
										<ThumbsDownIcon
											size={15}
											color={
												currentVote === "NOT_RESOLVED"
													? colors.red[500]
													: colors.gray[500]
											}
											strokeWidth={2}
										/>
									)}
									<Text
										style={{
											fontSize: 13,
											fontWeight: "600",
											color:
												currentVote === "NOT_RESOLVED"
													? colors.red[600]
													: colors.gray[600],
										}}
									>
										Não Resolvida
									</Text>
								</TouchableOpacity>

								{/* Resolvida */}
								<TouchableOpacity
									onPress={() => handleVote("RESOLVED")}
									disabled={voteMutation.isPending}
									activeOpacity={0.8}
									style={{
										flex: 1,
										flexDirection: "row",
										alignItems: "center",
										justifyContent: "center",
										gap: 6,
										paddingVertical: 10,
										borderRadius: 10,
										backgroundColor:
											currentVote === "RESOLVED"
												? colors.lime[700]
												: colors.lime[800],
									}}
								>
									{voteMutation.isPending ? (
										<Spinner size="small" />
									) : (
										<ThumbsUpIcon
											size={15}
											color={colors.white}
											strokeWidth={2}
										/>
									)}
									<Text
										style={{
											fontSize: 13,
											fontWeight: "600",
											color: colors.white,
										}}
									>
										Resolvida
									</Text>
								</TouchableOpacity>
							</View>
						</>
					)}
				</View>
			</Animated.View>
		</View>
	);
}
