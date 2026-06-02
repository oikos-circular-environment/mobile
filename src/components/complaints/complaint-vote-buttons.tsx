import { ThumbsDownIcon, ThumbsUpIcon } from "lucide-react-native";
import { TouchableOpacity, View } from "react-native";
import { colors } from "@/components/style/colors";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";

type VoteButtonProps = {
	label: string;
	voteCount: number;
	isActive: boolean;
	iconSide: "left" | "right";
	activeClassName: string;
	activeLabelColor: string;
	activeCountColor: string;
	activeIconColor: string;
	icon: "thumbs-up" | "thumbs-down";
	onPress: () => void;
};

function VoteButton({
	label,
	voteCount,
	isActive,
	iconSide,
	activeClassName,
	activeLabelColor,
	activeCountColor,
	activeIconColor,
	icon,
	onPress,
}: VoteButtonProps) {
	const iconColor = isActive ? activeIconColor : colors.gray[400];
	const Icon =
		icon === "thumbs-up"
			? (props: { size: number; color: string; strokeWidth: number }) => (
					<ThumbsUpIcon {...props} />
				)
			: (props: { size: number; color: string; strokeWidth: number }) => (
					<ThumbsDownIcon {...props} />
				);

	return (
		<TouchableOpacity
			activeOpacity={0.8}
			onPress={onPress}
			className={`h-14 flex-1 flex-row items-center gap-3 rounded-[10px] px-4 ${
				isActive ? activeClassName : "border border-gray-200 bg-white"
			}`}
		>
			{iconSide === "left" && (
				<Icon size={16} color={iconColor} strokeWidth={2} />
			)}
			<View className="flex-1 items-center">
				<Text
					className={`text-sm font-semibold ${isActive ? activeLabelColor : "text-gray-700"}`}
				>
					{label}
				</Text>
				<Text
					className={`text-xs ${isActive ? activeCountColor : "text-gray-400"}`}
				>
					{voteCount} votos
				</Text>
			</View>
			{iconSide === "right" && (
				<Icon size={16} color={iconColor} strokeWidth={2} />
			)}
		</TouchableOpacity>
	);
}

type ComplaintVoteButtonsProps = {
	resolvedVotes: number;
	notResolvedVotes: number;
	isResolvedActive: boolean;
	isNotResolvedActive: boolean;
	isPendingVote: boolean;
	onVote: (vote: "RESOLVED" | "NOT_RESOLVED") => void;
};

export function ComplaintVoteButtons({
	resolvedVotes,
	notResolvedVotes,
	isResolvedActive,
	isNotResolvedActive,
	isPendingVote,
	onVote,
}: ComplaintVoteButtonsProps) {
	if (isPendingVote) {
		return (
			<View className="flex-row gap-2">
				<Skeleton
					startColor="bg-gray-200"
					className="h-14 flex-1 rounded-[10px]"
				/>
				<Skeleton
					startColor="bg-gray-200"
					className="h-14 flex-1 rounded-[10px]"
				/>
			</View>
		);
	}

	return (
		<View className="flex-row gap-2">
			<VoteButton
				label="Não Resolvida"
				voteCount={notResolvedVotes}
				isActive={isNotResolvedActive}
				iconSide="left"
				icon="thumbs-down"
				activeClassName="bg-red-600 border-transparent"
				activeLabelColor="text-white"
				activeCountColor="text-red-200"
				activeIconColor={colors.white}
				onPress={() => onVote("NOT_RESOLVED")}
			/>
			<VoteButton
				label="Resolvida"
				voteCount={resolvedVotes}
				isActive={isResolvedActive}
				iconSide="right"
				icon="thumbs-up"
				activeClassName="bg-lime-800 border-transparent"
				activeLabelColor="text-white"
				activeCountColor="text-lime-200"
				activeIconColor={colors.white}
				onPress={() => onVote("RESOLVED")}
			/>
		</View>
	);
}
