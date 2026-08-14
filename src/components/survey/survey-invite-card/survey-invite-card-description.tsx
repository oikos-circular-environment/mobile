import { Text } from "@/components/ui/text";
import { cn } from "@/libs/utils";

interface SurveyInviteCardDescriptionProps {
	children: React.ReactNode;
	className?: string;
}

export function SurveyInviteCardDescription({
	children,
	className,
}: SurveyInviteCardDescriptionProps) {
	return (
		<Text size="sm" className={cn("leading-5 text-white/80", className)}>
			{children}
		</Text>
	);
}
