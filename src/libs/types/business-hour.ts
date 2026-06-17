import type { CompanyBusinessHour } from "./companies";

export type BusinessHour = CompanyBusinessHour;
export type TimeSlot = BusinessHour["time_slots"][number];
export type DayOfWeek = BusinessHour["day_of_week"];

export const daysOfWeek: { value: DayOfWeek; label: string }[] = [
	{ value: "SUNDAY", label: "Domingo" },
	{ value: "MONDAY", label: "Segunda-feira" },
	{ value: "TUESDAY", label: "Terça-feira" },
	{ value: "WEDNESDAY", label: "Quarta-feira" },
	{ value: "THURSDAY", label: "Quinta-feira" },
	{ value: "FRIDAY", label: "Sexta-feira" },
	{ value: "SATURDAY", label: "Sábado" },
];
