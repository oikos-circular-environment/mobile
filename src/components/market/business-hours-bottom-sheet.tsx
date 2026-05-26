import { useEffect, useRef } from "react";
import { View } from "react-native";
import { Badge, BadgeText } from "@/components/ui/badge";
import {
	BottomSheet,
	BottomSheetBackdrop,
	BottomSheetDragIndicator,
	BottomSheetPortal,
	type BottomSheetRef,
	BottomSheetScrollView,
} from "@/components/ui/bottomsheet";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { daysOfWeek } from "@/libs/types/business-hour";
import type { MarketBusinessHour } from "@/libs/types/market";

type BusinessHoursBottomSheetProps = {
	isOpen: boolean;
	onClose: () => void;
	businessHours: MarketBusinessHour[] | null;
};

const getDayLabel = (day: string) =>
	daysOfWeek.find(item => item.value === day)?.label ?? "Dia não informado";

export function BusinessHoursBottomSheet({
	isOpen,
	onClose,
	businessHours,
}: BusinessHoursBottomSheetProps) {
	const ref = useRef<BottomSheetRef>(null);

	useEffect(() => {
		if (isOpen) {
			ref.current?.open();
		} else {
			ref.current?.close();
		}
	}, [isOpen]);

	return (
		<BottomSheet ref={ref} onClose={onClose}>
			<BottomSheetPortal
				snapPoints={["60%"]}
				backdropComponent={BottomSheetBackdrop}
				handleComponent={BottomSheetDragIndicator}
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
							<Card key={item.id} className="shadow-none">
								<View className="flex-row items-center justify-between">
									<Text className="text-sm font-semibold text-gray-900">
										{getDayLabel(item.day_of_week)}
									</Text>
									<View>
										{item.time_slots.length ? (
											<View className="items-end gap-0.5">
												{item.time_slots.map(slot => (
													<Text key={slot.id} className="text-xs text-gray-700">
														{slot.start_time} - {slot.end_time}
													</Text>
												))}
											</View>
										) : (
											<Badge variant="destructive">
												<BadgeText>Fechado</BadgeText>
											</Badge>
										)}
									</View>
								</View>
							</Card>
						))}
					</View>
				</BottomSheetScrollView>
			</BottomSheetPortal>
		</BottomSheet>
	);
}
