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
		containerClassName: "bg-amber-100",
		contentClassName: "text-amber-600",
	},
	CLOSED: {
		label: "RESOLVIDO",
		icon: CircleCheck,
		containerClassName: "bg-lime-100",
		contentClassName: "text-lime-600",
	},
	RESOLVED: {
		label: "RESOLVIDO",
		icon: CircleCheck,
		containerClassName: "bg-lime-100",
		contentClassName: "text-lime-600",
	},
	CANCELLED: {
		label: "CANCELADO",
		icon: CircleX,
		containerClassName: "bg-red-100",
		contentClassName: "text-red-600",
	},
};

export function StatusBadge({ status }: { status: SupportRequestStatus }) {
	const config = STATUS_CONFIG[status];
	return (
		<Badge
			variant="soft"
			className={cn("self-start gap-1", config.containerClassName)}
		>
			<BadgeIcon as={config.icon} className={config.contentClassName} />
			<BadgeText className={cn(config.contentClassName)}>
				{config.label}
			</BadgeText>
		</Badge>
	);
}
