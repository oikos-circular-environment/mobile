import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import {
	type BusinessHoursFormValues,
	businessHoursFormSchema,
} from "@/components/companies/business-hours/business-hours-form-schema";
import { DayBusinessHourField } from "@/components/companies/business-hours/day-business-hour-field";
import { BusinessHoursSkeleton } from "@/components/companies/skeletons";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Heading } from "@/components/ui/heading";
import { useUserCompanyContext } from "@/contexts/user-company-context";
import { daysOfWeek, defaultBusinessHours } from "@/libs/types/business-hour";

type DayOfWeek =
	| "SUNDAY"
	| "MONDAY"
	| "TUESDAY"
	| "WEDNESDAY"
	| "THURSDAY"
	| "FRIDAY"
	| "SATURDAY";

export default function CompanyBusinessHoursScreen() {
	const {
		businessHours,
		isLoadingBusinessHours,
		saveBusinessHours,
		isSavingBusinessHours,
	} = useUserCompanyContext();

	const {
		control,
		handleSubmit,
		watch,
		reset,
		formState: { errors, isDirty },
	} = useForm<BusinessHoursFormValues>({
		resolver: zodResolver(businessHoursFormSchema),
		defaultValues: {
			businessHours: defaultBusinessHours,
		},
	});

	const businessHoursWatch = watch("businessHours");

	useEffect(() => {
		if (businessHours === undefined) return;

		if (businessHours.length > 0) {
			reset({
				businessHours: businessHours.map(bh => ({
					id: bh.id,
					dayOfWeek: bh.day_of_week,
					is_open: bh.is_open,
					timeSlots: bh.time_slots.map(ts => ({
						id: ts.id,
						startTime: ts.start_time,
						endTime: ts.end_time,
					})),
				})),
			});
		} else {
			reset({ businessHours: defaultBusinessHours });
		}
	}, [businessHours, reset]);

	const onSubmit = async (data: BusinessHoursFormValues) => {
		try {
			await saveBusinessHours({
				business_hours: data.businessHours.map(bh => ({
					day_of_week: bh.dayOfWeek as DayOfWeek,
					is_open: bh.is_open,
					time_slots: bh.timeSlots.map(ts => ({
						start_time: ts.startTime,
						end_time: ts.endTime,
					})),
				})),
			});
		} catch {
			// handled by context mutation's onError
		}
	};

	const getDayLabel = (dayOfWeek: string) => {
		return daysOfWeek.find(day => day.value === dayOfWeek)?.label || dayOfWeek;
	};

	if (isLoadingBusinessHours) {
		return <BusinessHoursSkeleton />;
	}

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
						<Button
							variant="outline"
							className="flex-1"
							onPress={() => reset()}
							isDisabled={!isDirty || isSavingBusinessHours}
						>
							<ButtonText>Cancelar</ButtonText>
						</Button>
						<Button
							className="flex-1"
							onPress={handleSubmit(onSubmit)}
							isDisabled={!isDirty || isSavingBusinessHours}
						>
							<ButtonText>Salvar</ButtonText>
							{isSavingBusinessHours && <ButtonIcon as={Spinner} />}
						</Button>
					</View>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}
