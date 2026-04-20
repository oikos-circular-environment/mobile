import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import {
  type BusinessHoursFormValues,
  businessHoursFormSchema,
} from "@/components/companies/business-hours/business-hours-form-schema";
import { DayBusinessHourField } from "@/components/companies/business-hours/day-business-hour-field";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { daysOfWeek, defaultBusinessHours } from "@/libs/types/business-hour";

export default function CompanyBusinessHoursScreen() {
  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<BusinessHoursFormValues>({
    resolver: zodResolver(businessHoursFormSchema),
    defaultValues: {
      businessHours: defaultBusinessHours,
    },
  });

  const businessHoursWatch = watch("businessHours");

  useEffect(() => {
    reset({ businessHours: defaultBusinessHours });
  }, [reset]);

  const onSubmit = (data: BusinessHoursFormValues) => {
    console.log("Business hours:", data);
  };

  const getDayLabel = (dayOfWeek: string) => {
    return daysOfWeek.find(day => day.value === dayOfWeek)?.label || dayOfWeek;
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        className="flex-1 bg-white"
        contentContainerClassName="p-4 pb-8"
      >
        <View className="gap-4">
          <Heading size="xl">Horários de Funcionamento</Heading>

          {businessHoursWatch.map((businessHour, dayIndex) => (
            <DayBusinessHourField
              key={businessHour.id}
              dayIndex={dayIndex}
              dayLabel={getDayLabel(businessHour.dayOfWeek)}
              control={control}
              errors={errors}
            />
          ))}

          <View className="flex-row gap-2 pt-4">
            <Button className="flex-1" onPress={handleSubmit(onSubmit)}>
              <ButtonText>Salvar</ButtonText>
            </Button>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
