import { create } from "zustand";
import type { GetV1CompaniesResponses } from "@/libs/oikos-sdk";

export type Company = GetV1CompaniesResponses[200]["companies"][number];
export type CompanyAddress = Company["address"];
export type CompanyBusinessHour = Company["business_hours"][number];
export type CompanyService = Company["services"][number];
export type CompanyWaste = Company["wastes"][number];

type CompanyBasicFields = Omit<
	Company,
	"address" | "business_hours" | "services" | "wastes"
>;

type CompaniesState = {
	companies: Company[];
	isLoaded: boolean;
};

type CompaniesActions = {
	setCompanies: (companies: Company[]) => void;
	addCompany: (company: CompanyBasicFields) => void;
	updateCompany: (id: string, patch: Partial<CompanyBasicFields>) => void;
	updateAddress: (companyId: string, address: CompanyAddress) => void;
	updateBusinessHours: (
		companyId: string,
		businessHours: Company["business_hours"],
	) => void;
	updateServices: (
		companyId: string,
		services: Company["services"],
	) => void;
	updateWastes: (companyId: string, wastes: Company["wastes"]) => void;
};

export const useCompaniesStore = create<CompaniesState & CompaniesActions>(
	set => ({
		companies: [],
		isLoaded: false,

		setCompanies: companies => set({ companies, isLoaded: true }),

		addCompany: company =>
			set(state => ({
				companies: [
					...state.companies,
					{
						...company,
						address: null,
						business_hours: [],
						services: [],
						wastes: [],
					},
				],
			})),

		updateCompany: (id, patch) =>
			set(state => ({
				companies: state.companies.map(c =>
					c.id === id ? { ...c, ...patch } : c,
				),
			})),

		updateAddress: (companyId, address) =>
			set(state => ({
				companies: state.companies.map(c =>
					c.id === companyId ? { ...c, address } : c,
				),
			})),

		updateBusinessHours: (companyId, businessHours) =>
			set(state => ({
				companies: state.companies.map(c =>
					c.id === companyId ? { ...c, business_hours: businessHours } : c,
				),
			})),

		updateServices: (companyId, services) =>
			set(state => ({
				companies: state.companies.map(c =>
					c.id === companyId ? { ...c, services } : c,
				),
			})),

		updateWastes: (companyId, wastes) =>
			set(state => ({
				companies: state.companies.map(c =>
					c.id === companyId ? { ...c, wastes } : c,
				),
			})),
	}),
);
