import { Plus } from "lucide-react-native";
import {
	type Control,
	Controller,
	type FieldErrors,
	useFieldArray,
} from "react-hook-form";
import { View } from "react-native";
import type { BusinessHoursFormValues } from "@/components/companies/business-hours/business-hours-form-schema";
import { TimeSlotField } from "@/components/companies/business-hours/time-slot-field";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Text } from "@/components/ui/text";

type DayBusinessHourFieldProps = {
	dayIndex: number;
	dayLabel: string;
	control: Control<BusinessHoursFormValues>;
	errors: FieldErrors<BusinessHoursFormValues>;
};

export function DayBusinessHourField({
	dayIndex,
	dayLabel,
	control,
	errors,
}: DayBusinessHourFieldProps) {
	const { fields, append, remove } = useFieldArray({
		control,
		name: `businessHours.${dayIndex}.timeSlots`,
	});

	const isOpenField = `businessHours.${dayIndex}.is_open` as const;

	return (
		<Controller
			control={control}
			name={isOpenField}
			render={({ field: { value: isOpen, onChange } }) => (
				<View className="border border-border rounded-lg p-4 gap-3">
					<View className="flex-row items-center justify-between">
						<Text className="font-semibold text-base">{dayLabel}</Text>
						<Switch
							value={isOpen}
							onValueChange={onChange}
							trackColor={{ false: "#d1d5db", true: "#3f6212" }}
						/>
					</View>

					{isOpen && (
						<View className="gap-3">
							{fields.length === 0 ? (
								<Text className="text-sm text-muted-foreground italic">
									Fechado
								</Text>
							) : (
								fields.map((field, slotIndex) => (
									<TimeSlotField
										key={field.id}
										dayIndex={dayIndex}
										slotIndex={slotIndex}
										control={control}
										errors={errors}
										onRemove={() => remove(slotIndex)}
										showRemoveButton={fields.length > 1}
									/>
								))
							)}

							{fields.length < 2 && (
								<Button
									variant="outline"
									onPress={() =>
										append({
											id: `${Date.now()}-${Math.random()}`,
											startTime: "09:00",
											endTime: "17:00",
										})
									}
									className="gap-2"
								>
									<ButtonIcon as={Plus} size="sm" />
									<ButtonText>Adicionar horário</ButtonText>
								</Button>
							)}
						</View>
					)}
				</View>
			)}
		/>
	);
}
