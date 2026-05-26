import { ScrollView, View } from "react-native";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";

type RadiusToggleProps = {
	value: string;
	onChange: (value: string) => void;
};

const radiusOptions = Array.from({ length: 39 }, (_, i) => {
	const meters = 1000 + i * 500;
	const km = meters / 1000;
	const label = Number.isInteger(km)
		? `${km} km`
		: `${km.toFixed(1).replace(".", ",")} km`;

	return { value: String(meters), label };
});

export function RadiusToggle({ value, onChange }: RadiusToggleProps) {
	return (
		<ScrollView
			horizontal
			showsHorizontalScrollIndicator={false}
			contentContainerClassName="gap-2 pr-4"
		>
			{radiusOptions.map(option => {
				const isActive = value === option.value;

				return (
					<Pressable
						key={option.value}
						className={`rounded-md px-4 py-2 ${isActive ? "bg-lime-800" : "bg-gray-100"}`}
						onPress={() => onChange(option.value)}
					>
						<Text
							className={`text-xs font-semibold ${isActive ? "text-white" : "text-gray-700"}`}
						>
							{option.label}
						</Text>
					</Pressable>
				);
			})}
			<View />
		</ScrollView>
	);
}
