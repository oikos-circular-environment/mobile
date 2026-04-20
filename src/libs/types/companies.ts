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
  identityType: IdentityType;
  companyType: CompanyType;
  status: boolean; // Ativo ou Inativo
  isHeadquarters: boolean; // Matriz ou Filial
  businessName: string | null; // Nome Fantasia
  corporateName: string; // Razão Social
  acceptAppointments: boolean; // Aceita agendamentos
  email: string | null;
  phones: string[] | null;
  address: Address | null;
  startedActivityIn: Date;
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
