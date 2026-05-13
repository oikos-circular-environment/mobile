import { Check } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";

interface FlagCardProps {
	label: string;
	isChecked: boolean;
	onChange: (checked: boolean) => void;
}

export function FlagCard({ label, isChecked, onChange }: FlagCardProps) {
	return (
		<Pressable onPress={() => onChange(!isChecked)}>
			<Card className="shadow-none p-3 flex-row items-center gap-3">
				<View
					className={`size-4 rounded border-2 items-center justify-center ${
						isChecked ? "bg-lime-800 border-lime-800" : "border-zinc-300"
					}`}
				>
					{isChecked && <Check size={10} color="white" />}
				</View>
				<Text className="flex-1">{label}</Text>
			</Card>
		</Pressable>
	);
}
