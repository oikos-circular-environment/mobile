import { Heading } from "@/components/ui/heading";
import { cn } from "@/libs/utils";

interface SurveyInviteCardTitleProps {
	children: React.ReactNode;
	className?: string;
}

export function SurveyInviteCardTitle({
	children,
	className,
}: SurveyInviteCardTitleProps) {
	return (
		<Heading size="lg" className={cn("text-white", className)}>
			{children}
		</Heading>
	);
}
