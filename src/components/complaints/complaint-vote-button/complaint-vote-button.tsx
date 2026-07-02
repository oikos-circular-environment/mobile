import { TouchableOpacity, View } from "react-native";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { cn } from "@/libs/utils";
import { ComplaintVoteButtonIcon } from "./complaint-vote-button-icon";
import { useComplaintVoteButtonContext } from "./context";

type ComplaintVoteButtonProps = {
	type: "RESOLVED" | "NOT_RESOLVED";
};

const CONFIG = {
	RESOLVED: {
		label: "Resolvida",
		activeClassName: "bg-lime-800 border-transparent",
		activeLabelColor: "text-white",
		activeCountColor: "text-lime-200",
	},
	NOT_RESOLVED: {
		label: "Não Resolvida",
		activeClassName: "bg-red-600 border-transparent",
		activeLabelColor: "text-white",
		activeCountColor: "text-red-200",
	},
} as const;

export function ComplaintVoteButton({ type }: ComplaintVoteButtonProps) {
	const {
		resolvedVotes,
		notResolvedVotes,
		currentVote,
		isPending,
		disabled,
		onVote,
	} = useComplaintVoteButtonContext();

	if (isPending) {
		return (
			<Skeleton
				startColor="bg-gray-200"
				className="h-14 flex-1 rounded-[10px]"
			/>
		);
	}

	const isActive = currentVote === type;
	const voteCount = type === "RESOLVED" ? resolvedVotes : notResolvedVotes;
	const config = CONFIG[type];

	return (
		<TouchableOpacity
			activeOpacity={0.8}
			onPress={() => onVote(type)}
			disabled={disabled}
			className={cn(
				"h-14 flex-1 flex-row items-center gap-3 rounded-[10px] px-4",
				disabled
					? "border border-gray-100 bg-gray-50"
					: isActive
						? config.activeClassName
						: "border border-gray-200 bg-white",
			)}
		>
			{type === "NOT_RESOLVED" && <ComplaintVoteButtonIcon type={type} />}
			<View className="flex-1 items-center">
				<Text
					className={cn(
						"text-sm font-semibold",
						disabled
							? "text-gray-300"
							: isActive
								? config.activeLabelColor
								: "text-gray-700",
					)}
				>
					{config.label}
				</Text>
				<Text
					className={cn(
						"text-xs",
						disabled
							? "text-gray-300"
							: isActive
								? config.activeCountColor
								: "text-gray-400",
					)}
				>
					{voteCount} votos
				</Text>
			</View>
			{type === "RESOLVED" && <ComplaintVoteButtonIcon type={type} />}
		</TouchableOpacity>
	);
}
