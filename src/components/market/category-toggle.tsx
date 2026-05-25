import { View } from "react-native";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import type { MarketFilterValues } from "@/contexts/market-context";

type CategoryToggleProps = {
	value: MarketFilterValues["category"];
	onChange: (value: MarketFilterValues["category"]) => void;
};

const options: { label: string; value: NonNullable<MarketFilterValues["category"]> }[] = [
	{ label: "Resíduos", value: "waste" },
	{ label: "Serviços", value: "services" },
];

export function CategoryToggle({ value, onChange }: CategoryToggleProps) {
	return (
		<View className="flex-row gap-2">
			{options.map(option => {
				const isActive = value === option.value;

				return (
					<Pressable
						key={option.value}
						className={`rounded-md px-4 py-2 ${isActive ? "bg-lime-800" : "bg-gray-100"}`}
						onPress={() => onChange(isActive ? undefined : option.value)}
					>
						<Text
							className={`text-xs font-semibold ${isActive ? "text-white" : "text-gray-700"}`}
						>
							{option.label}
						</Text>
					</Pressable>
				);
			})}
		</View>
	);
}
