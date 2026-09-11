import type { GetV1ComplaintsByIdResolutionsResponses } from "@oikos-circular-environment/oikos-sdk";
import { format, formatDistanceToNowStrict } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowUpRightIcon, BuildingIcon, UserIcon } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { ResolutionAttachmentsStack } from "@/components/complaints/resolution-attachments-stack";
import { colors } from "@/components/style/colors";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Badge, BadgeText } from "@/components/ui/badge";
import { Text } from "@/components/ui/text";
import { getAuthenticatedImageHeaders } from "@/libs/api/oikos-api";
import { Heading } from "../ui/heading";

export type Resolution =
	GetV1ComplaintsByIdResolutionsResponses[200]["resolutions"][number];

export type ResolutionCardProps = {
	resolution: Resolution;
	isOwnResolution: boolean;
	onEdit: () => void;
};

export function ResolutionCard({
	resolution,
	isOwnResolution,
	onEdit,
}: ResolutionCardProps) {
	const isCompanyResolution = resolution.resolver_company !== null;

	const resolverName = isCompanyResolution
		? (resolution.resolver_company?.business_name ??
			resolution.resolver_company?.corporate_name)
		: (resolution.resolver_user_profile.display_name ??
			resolution.resolver_user_profile.full_name);

	const avatarUrl = isCompanyResolution
		? (resolution.resolver_company?.avatar_url ?? null)
		: (resolution.resolver_user_profile.avatar_url ?? null);

	const cardContent = (
		<View className="gap-2 rounded-xl border border-gray-100 p-3">
			<View className="flex-1 flex-row justify-between">
				{isOwnResolution && (
					<View className="self-start">
						<Badge variant="soft" className="bg-lime-100">
							<BadgeText className="text-lime-600">Sua Resolução</BadgeText>
						</Badge>
					</View>
				)}

				<View className="flex-1 items-end justify-center">
					<ArrowUpRightIcon size={14} color={colors.gray[500]} />
				</View>
			</View>

			<View className="flex-row gap-2 ">
				<Avatar size="sm" className="h-16 w-16 rounded-lg bg-gray-100">
					{isCompanyResolution ? (
						<BuildingIcon size={14} color={colors.gray[500]} strokeWidth={2} />
					) : (
						<UserIcon size={14} color={colors.gray[500]} strokeWidth={2} />
					)}
					{avatarUrl && (
						<AvatarImage
							source={{
								uri: avatarUrl,
								headers: getAuthenticatedImageHeaders(),
							}}
						/>
					)}
				</Avatar>

				<View className="flex-1">
					<Heading className="text-gray-800" numberOfLines={2}>
						{resolverName}
					</Heading>
					<Text className="text-sm text-gray-400">
						{format(new Date(resolution.created_at), "d 'de' MMMM", {
							locale: ptBR,
						})}{" "}
						•{" "}
						{formatDistanceToNowStrict(resolution.created_at, { locale: ptBR })}
					</Text>
				</View>

				{resolution.attachments.length > 0 && (
					<ResolutionAttachmentsStack attachments={resolution.attachments} />
				)}
			</View>

			<Text className="text-gray-600" numberOfLines={4}>
				{resolution.description}
			</Text>
		</View>
	);

	if (isOwnResolution) {
		return (
			<Pressable onPress={onEdit} hitSlop={4}>
				{cardContent}
			</Pressable>
		);
	}

	return <View>{cardContent}</View>;
}
