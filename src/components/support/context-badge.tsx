import { LifeBuoyIcon } from "lucide-react-native";
import { Badge, BadgeIcon, BadgeText } from "@/components/ui/badge";
export function SupportContextBadge() {
	return (
		<Badge variant="secondary" className="self-start gap-1">
			<BadgeIcon as={LifeBuoyIcon} />
			<BadgeText className="text-[10px] font-semibold">SUPORTE</BadgeText>
		</Badge>
	);
}
