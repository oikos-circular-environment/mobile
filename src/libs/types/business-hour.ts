export type DayOfWeek = 
  | "SUNDAY"
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"

export type TimeSlot = {
  id: string;
  startTime: string; // Horário de início, formato "HH:mm"
  endTime: string; // Horário de fim, formato "HH:mm"
}

export type BusinessHour = {
  id: string;
  dayOfWeek: DayOfWeek;
  timeSlots: TimeSlot[];
}

export const daysOfWeek: { value: DayOfWeek; label: string }[] = [
  { value: "SUNDAY", label: "Domingo" },
  { value: "MONDAY", label: "Segunda-feira" },
  { value: "TUESDAY", label: "Terça-feira" },
  { value: "WEDNESDAY", label: "Quarta-feira" },
  { value: "THURSDAY", label: "Quinta-feira" },
  { value: "FRIDAY", label: "Sexta-feira" },
  { value: "SATURDAY", label: "Sábado" },
];
