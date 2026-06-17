import { faker } from "@faker-js/faker";
import type { DayOfWeek } from "@/libs/types/business-hour";
import type { MarketCompany } from "@/libs/types/market";

const DAYS: DayOfWeek[] = [
	"SUNDAY",
	"MONDAY",
	"TUESDAY",
	"WEDNESDAY",
	"THURSDAY",
	"FRIDAY",
	"SATURDAY",
];

export function makeBusinessHours(): MarketCompany["business_hours"] {
	return DAYS.map(day => ({
		id: faker.string.uuid(),
		day_of_week: day,
		is_open: day !== "SUNDAY",
		time_slots:
			day !== "SUNDAY"
				? [{ id: faker.string.uuid(), start_time: "08:00", end_time: "17:00" }]
				: [],
	}));
}
