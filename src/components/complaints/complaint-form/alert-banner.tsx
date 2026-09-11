import { AlertTriangleIcon, InfoIcon } from "lucide-react-native";
import { Alert, AlertIcon, AlertText } from "@/components/ui/alert";
import { cn } from "@/libs/utils";

export type ComplaintAlertBannerVariant = "info" | "warning";

export type ComplaintAlertBannerProps = {
	variant: ComplaintAlertBannerVariant;
	className?: string;
};

const COPY: Record<ComplaintAlertBannerVariant, string> = {
	info: "Deixe a comunidade saber quem resolveu e como resolveu, assim conseguimos inspirar voluntários e órgãos competentes a ajudarem na solução de um ambiente mais limpo e seguro.",
	warning:
		"As resoluções serão públicas, utilize este local apenas para postagens íntegras que levarão à resolução da denúncia.",
};

export function ComplaintAlertBanner({
	variant,
	className,
}: ComplaintAlertBannerProps) {
	const isWarning = variant === "warning";

	return (
		<Alert
			variant={isWarning ? "warning" : undefined}
			className={cn(
				"flex-row items-start gap-2 rounded-lg border p-3",
				!isWarning && "border-sky-700 bg-sky-50",
				className,
			)}
		>
			<AlertIcon
				as={isWarning ? AlertTriangleIcon : InfoIcon}
				className={isWarning ? undefined : "text-sky-700"}
			/>
			<AlertText className={cn("flex-1", !isWarning && "text-sky-700")}>
				{COPY[variant]}
			</AlertText>
		</Alert>
	);
}
