import type { GetV1CompaniesResponses } from "@/libs/oikos-sdk";
import type { ValueMapping } from "./value-mapping";

export type Company = GetV1CompaniesResponses[200]["companies"][number];
export type CompanyType = Company["company_type"];
export type IdentityType = Company["identity_type"];
export type CompanyAddress = NonNullable<Company["address"]>;
export type CompanyBusinessHour = Company["business_hours"][number];
export type CompanyTimeSlot = CompanyBusinessHour["time_slots"][number];
export type CompanyWaste = Company["wastes"][number];
export type CompanyService = Company["services"][number];

export const companyTypeOptions: ValueMapping<CompanyType>[] = [
	{ value: "ONG", label: "ONG" },
	{ value: "COMPANY", label: "Empresa" },
	{ value: "GOVERNMENT", label: "Governo" },
	{ value: "COLLECTOR", label: "Coletor" },
];

export const identityTypeOptions: ValueMapping<IdentityType>[] = [
	{ value: "CPF", label: "CPF" },
	{ value: "CNPJ", label: "CNPJ" },
];
