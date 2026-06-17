import type { GetV1MarketResponses } from "@/libs/oikos-sdk";

export type MarketCompany = GetV1MarketResponses[200]["companies"][number];
export type MarketBusinessHour = MarketCompany["business_hours"][number];
export type MarketTimeSlot = MarketBusinessHour["time_slots"][number];
export type MarketCompanyService = MarketCompany["services"][number];
export type MarketCompanyWaste = MarketCompany["wastes"][number];
