import { Trash2 } from "lucide-react-native";
import { type Control, Controller, type FieldErrors } from "react-hook-form";
import { View } from "react-native";
import type { BusinessHoursFormValues } from "@/components/companies/business-hours/business-hours-form-schema";
import { Button, ButtonIcon } from "@/components/ui/button";
import {
  FormControl,
  FormControlError,
  FormControlErrorText,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/form-control";
import { Input, InputField } from "@/components/ui/input";

type TimeSlotFieldProps = {
  dayIndex: number;
  slotIndex: number;
  control: Control<BusinessHoursFormValues>;
  errors: FieldErrors<BusinessHoursFormValues>;
  onRemove: () => void;
  showRemoveButton: boolean;
};

export function TimeSlotField({
  dayIndex,
  slotIndex,
  control,
  errors,
  onRemove,
  showRemoveButton,
}: TimeSlotFieldProps) {
  const startTimeFieldName =
    `businessHours.${dayIndex}.timeSlots.${slotIndex}.startTime` as const;
  const endTimeFieldName =
    `businessHours.${dayIndex}.timeSlots.${slotIndex}.endTime` as const;

  return (
    <View className="gap-2">
      <View className="flex-row gap-2 items-end">
        <FormControl
          isInvalid={
            !!errors?.businessHours?.[dayIndex]?.timeSlots?.[slotIndex]
              ?.startTime
          }
          className="flex-1 gap-1"
        >
          <FormControlLabel>
            <FormControlLabelText className="text-xs">
              Início
            </FormControlLabelText>
          </FormControlLabel>
          <Controller
            control={control}
            name={startTimeFieldName}
            render={({ field: { onChange, value } }) => (
              <Input>
                <InputField
                  value={value}
                  onChangeText={text => onChange(formatTimeInput(text))}
                  placeholder="HH:mm"
                  maxLength={5}
                  keyboardType="decimal-pad"
                />
              </Input>
            )}
          />
          {errors?.businessHours?.[dayIndex]?.timeSlots?.[slotIndex]?.startTime
            ?.message && (
            <FormControlError>
              <FormControlErrorText className="text-xs">
                {
                  errors.businessHours?.[dayIndex]?.timeSlots?.[slotIndex]
                    ?.startTime?.message as string
                }
              </FormControlErrorText>
            </FormControlError>
          )}
        </FormControl>

        <FormControl
          isInvalid={
            !!errors?.businessHours?.[dayIndex]?.timeSlots?.[slotIndex]?.endTime
          }
          className="flex-1 gap-1"
        >
          <FormControlLabel>
            <FormControlLabelText className="text-xs">Fim</FormControlLabelText>
          </FormControlLabel>
          <Controller
            control={control}
            name={endTimeFieldName}
            render={({ field: { onChange, value } }) => (
              <Input>
                <InputField
                  value={value}
                  onChangeText={text => onChange(formatTimeInput(text))}
                  placeholder="HH:mm"
                  maxLength={5}
                  keyboardType="decimal-pad"
                />
              </Input>
            )}
          />
          {errors?.businessHours?.[dayIndex]?.timeSlots?.[slotIndex]?.endTime
            ?.message && (
            <FormControlError>
              <FormControlErrorText className="text-xs">
                {
                  errors.businessHours?.[dayIndex]?.timeSlots?.[slotIndex]
                    ?.endTime?.message as string
                }
              </FormControlErrorText>
            </FormControlError>
          )}
        </FormControl>

        {showRemoveButton && (
          <Button
            size="sm"
            variant="destructive"
            onPress={onRemove}
            className="mb-0"
          >
            <ButtonIcon as={Trash2} size="sm" />
          </Button>
        )}
      </View>
    </View>
  );
}

function formatTimeInput(text: string): string {
  const cleaned = text.replace(/[^\d]/g, "");
  if (cleaned.length <= 2) return cleaned;
  if (cleaned.length <= 4) return `${cleaned.slice(0, 2)}:${cleaned.slice(2)}`;
  return `${cleaned.slice(0, 2)}:${cleaned.slice(2, 4)}`;
}
