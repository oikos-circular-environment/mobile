import {
	ShieldAlertIcon,
	ShieldCheckIcon,
	ShieldIcon,
	ShieldQuestionMarkIcon,
	ShieldXIcon,
} from "lucide-react-native";
import { View } from "react-native";
import { colors } from "@/components/style/colors";
import type { ComplaintStatus } from "@/libs/types/complaint";

interface ComplaintStatusProps {
	status: ComplaintStatus;
}

export function ComplaintStatusComponent({ status }: ComplaintStatusProps) {
	switch (status) {
		case "OPEN":
			return (
				<View className="items-center gap-2 rounded-md bg-sky-100 p-1">
					<ShieldIcon size={12} strokeWidth={2.5} color={colors.sky[500]} />
				</View>
			);
		case "IN_PROGRESS":
			return (
				<View className="items-center gap-2 rounded-md bg-amber-100 p-1">
					<ShieldQuestionMarkIcon size={12} strokeWidth={2.5} color={colors.amber[400]} />
				</View>
			);
		case "RESOLVED":
			return (
				<View className="items-center gap-2 rounded-md bg-lime-100 p-1">
					<ShieldCheckIcon size={12} strokeWidth={2.5} color={colors.lime[800]} />
				</View>
			);
		case "REJECTED":
			return (
				<View className="items-center gap-2 rounded-md bg-orange-100 p-1">
					<ShieldAlertIcon size={12} strokeWidth={2.5} color={colors.orange[600]} />
				</View>
			);
		case "CANCELED":
			return (
				<View className="items-center gap-2 rounded-md bg-red-100 p-1">
					<ShieldXIcon size={12} strokeWidth={2.5} color={colors.red[700]} />
				</View>
			);
	}
}
