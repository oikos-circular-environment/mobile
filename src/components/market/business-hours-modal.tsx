import { CircleX } from "lucide-react-native";
import { View } from "react-native";
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
            Horários cadastrados
          </Heading>

          <ModalCloseButton onPress={onClose}>
            <CircleX size={16} color="#374151" />
          </ModalCloseButton>
        </ModalHeader>

        <ModalBody className="gap-2">
          {businessHours?.map(day => (
            <View
              key={day.id}
              className="rounded-md border border-gray-200 bg-gray-50 p-2"
            >
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-semibold text-gray-900">
                  {getDayLabel(day.dayOfWeek)}
                </Text>
                <Text
                  className={`text-xs font-semibold ${day.is_open ? "text-primary" : "text-red-500"}`}
                >
                  {day.is_open ? "Aberto" : "Fechado"}
                </Text>
              </View>

              {day.timeSlots.length ? (
                <View className="mt-1 gap-0.5">
                  {day.timeSlots.map(slot => (
                    <Text key={slot.id} className="text-xs text-gray-700">
                      {slot.startTime} - {slot.endTime}
                    </Text>
                  ))}
                </View>
              ) : (
                <Text className="mt-1 text-xs text-gray-500">
                  Sem atendimento neste dia.
                </Text>
              )}
            </View>
          ))}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
