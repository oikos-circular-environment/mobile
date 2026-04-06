import { XIcon } from "lucide-react-native";
import { View } from "react-native";
import { Badge, BadgeText } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import {
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
} from "@/components/ui/modal";
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
      <ModalContent className="gap-3">
        <ModalHeader>
          <Heading size="md" className="text-base text-gray-950">
            Horários de funcionamento
          </Heading>

          <ModalCloseButton onPress={onClose}>
            <XIcon size={16} />
          </ModalCloseButton>
        </ModalHeader>

        <ModalBody>
          <View className="flex flex-col gap-2">
            {businessHours?.map(day => (
              <Card key={day.id} className="shadow-none">
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm font-semibold text-gray-900">
                    {getDayLabel(day.dayOfWeek)}
                  </Text>
                  <View>
                    {day.timeSlots.length ? (
                      <View className="mt-1 gap-0.5">
                        {day.timeSlots.map(slot => (
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
            ))}
          </View>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
