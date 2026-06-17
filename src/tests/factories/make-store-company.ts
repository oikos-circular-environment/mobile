import { faker } from "@faker-js/faker";
import type { Company } from "@/libs/types/companies";

export function makeStoreCompany(
	overrides: Partial<Company> = {},
): Company {
	return {
		id: faker.string.uuid(),
		user_id: faker.string.uuid(),
		identity: faker.string.numeric(14),
		identity_type: "CNPJ",
		company_type: "COMPANY",
		status: true,
		business_name: faker.company.name(),
		corporate_name: faker.company.name(),
		email: null,
		phones: [faker.phone.number()],
		started_activity_in: faker.date.past({ years: 10 }),
		is_company_valid: true,
		avatar: null,
		created_at: faker.date.past({ years: 1 }),
		updated_at: faker.date.recent(),
		address: null,
		business_hours: [],
		wastes: [],
		services: [],
		...overrides,
	};
}

export function makeStoreCompanyList(
	count: number,
	overrides: Partial<Company> = {},
): Company[] {
	return Array.from({ length: count }, () => makeStoreCompany(overrides));
}
