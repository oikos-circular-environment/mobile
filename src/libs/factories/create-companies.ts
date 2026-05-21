import { fakerPT_BR as faker } from "@faker-js/faker";
import type { Company, CompanyType, IdentityType } from "../types/companies";

export const createCompanies = (count: number): Company[] => {
	return Array.from(
		{ length: count },
		() =>
			({
				id: faker.database.mongodbObjectId(),
				corporate_name: faker.company.name(),
				business_name: faker.company.name(),
				accept_appointments: faker.datatype.boolean(),
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
					.toString(), // Mock de CPF/CNPJ
				status: faker.datatype.boolean(),
				isHeadquarters: faker.datatype.boolean(),
				started_activity_in: faker.date.past({ years: 20 }), // Data aleatória nos últimos 20 anos
				businessHours: null,
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
				},
				waste: null,
				services: null,
			}) as Company,
	);
};
