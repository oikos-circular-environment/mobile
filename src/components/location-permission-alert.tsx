import { LocateOffIcon } from "lucide-react-native";
import { Linking, View } from "react-native";
import { Alert, AlertIcon, AlertText } from "@/components/ui/alert";
import { Button, ButtonText } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { cn } from "@/libs/utils";

type LocationPermissionAlertProps = {
	title?: string;
	message: string;
	className?: string;
};

export function LocationPermissionAlert({
	title = "Localização indisponível",
	message,
	className,
}: LocationPermissionAlertProps) {
	return (
		<Alert
			className={cn(
				"flex-col items-stretch gap-3 rounded-lg border border-red-200 bg-red-50 p-3",
				className,
			)}
		>
			<View className="flex-row items-start gap-2">
				<AlertIcon as={LocateOffIcon} className="text-red-500" />
				<View className="flex-1 gap-1">
					<AlertText className="text-red-500">{title}</AlertText>
					<Text className="text-xs text-red-500/70">{message}</Text>
				</View>
			</View>
			<Button
				className="bg-lime-800 rounded-md"
				onPress={() => Linking.openSettings()}
			>
				<ButtonText>Abrir configurações</ButtonText>
			</Button>
		</Alert>
	);
}
