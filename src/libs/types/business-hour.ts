export type DayOfWeek =
	| "SUNDAY"
	| "MONDAY"
	| "TUESDAY"
	| "WEDNESDAY"
	| "THURSDAY"
	| "FRIDAY"
	| "SATURDAY";

export type TimeSlot = {
	id: string;
	startTime: string; // Horário de início, formato "HH:mm"
	endTime: string; // Horário de fim, formato "HH:mm"
};

export type BusinessHour = {
	id: string;
	dayOfWeek: DayOfWeek;
	timeSlots: TimeSlot[];
	is_open: boolean;
};

export const daysOfWeek: { value: DayOfWeek; label: string }[] = [
	{ value: "SUNDAY", label: "Domingo" },
	{ value: "MONDAY", label: "Segunda-feira" },
	{ value: "TUESDAY", label: "Terça-feira" },
	{ value: "WEDNESDAY", label: "Quarta-feira" },
	{ value: "THURSDAY", label: "Quinta-feira" },
	{ value: "FRIDAY", label: "Sexta-feira" },
	{ value: "SATURDAY", label: "Sábado" },
];

export const defaultBusinessHours: BusinessHour[] = [
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
