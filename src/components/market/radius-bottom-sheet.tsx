import { CheckIcon, NavigationIcon } from "lucide-react-native";
import { useContext, useState } from "react";
import { Pressable } from "react-native";
import {
	BottomSheet,
	BottomSheetBackdrop,
	BottomSheetContext,
	BottomSheetDragIndicator,
	BottomSheetPortal,
	BottomSheetScrollView,
	BottomSheetTrigger,
} from "@/components/ui/bottomsheet";
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

function formatRadiusLabel(value: string) {
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
	const { handleClose } = useContext(BottomSheetContext);

	return (
		<Pressable
			className={`flex-row items-center justify-between p-3 rounded-xl ${
				isSelected ? "bg-primary" : "bg-background border border-border"
			}`}
			onPress={() => {
				onSelect(value);
				handleClose();
			}}
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
	const { appliedFilters, setAppliedFilters } = useMarket();
	const [localRadius, setLocalRadius] = useState(appliedFilters.radius);

	return (
		<BottomSheet>
			<BottomSheetTrigger className="flex-1 flex-row items-center justify-center gap-2">
				<NavigationIcon size={14} />
				<Text>{formatRadiusLabel(appliedFilters.radius)}</Text>
			</BottomSheetTrigger>
			<BottomSheetPortal
				snapPoints={["50%"]}
				backdropComponent={BottomSheetBackdrop}
				handleComponent={BottomSheetDragIndicator}
			>
				<BottomSheetScrollView contentContainerClassName="pb-12">
					<VStack className="gap-2 p-4">
						{radiusOptions.map(option => (
							<RadiusOption
								key={option.value}
								value={option.value}
								label={option.label}
								isSelected={localRadius === option.value}
								onSelect={value => {
									setLocalRadius(value);
									setAppliedFilters({
										...appliedFilters,
										radius: value,
									});
								}}
							/>
						))}
					</VStack>
				</BottomSheetScrollView>
			</BottomSheetPortal>
		</BottomSheet>
	);
}
