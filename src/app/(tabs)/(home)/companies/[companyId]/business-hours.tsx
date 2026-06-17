import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Clock8Icon } from "lucide-react-native";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import {
	type BusinessHoursFormValues,
	businessHoursFormSchema,
} from "@/components/companies/business-hours/business-hours-form-schema";
import { DayBusinessHourField } from "@/components/companies/business-hours/day-business-hour-field";
import { useSaveBusinessHours } from "@/components/companies/hooks/use-save-business-hours";
import { BusinessHoursSkeleton } from "@/components/companies/skeletons";
import { colors } from "@/components/style/colors";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { type DayOfWeek, daysOfWeek } from "@/libs/types/business-hour";
import { useCompaniesStore } from "@/stores/companies-store";

const defaultBusinessHours: BusinessHoursFormValues["businessHours"] = [
	{
		id: "0d900658-838a-4a33-ab8d-689dd79f0a5b",
		dayOfWeek: "SUNDAY",
		timeSlots: [],
		is_open: false,
	},
	{
		id: "0d900658-838a-4a33-ab8d-689dd79f0a5c",
		dayOfWeek: "MONDAY",
		timeSlots: [
			{
				id: "0d900658-838a-4a33-ab8d-689dd79f0a5c",
				startTime: "07:00",
				endTime: "11:00",
			},
			{
				id: "0d900658-838a-4a33-ab8d-689dd79f0a5d",
				startTime: "13:00",
				endTime: "17:30",
			},
		],
		is_open: false,
	},
	{
		id: "0d900658-838a-4a33-ab8d-689dd79f0a5d",
		dayOfWeek: "TUESDAY",
		timeSlots: [
			{
				id: "0d900658-838a-4a33-ab8d-689dd79f0a5c",
				startTime: "07:00",
				endTime: "17:30",
			},
		],
		is_open: false,
	},
	{
		id: "0d900658-838a-4a33-ab8d-689dd79f0a5e",
		dayOfWeek: "WEDNESDAY",
		timeSlots: [
			{
				id: "0d900658-838a-4a33-ab8d-689dd79f0a5c",
				startTime: "07:00",
				endTime: "17:30",
			},
		],
		is_open: false,
	},
	{
		id: "0d900658-838a-4a33-ab8d-689dd79f0a5f",
		dayOfWeek: "THURSDAY",
		timeSlots: [
			{
				id: "0d900658-838a-4a33-ab8d-689dd79f0a5c",
				startTime: "07:00",
				endTime: "17:30",
			},
		],
		is_open: false,
	},
	{
		id: "0d900658-838a-4a33-ab8d-689dd79f0a5g",
		dayOfWeek: "FRIDAY",
		timeSlots: [
			{
				id: "0d900658-838a-4a33-ab8d-689dd79f0a5c",
				startTime: "07:00",
				endTime: "17:00",
			},
		],
		is_open: false,
	},
	{
		id: "0d900658-838a-4a33-ab8d-689dd79f0a5h",
		dayOfWeek: "SATURDAY",
		timeSlots: [
			{
				id: "0d900658-838a-4a33-ab8d-689dd79f0a5c",
				startTime: "07:00",
				endTime: "12:00",
			},
		],
		is_open: false,
	},
];

export default function CompanyBusinessHoursScreen() {
	const router = useRouter();
	const { companyId } = useLocalSearchParams<{ companyId: string }>();
	const company = useCompaniesStore(s =>
		s.companies.find(c => c.id === companyId),
	);
	const businessHours = company?.business_hours;
	const isLoadingBusinessHours = useCompaniesStore(s => !s.isLoaded);
	const { mutateAsync: saveBusinessHours, isPending: isSavingBusinessHours } =
		useSaveBusinessHours(companyId);

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

		router.back();
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
					<Card className="bg-secondary shadow-none">
						<View className="flex-row items-center justify-between gap-4">
							<View className="size-15 items-center justify-center rounded-lg bg-primary">
								<Clock8Icon color={colors.white} size={20} />
							</View>
							<View className="flex-1 gap-1">
								<Heading className="text-lg">Horário de Funcionamento</Heading>
								<Text className="text-sm ">
									Estes dados serão expostos na plataforma, o preenchimento com
									informações reais trazem mais confiabilidade para os usuários
									da plataforma.
								</Text>
							</View>
						</View>
					</Card>

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
							testID="btn-cancel"
							variant="outline"
							className="flex-1"
							onPress={() => reset()}
							isDisabled={!isDirty || isSavingBusinessHours}
						>
							<ButtonText>Cancelar</ButtonText>
						</Button>
						<Button
							testID="btn-save"
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
