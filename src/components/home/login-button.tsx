import { ArrowRightIcon } from "lucide-react-native";
import { Pressable } from "react-native";
import { colors } from "@/components/style/colors";
import { Text } from "@/components/ui/text";

interface LoginButtonProps {
	label?: string;
	onPress: () => void;
}

export function LoginButton({
	label = "Iniciar sessão",
	onPress,
}: LoginButtonProps) {
	return (
		<Pressable
			onPress={onPress}
			className="h-16 flex-row items-center justify-between rounded-xl border border-white/40 bg-white/25 px-5 shadow-sm active:opacity-90"
		>
			<Text bold className="text-gray-800">
				{label}
			</Text>
			<ArrowRightIcon size={20} color={colors.lime[800]} />
		</Pressable>
	);
}
