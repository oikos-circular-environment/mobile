import { FlatList, View } from "react-native";
import { Badge, BadgeText } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import {
	Modal,
	ModalBackdrop,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
} from "@/components/ui/modal";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { type BusinessHour, daysOfWeek } from "@/libs/types/business-hour";

type BusinessHoursModalProps = {
	isOpen: boolean;
	onClose: () => void;
	businessHours: BusinessHour[] | null;
};

const getDayLabel = (day: string) =>
	daysOfWeek.find(item => item.value === day)?.label ?? "Dia não informado";

export function BusinessHoursModal({
	isOpen,
	onClose,
	businessHours,
}: BusinessHoursModalProps) {
	return (
		<Modal isOpen={isOpen} onClose={onClose} useRNModal>
			<ModalBackdrop />
			<ModalContent className="gap-2">
				<ModalHeader className="flex-col items-start gap-1">
					<Heading size="md" className="text-base text-gray-950">
						Horários de funcionamento
					</Heading>

					<Text className="text-sm text-muted-foreground">
						Confira os horários de funcionamento da empresa para planejar sua
						visita.
					</Text>
				</ModalHeader>

				<ModalBody>
					<FlatList
						className="flex flex-col gap-2"
						data={businessHours}
						keyExtractor={item => item.id}
						renderItem={({ item }) => (
							<Card className="shadow-none mt-1 mb-1">
								<View className="flex-row items-center justify-between">
									<Text className="text-sm font-semibold text-gray-900">
										{getDayLabel(item.dayOfWeek)}
									</Text>
									<View>
										{item.timeSlots.length ? (
											<View className="mt-1 gap-0.5">
												{item.timeSlots.map(slot => (
													<Text key={slot.id} className="text-xs text-gray-700">
														{slot.startTime} - {slot.endTime}
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
						)}
					/>
				</ModalBody>
				<ModalFooter>
					<Pressable onPress={onClose} className="w-full">
						<Text>Fechar</Text>
					</Pressable>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}
