import BottomSheet, {
	BottomSheetBackdrop,
	type BottomSheetBackdropProps,
	BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { forwardRef, useCallback } from "react";
import { View } from "react-native";
import { Badge, BadgeText } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { daysOfWeek } from "@/libs/types/business-hour";
import type { MarketBusinessHour } from "@/libs/types/market";

type BusinessHoursBottomSheetProps = {
	businessHours: MarketBusinessHour[] | null;
};

const getDayLabel = (day: string) =>
	daysOfWeek.find(item => item.value === day)?.label ?? "Dia não informado";

export const BusinessHoursBottomSheet = forwardRef<
	BottomSheet,
	BusinessHoursBottomSheetProps
>(function BusinessHoursBottomSheet({ businessHours }, ref) {
	const backdropComponent = useCallback(
		(props: BottomSheetBackdropProps) => (
			<BottomSheetBackdrop
				{...props}
				appearsOnIndex={0}
				disappearsOnIndex={-1}
				pressBehavior="close"
			/>
		),
		[],
	);

	return (
		<BottomSheet
			ref={ref}
			index={-1}
			snapPoints={["60%"]}
			enablePanDownToClose
			backdropComponent={backdropComponent}
		>
			<BottomSheetScrollView
				contentContainerStyle={{
					gap: 16,
					paddingHorizontal: 16,
					paddingBottom: 32,
				}}
			>
				<View className="gap-1">
					<Heading size="md" className="text-base text-gray-950">
						Horários de funcionamento
					</Heading>
					<Text className="text-sm text-gray-500">
						Confira os horários de funcionamento para planejar sua visita.
					</Text>
				</View>
				<View className="gap-2">
					{(businessHours ?? []).map(item => (
						<Card key={item.id} className="shadow-none h-18 justify-center">
							<View className="flex-row items-center justify-between">
								<Text className="text-sm font-semibold text-gray-900">
									{getDayLabel(item.day_of_week)}
								</Text>
								<View>
									{!item.is_open || !item.time_slots.length ? (
										<Badge variant="destructive">
											<BadgeText>Fechado</BadgeText>
										</Badge>
									) : (
										<View className="items-end gap-0.5">
											{item.time_slots.map(slot => (
												<Text key={slot.id} className="text-xs text-gray-700">
													{slot.start_time} - {slot.end_time}
												</Text>
											))}
										</View>
									)}
								</View>
							</View>
						</Card>
					))}
				</View>
			</BottomSheetScrollView>
		</BottomSheet>
	);
});
