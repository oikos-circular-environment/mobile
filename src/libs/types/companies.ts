import type { Address } from "./address";
import type { BusinessHour } from "./business-hour";
import type { Service } from "./service";
import type { ValueMapping } from "./value-mapping";
import type { Waste } from "./waste";

export type IdentityType = "CPF" | "CNPJ";

export type CompanyType = "ONG" | "COMPANY" | "GOVERNMENT" | "COLLECTOR";

export type Company = {
	id: string;
	identity: string;
	identity_type: IdentityType;
	company_type: CompanyType;
	status: boolean; // Ativo ou Inativo
	isHeadquarters: boolean; // Matriz ou Filial
	business_name: string | null; // Nome Fantasia
	corporate_name: string; // Razão Social
	accept_appointments: boolean; // Aceita agendamentos
	email: string | null;
	phones: string[] | null;
	address: Address | null;
	started_activity_in: Date;
	businessHours: BusinessHour[] | null; // Horário de funcionamento
	waste: Waste[] | null; // Resíduos que a empresa trabalha
	services: Service[] | null; // Serviços que a empresa oferece
};

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
