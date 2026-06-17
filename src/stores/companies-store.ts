import { create } from "zustand";
import type {
	Company,
	CompanyAddress,
	CompanyBusinessHour,
	CompanyService,
	CompanyWaste,
} from "@/libs/types/companies";

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
		businessHours: CompanyBusinessHour[],
	) => void;
	updateServices: (companyId: string, services: CompanyService[]) => void;
	updateWastes: (companyId: string, wastes: CompanyWaste[]) => void;
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
