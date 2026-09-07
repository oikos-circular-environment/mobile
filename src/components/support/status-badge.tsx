import type { LucideIcon } from "lucide-react-native";
import { CircleCheck, CircleDot, CircleX } from "lucide-react-native";
import { Badge, BadgeIcon, BadgeText } from "@/components/ui/badge";
import type { SupportRequestStatus } from "@/libs/types/support";
import { cn } from "@/libs/utils";

type StatusConfig = {
	label: string;
	icon: LucideIcon;
	containerClassName: string;
	contentClassName: string;
};

const STATUS_CONFIG: Record<SupportRequestStatus, StatusConfig> = {
	OPEN: {
		label: "ABERTO",
		icon: CircleDot,
		containerClassName: "border-lime-600 bg-lime-50",
		contentClassName: "text-lime-700",
	},
	CLOSED: {
		label: "RESOLVIDO",
		icon: CircleCheck,
		containerClassName: "border-lime-600 bg-lime-50",
		contentClassName: "text-lime-700",
	},
	RESOLVED: {
		label: "RESOLVIDO",
		icon: CircleCheck,
		containerClassName: "border-lime-600 bg-lime-50",
		contentClassName: "text-lime-700",
	},
	CANCELLED: {
		label: "CANCELADO",
		icon: CircleX,
		containerClassName: "border-gray-300 bg-gray-50",
		contentClassName: "text-gray-600",
	},
};

export function StatusBadge({ status }: { status: SupportRequestStatus }) {
	const config = STATUS_CONFIG[status];
	return (
		<Badge
			variant="outline"
			className={cn("self-start gap-1", config.containerClassName)}
		>
			<BadgeIcon as={config.icon} className={config.contentClassName} />
			<BadgeText
				className={cn("text-[10px] font-semibold", config.contentClassName)}
			>
				{config.label}
			</BadgeText>
		</Badge>
	);
}
