import { CheckIcon } from "lucide-react-native";
import {
	forwardRef,
	useEffect,
	useImperativeHandle,
	useRef,
	useState,
} from "react";
import { Pressable } from "react-native";
import {
	BottomSheet,
	BottomSheetBackdrop,
	BottomSheetDragIndicator,
	BottomSheetPortal,
	type BottomSheetRef,
	BottomSheetScrollView,
} from "@/components/ui/bottomsheet";
import { Text } from "@/components/ui/text";
import { useMarket } from "@/contexts/market-context";
import { cn } from "@/libs/utils";
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

export interface RadiusBottomSheetRef {
	open: () => void;
	close: () => void;
}

export const RadiusBottomSheet = forwardRef<RadiusBottomSheetRef>(
	function RadiusBottomSheet(_props, ref) {
		const { appliedFilters, setAppliedFilters } = useMarket();
		const [isOpen, setIsOpen] = useState(false);
		const sheetRef = useRef<BottomSheetRef>(null);

		const [localRadius, setLocalRadius] = useState(appliedFilters.radius);

		useEffect(() => {
			if (isOpen) {
				setLocalRadius(appliedFilters.radius);
				sheetRef.current?.open();
			} else {
				sheetRef.current?.close();
			}
		}, [isOpen, appliedFilters]);

		useImperativeHandle(ref, () => ({
			open: () => setIsOpen(true),
			close: () => setIsOpen(false),
		}));

		return (
			<BottomSheet ref={sheetRef} onClose={() => setIsOpen(false)}>
				<BottomSheetPortal
					snapPoints={["50%"]}
					backdropComponent={BottomSheetBackdrop}
					handleComponent={BottomSheetDragIndicator}
				>
					<BottomSheetScrollView contentContainerClassName="pb-12">
						<VStack className="gap-2 p-4">
							{radiusOptions.map(option => {
								const isSelected = localRadius === option.value;
								return (
									<Pressable
										key={option.value}
										className={`flex-row items-center justify-between p-3 rounded-xl ${
											isSelected
												? "bg-primary"
												: "bg-background border border-border"
										}`}
										onPress={() => {
											setLocalRadius(option.value);
											setAppliedFilters({
												...appliedFilters,
												radius: option.value,
											});
											setIsOpen(false);
										}}
									>
										<Text
											className={cn(isSelected && "text-primary-foreground")}
										>
											{option.label}
										</Text>
										{isSelected && <CheckIcon size={16} color={colors.white} />}
									</Pressable>
								);
							})}
						</VStack>
					</BottomSheetScrollView>
				</BottomSheetPortal>
			</BottomSheet>
		);
	},
);
