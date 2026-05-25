import { addDays, getDay, isBefore, isWithinInterval, parse } from "date-fns";
import type { MarketBusinessHour, MarketTimeSlot } from "@/libs/types/market";

const dayOfWeekByIndex = [
	"SUNDAY",
	"MONDAY",
	"TUESDAY",
	"WEDNESDAY",
	"THURSDAY",
	"FRIDAY",
	"SATURDAY",
] as const;

const isTimeInsideSlot = (currentDate: Date, slot: MarketTimeSlot) => {
	const slotStart = parse(slot.start_time, "HH:mm", currentDate);
	const parsedSlotEnd = parse(slot.end_time, "HH:mm", currentDate);

	if (
		Number.isNaN(slotStart.getTime()) ||
		Number.isNaN(parsedSlotEnd.getTime())
	) {
		return false;
	}

	const slotEnd = isBefore(parsedSlotEnd, slotStart)
		? addDays(parsedSlotEnd, 1)
		: parsedSlotEnd;

	return isWithinInterval(currentDate, { start: slotStart, end: slotEnd });
};

export const getCurrentBusinessHour = (
	businessHours: MarketBusinessHour[],
	currentDate: Date,
): MarketBusinessHour | null => {
	const currentDayOfWeek = dayOfWeekByIndex[getDay(currentDate)];
	return businessHours.find(h => h.day_of_week === currentDayOfWeek) ?? null;
};

export const isCompanyOpenNow = (
	businessHours: MarketBusinessHour[],
	currentDate: Date,
): boolean => {
	const todayHours = getCurrentBusinessHour(businessHours, currentDate);

	return Boolean(
		todayHours?.is_open &&
			todayHours.time_slots.some(slot => isTimeInsideSlot(currentDate, slot)),
	);
};
