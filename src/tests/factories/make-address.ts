import { faker } from "@faker-js/faker";
import type { Address } from "@/libs/types/address";

export function makeAddress(overrides: Partial<Address> = {}): Address {
	return {
		id: faker.string.uuid(),
		street: faker.location.street(),
		number: faker.location.buildingNumber(),
		complement: null,
		district: faker.location.county(),
		city: faker.location.city(),
		city_ibge_id: faker.number.int({ min: 1000000, max: 9999999 }),
		state: faker.location.state(),
		state_ibge_id: faker.number.int({ min: 11, max: 53 }),
		state_code: faker.helpers.arrayElement(["SP", "RJ", "MG", "RS", "PR"]),
		zip_code: faker.location.zipCode(),
		latitude: faker.location.latitude({ min: -23.6, max: -23.4 }),
		longitude: faker.location.longitude({ min: -46.7, max: -46.5 }),
		...overrides,
	};
}
