import { format, formatDistanceToNowStrict } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BuildingIcon, UserIcon } from "lucide-react-native";
import { View } from "react-native";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { ResolutionAttachmentsStack } from "@/components/complaints/resolution-attachments-stack";
import { colors } from "@/components/style/colors";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Badge, BadgeText } from "@/components/ui/badge";
import { Text } from "@/components/ui/text";
import { getAuthenticatedImageHeaders } from "@/libs/api/oikos-api";
import type { GetV1ComplaintsByIdResolutionsResponses } from "@/libs/oikos-sdk";
import { SwipeDeleteAction } from "./swipe-delete-action";
import { SwipeEditAction } from "./swipe-edit-action";

export type Resolution =
	GetV1ComplaintsByIdResolutionsResponses[200]["resolutions"][number];

export type ResolutionCardProps = {
	resolution: Resolution;
	isOwnResolution: boolean;
	onEdit: () => void;
	onDelete: () => void;
};

export function ResolutionCard({
	resolution,
	isOwnResolution,
	onEdit,
	onDelete,
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
		<View
			className="gap-2 rounded-[10px] border border-gray-100 p-3"
			style={isOwnResolution ? { borderColor: colors.lime[200] } : undefined}
		>
			{isOwnResolution && (
				<View className="self-start">
					<Badge variant="outline" className="border-lime-600 bg-lime-50">
						<BadgeText className="text-[10px] font-semibold text-lime-700">
							Sua Resolução
						</BadgeText>
					</Badge>
				</View>
			)}

			<View className="flex-row items-center gap-2">
				<Avatar size="sm" className="h-8 w-8 rounded-full bg-gray-100">
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
					<Text className="text-sm font-semibold text-gray-800">
						{resolverName}
					</Text>
					<Text className="text-xs text-gray-400">
						{format(new Date(resolution.created_at), "d 'de' MMM", {
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

			{isCompanyResolution && (
				<View className="flex-row items-center gap-1 self-start rounded-full bg-gray-100 px-2 py-0.5">
					<BuildingIcon size={11} color={colors.gray[500]} strokeWidth={2} />
					<Text className="text-xs text-gray-500">Empresa responsável</Text>
				</View>
			)}

			<Text className="text-gray-600" style={{ lineHeight: 18 }}>
				{resolution.description}
			</Text>
		</View>
	);

	if (isOwnResolution) {
		return (
			<ReanimatedSwipeable
				friction={2}
				overshootLeft={false}
				overshootRight={false}
				renderLeftActions={(_, translation, swipeable) => (
					<SwipeEditAction
						translation={translation}
						onEdit={() => {
							swipeable.close();
							onEdit();
						}}
					/>
				)}
				renderRightActions={(_, translation, swipeable) => (
					<SwipeDeleteAction
						translation={translation}
						onDelete={() => {
							swipeable.close();
							onDelete();
						}}
					/>
				)}
			>
				{cardContent}
			</ReanimatedSwipeable>
		);
	}

	return <View>{cardContent}</View>;
}
