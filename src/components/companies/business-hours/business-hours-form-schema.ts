import { z } from "zod";

export const timeSlotSchema = z.object({
  id: z.string(),
  startTime: z
    .string()
    .regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, "Horário inválido"),
  endTime: z
    .string()
    .regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, "Horário inválido"),
});

export const businessHourSchema = z.object({
  id: z.string(),
  dayOfWeek: z.string(),
  is_open: z.boolean(),
  timeSlots: z.array(timeSlotSchema).max(2, "Máximo 2 horários por dia"),
});

export const businessHoursFormSchema = z.object({
  businessHours: z.array(businessHourSchema),
});

export type BusinessHoursFormValues = z.infer<typeof businessHoursFormSchema>;
