import { fakerPT_BR as faker } from "@faker-js/faker";
import type { Company, CompanyType, IdentityType } from "../types/companies";

export const createCompanies = (count: number): Company[] => {
	return Array.from(
		{ length: count },
		() =>
			({
				id: faker.database.mongodbObjectId(),
				user_id: faker.database.mongodbObjectId(),
				corporate_name: faker.company.name(),
				business_name: faker.company.name(),
				email: faker.internet.email(),
				phones: [faker.phone.number({ style: "national" })],
				company_type: faker.helpers.arrayElement([
					"ONG",
					"COMPANY",
					"GOVERNMENT",
					"COLLECTOR",
				]) as CompanyType,
				identity_type: faker.helpers.arrayElement([
					"CPF",
					"CNPJ",
				]) as IdentityType,
				identity: faker.number
					.int({ min: 10000000000, max: 99999999999 })
					.toString(),
				status: faker.datatype.boolean(),
				is_company_valid: faker.datatype.boolean(),
				avatar: null,
				created_at: faker.date.past({ years: 1 }),
				updated_at: faker.date.recent(),
				started_activity_in: faker.date.past({ years: 20 }),
				address: {
					id: faker.database.mongodbObjectId(),
					street: faker.location.streetAddress(),
					number: faker.location.buildingNumber(),
					city: faker.location.city(),
					state: faker.location.state(),
					state_code: faker.location.state({ abbreviated: true }),
					district: faker.location.county(),
					zip_code: faker.location.zipCode("#####-###"),
					latitude: faker.location.latitude(),
					longitude: faker.location.longitude(),
					complement: null,
					city_ibge_id: faker.number.int({ min: 10000, max: 99999 }),
					state_ibge_id: faker.number.int({ min: 10, max: 99 }),
					created_at: faker.date.past({ years: 1 }),
					updated_at: faker.date.recent(),
				},
				business_hours: [],
				wastes: [],
				services: [],
			}) as Company,
	);
};
