import { LifeBuoyIcon } from "lucide-react-native";
import { Badge, BadgeIcon, BadgeText } from "@/components/ui/badge";

export function SupportContextBadge() {
	return (
		<Badge
			variant="secondary"
			className="self-start gap-1 border border-transparent"
		>
			<BadgeIcon as={LifeBuoyIcon} />
			<BadgeText>SUPORTE</BadgeText>
		</Badge>
	);
}
