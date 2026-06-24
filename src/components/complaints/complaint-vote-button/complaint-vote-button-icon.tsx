import { ThumbsDownIcon, ThumbsUpIcon } from "lucide-react-native";
import { colors } from "@/components/style/colors";
import { useComplaintVoteButtonContext } from "./context";

type ComplaintVoteButtonIconProps = {
	type: "RESOLVED" | "NOT_RESOLVED";
};

export function ComplaintVoteButtonIcon({
	type,
}: ComplaintVoteButtonIconProps) {
	const { currentVote, disabled } = useComplaintVoteButtonContext();
	const isActive = currentVote === type;

	const color = disabled
		? colors.gray[300]
		: isActive
			? colors.white
			: colors.gray[400];

	const Icon = type === "RESOLVED" ? ThumbsUpIcon : ThumbsDownIcon;

	return <Icon size={16} color={color} strokeWidth={2} />;
}
