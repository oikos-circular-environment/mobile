import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import {
	AlertTriangleIcon,
	BuildingIcon,
	CalendarIcon,
	CrosshairIcon,
	ImageIcon,
	MapPinIcon,
	PlusIcon,
	ThumbsDownIcon,
	ThumbsUpIcon,
	UserIcon,
} from "lucide-react-native";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/components/style/colors";
import { Badge, BadgeText } from "@/components/ui/badge";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { getV1ComplaintsByIdPublic } from "@/libs/oikos-sdk";
import {
	type ComplaintStatus,
	type ComplaintType,
	complaintTypeValues,
} from "@/libs/types/complaint";
import { ComplaintStatusChip } from "@/components/complaints/complaint-chip/complaint-status-chip";
import { ComplaintTypeChip } from "@/components/complaints/complaint-chip/complaint-type-chip";

function getAddress(geo: {
	addresses: {
		street: string | null;
		streetNumber: string | null;
		district: string | null;
		city: string | null;
	};
}): string {
	const { street, streetNumber, district, city } = geo.addresses;
	const streetPart = [street, streetNumber].filter(Boolean).join(", ");
	const areaPart = [district, city].filter(Boolean).join(", ");
	return [streetPart, areaPart].filter(Boolean).join(" — ");
}

function timeAgo(date: Date | string): string {
	const diff = Date.now() - new Date(date).getTime();
	const hours = Math.floor(diff / 3_600_000);
	if (hours < 1) return "há menos de 1 hora";
	if (hours < 24) return `há ${hours} hora${hours > 1 ? "s" : ""}`;
	const days = Math.floor(hours / 24);
	if (days < 30) return `há ${days} dia${days > 1 ? "s" : ""}`;
	const months = Math.floor(days / 30);
	return `há ${months} ${months > 1 ? "meses" : "mês"}`;
}

export default function ComplaintDetailScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const insets = useSafeAreaInsets();

	const { data, isLoading, isError } = useQuery({
		queryKey: ["complaint", "public", id],
		queryFn: async () => {
			const res = await getV1ComplaintsByIdPublic({ path: { id } });
			return res.data;
		},
		enabled: !!id,
	});

	const complaint = data?.complaint;

	const typeInfo = complaint
		? complaintTypeValues.find(t => t.value === complaint.type)
		: null;

	const allAttachments = complaint?.captures.flatMap(c => c.attachments) ?? [];
	const observations = complaint?.captures
		.map(c => c.observations)
		.filter(Boolean)
		.join(" ");
	const geo = complaint?.captures[0]?.geospatial;
	const address = geo ? getAddress(geo) : null;
	const dateLabel = complaint
		? format(
				new Date(complaint.created_at),
				"d 'de' MMMM 'de' yyyy, 'às' HH:mm",
				{ locale: ptBR },
			)
		: "";
	const coords = complaint?.location
		? `${complaint.location.lat.toFixed(4)}, ${complaint.location.lon.toFixed(4)}`
		: null;

	return (
		<View className="flex-1 bg-background">
			{/* Loading / error */}
			{isLoading && (
				<View className="flex-1 items-center justify-center">
					<Spinner size="large" />
				</View>
			)}
			{isError && !isLoading && (
				<View className="flex-1 items-center justify-center px-8">
					<Text className="text-center text-sm text-gray-500">
						Não foi possível carregar a denúncia.
					</Text>
				</View>
			)}

			{complaint && (
				<ScrollView
					contentContainerClassName="gap-4 px-4 pt-5"
					contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
					showsVerticalScrollIndicator={false}
				>
					{/* Title */}
					<Heading className="text-xl font-bold uppercase text-gray-900">
						{typeInfo?.label ?? complaint.type}
					</Heading>

					{/* Badges */}
					<View className="flex-row gap-2">
						<ComplaintTypeChip
							type={complaint.type as ComplaintType}
							size="sm"
						/>
						<ComplaintStatusChip
							status={complaint.status as ComplaintStatus}
							size="sm"
						/>
					</View>

					{/* Meta */}
					<View className="gap-2">
						{address && (
							<View className="flex-row items-center gap-2">
								<MapPinIcon
									size={14}
									color={colors.gray[500]}
									strokeWidth={2}
								/>
								<Text
									className="flex-1 text-[13px] text-gray-600"
									numberOfLines={2}
								>
									{address}
								</Text>
							</View>
						)}
						<View className="flex-row items-center gap-2">
							<CalendarIcon
								size={14}
								color={colors.gray[500]}
								strokeWidth={2}
							/>
							<Text className="text-[13px] text-gray-600">{dateLabel}</Text>
						</View>
						{coords && (
							<View className="flex-row items-center gap-2">
								<CrosshairIcon
									size={14}
									color={colors.gray[500]}
									strokeWidth={2}
								/>
								<Text className="text-[13px] text-gray-600">{coords}</Text>
							</View>
						)}
					</View>

					{/* Observations */}
					{observations ? (
						<Text className="text-sm leading-5 text-gray-700">
							{observations}
						</Text>
					) : null}

					{/* Attachments */}
					{allAttachments.length > 0 && (
						<View className="gap-2.5">
							<HStack className="gap-2">
								<Text>Anexos</Text>
								<Badge variant="outline">
									<BadgeText>{allAttachments.length}</BadgeText>
								</Badge>
							</HStack>
							<View className="flex-row flex-wrap gap-2">
								{allAttachments.map(att => (
									<View
										key={att.id}
										className="h-20 w-20 overflow-hidden rounded-lg bg-gray-100"
									>
										{att.type === "PHOTO" ? (
											<Image
												source={{ uri: att.url }}
												style={{ width: "100%", height: "100%" }}
												contentFit="cover"
											/>
										) : (
											<View className="flex-1 items-center justify-center bg-zinc-700">
												<ImageIcon
													size={20}
													color={colors.white}
													strokeWidth={2}
												/>
											</View>
										)}
									</View>
								))}
							</View>
						</View>
					)}

					{/* Resolutions section */}
					<View className="gap-3">
						<View className="flex-row items-center justify-between">
							<Text className="text-sm font-bold text-gray-800">Resolução</Text>
						</View>

						{/* Warning */}
						<View className="flex-row items-start gap-2 rounded-lg bg-amber-50 p-3">
							<AlertTriangleIcon
								size={14}
								color={colors.amber[600]}
								strokeWidth={2}
								className="mt-px"
							/>
							<Text className="flex-1 text-xs leading-[18px] text-amber-700">
								As resoluções serão públicas, utilize este local apenas para
								postagens íntegras que levarão à resolução da denúncia.
							</Text>
						</View>

						{/* Resolution list */}
						{complaint.resolutions.length === 0 ? (
							<Text className="py-2 text-center text-[13px] text-gray-400">
								Nenhuma resolução publicada ainda.
							</Text>
						) : (
							complaint.resolutions.map(resolution => (
								<View
									key={resolution.id}
									className="gap-2 rounded-[10px] border border-gray-100 p-3"
								>
									<View className="flex-row items-center justify-between">
										<View className="flex-row items-center gap-1.5">
											<View className="h-7 w-7 items-center justify-center rounded-full bg-gray-100">
												{resolution.resolver.type === "company" ? (
													<BuildingIcon
														size={14}
														color={colors.gray[500]}
														strokeWidth={2}
													/>
												) : (
													<UserIcon
														size={14}
														color={colors.gray[500]}
														strokeWidth={2}
													/>
												)}
											</View>
											<Text className="text-[13px] font-semibold text-gray-800">
												{resolution.resolver.type === "company"
													? (resolution.resolver.business_name ??
														resolution.resolver.corporate_name)
													: (resolution.resolver.display_name ??
														resolution.resolver.full_name)}
											</Text>
										</View>
										<Text className="text-[11px] text-gray-400">
											{timeAgo(resolution.created_at)}
										</Text>
									</View>
									<Text
										className="text-[13px] text-gray-600"
										style={{ lineHeight: 19 }}
									>
										{resolution.description}
									</Text>
								</View>
							))
						)}

						{/* Adicionar resolução */}
						<TouchableOpacity
							activeOpacity={0.85}
							onPress={() =>
								router.push(`/(tabs)/complaints/${complaint.id}/resolution`)
							}
							className="h-11 flex-row items-center justify-center gap-1.5 rounded-[10px] bg-white"
							style={{ borderWidth: 1.5, borderColor: colors.gray[200] }}
						>
							<PlusIcon size={15} color={colors.gray[600]} strokeWidth={2} />
							<Text className="text-[13px] font-semibold text-gray-700">
								Adicionar resolução
							</Text>
						</TouchableOpacity>
					</View>
				</ScrollView>
			)}

			{/* Fixed vote footer */}
			{complaint && (
				<View
					className="absolute bottom-0 left-0 right-0 flex-row gap-2 border-t border-gray-100 bg-white px-4 pt-3"
					style={{ paddingBottom: insets.bottom + 12 }}
				>
					<View
						className="h-11 flex-1 flex-row items-center justify-center gap-1.5 rounded-[10px]"
						style={{ borderWidth: 1.5, borderColor: colors.gray[200] }}
					>
						<ThumbsDownIcon
							size={15}
							color={colors.gray[500]}
							strokeWidth={2}
						/>
						<Text className="text-[13px] font-semibold text-gray-700">
							Não Resolvida
						</Text>
						<Text className="text-xs text-gray-400">
							{complaint.vote_counts.not_resolved}
						</Text>
					</View>
					<View className="h-11 flex-1 flex-row items-center justify-center gap-1.5 rounded-[10px] bg-lime-800">
						<ThumbsUpIcon size={15} color={colors.white} strokeWidth={2} />
						<Text className="text-[13px] font-semibold text-white">
							Resolvida
						</Text>
						<Text className="text-xs text-lime-100">
							{complaint.vote_counts.resolved}
						</Text>
					</View>
				</View>
			)}
		</View>
	);
}
