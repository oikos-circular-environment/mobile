import { LocateOffIcon, SettingsIcon } from "lucide-react-native";
import { Linking, View } from "react-native";
import { Alert, AlertIcon, AlertText } from "@/components/ui/alert";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { cn } from "@/libs/utils";
import { VStack } from "./ui/vstack";
import { HStack } from "./ui/hstack";

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
				"border-red-200 bg-red-50 items-center",
				className,
			)}
		>
			<HStack className="flex-1 items-start gap-2">
				<AlertIcon as={LocateOffIcon} className="text-red-500" />
				<View className="flex-1 gap-1">
					<AlertText className="font-semibold ">{title}</AlertText>
					<Text className="text-xs ">{message}</Text>
				</View>
				</HStack>
			<Button
				variant="destructive"
				size="icon"
				className="bg-red-500"
				onPress={() => Linking.openSettings()}
				>
				<ButtonIcon as={SettingsIcon} />
			</Button>
		</Alert>
	);
}
