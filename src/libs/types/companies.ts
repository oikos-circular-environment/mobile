import { Address } from "./address";
import { BusinessHour } from "./business-hour";

export type IdentityType = 
  | "CPF"
  | "CNPJ"


export type CompanyType = 
  | "ONG"
  | "COMPANY"
  | "GOVERNMENT"
  | "COLLECTOR"

export type Company = {
  id: string;
  identity: string;
  identityType: IdentityType;
  companyType: CompanyType;
  // stateRegistration?: string | null; // Inscrição Estadual
  status: boolean; // Ativo ou Inativo
  isHeadquarters: boolean; // Matriz ou Filial
  businessName?: string | null; // Nome Fantasia
  corporateName: string; // Razão Social
  acceptAppointments: boolean; // Aceita agendamentos
  email: string | null;
  phones: string[] | null;
  address: Address | null;
  startedActivityIn: Date;
  businessHours?: BusinessHour[] | null; // Horário de funcionamento
  // wasteItems?: Item[] | null; // Resíduos que a empresa trabalha
}
