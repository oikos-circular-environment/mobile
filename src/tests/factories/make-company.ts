import { faker } from "@faker-js/faker";
import type { CompanyType } from "@/libs/types/companies";
import type { MarketCompany } from "@/libs/types/market";
import { makeBusinessHours } from "./make-business-hours";
import { makeWaste } from "./make-waste";

const COMPANY_TYPES: CompanyType[] = [
	"ONG",
	"COMPANY",
	"GOVERNMENT",
	"COLLECTOR",
];

export function makeCompany(
	overrides: Partial<MarketCompany> = {},
): MarketCompany {
	return {
		id: faker.string.uuid(),
		business_name: faker.company.name(),
		corporate_name: faker.company.name(),
		company_type: faker.helpers.arrayElement(COMPANY_TYPES),
		status: true,
		phones: [faker.phone.number()],
		address: {
			id: faker.string.uuid(),
			zip_code: faker.location.zipCode(),
			street: faker.location.street(),
			number: faker.location.buildingNumber(),
			complement: null,
			district: faker.location.county(),
			city: faker.location.city(),
			state: faker.location.state(),
			state_code: faker.helpers.arrayElement(["SP", "RJ", "MG", "RS", "PR"]),
			latitude: faker.location.latitude({ min: -23.6, max: -23.4 }),
			longitude: faker.location.longitude({ min: -46.7, max: -46.5 }),
		},
		avatar: null,
		wastes: [makeWaste()],
		services: [],
		business_hours: makeBusinessHours(),
		distance_in_meters: faker.number.int({ min: 100, max: 50000 }),
		identity: null,
		identity_type: "CNPJ",
		...overrides,
	};
}

export function makeCompanyList(
	count: number,
	overrides: Partial<MarketCompany> = {},
): MarketCompany[] {
	return Array.from({ length: count }, () => makeCompany(overrides));
}
