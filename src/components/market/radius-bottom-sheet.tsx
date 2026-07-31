import BottomSheet, {
	BottomSheetBackdrop,
	type BottomSheetBackdropProps,
	BottomSheetView,
} from "@gorhom/bottom-sheet";
import { CheckIcon } from "lucide-react-native";
import { useCallback } from "react";
import { Pressable } from "react-native";
import { Text } from "@/components/ui/text";
import { useMarket } from "@/contexts/market-context";
import { colors } from "../style/colors";
import { VStack } from "../ui/vstack";

const radiusOptions = [
	{ value: "2000", label: "2 km" },
	{ value: "5000", label: "5 km" },
	{ value: "10000", label: "10 km" },
	{ value: "15000", label: "15 km" },
	{ value: "20000", label: "20 km" },
	{ value: "30000", label: "30 km" },
	{ value: "40000", label: "40 km" },
] as const;

export function formatRadiusLabel(value: string) {
	const km = Number(value) / 1000;
	return `${km} km`;
}

function RadiusOption({
	value,
	label,
	isSelected,
	onSelect,
}: {
	value: string;
	label: string;
	isSelected: boolean;
	onSelect: (value: string) => void;
}) {
	return (
		<Pressable
			className={`flex-row items-center justify-between p-3 rounded-xl ${
				isSelected ? "bg-primary" : "bg-background border border-border"
			}`}
			onPress={() => onSelect(value)}
			accessibilityLabel={`Raio de busca: ${label}${isSelected ? " (selecionado)" : ""}`}
		>
			<Text className={isSelected ? "text-primary-foreground" : undefined}>
				{label}
			</Text>
			{isSelected && <CheckIcon size={16} color={colors.white} />}
		</Pressable>
	);
}

export function RadiusBottomSheet() {
	const { appliedFilters, setAppliedFilters, radiusSheetRef } = useMarket();

	const backdropComponent = useCallback(
		(props: BottomSheetBackdropProps) => (
			<BottomSheetBackdrop
				{...props}
				appearsOnIndex={0}
				disappearsOnIndex={-1}
			/>
		),
		[],
	);

	return (
		<BottomSheet
			ref={radiusSheetRef}
			index={-1}
			snapPoints={["50%"]}
			enablePanDownToClose
			backdropComponent={backdropComponent}
		>
			<BottomSheetView>
				<VStack className="gap-2 p-4">
					{radiusOptions.map(option => (
						<RadiusOption
							key={option.value}
							value={option.value}
							label={option.label}
							isSelected={appliedFilters.radius === option.value}
							onSelect={value => {
								setAppliedFilters({
									...appliedFilters,
									radius: value,
								});
								radiusSheetRef.current?.close();
							}}
						/>
					))}
				</VStack>
			</BottomSheetView>
		</BottomSheet>
	);
}
