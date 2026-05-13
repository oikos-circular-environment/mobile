import type { Address } from "./address";

export type Profile = {
	id: string;
	fullName: string;
	displayName: string;
	cpf: string;
	phone: string;
	email: string;
	isCollector: boolean;
	address: Address;
};
