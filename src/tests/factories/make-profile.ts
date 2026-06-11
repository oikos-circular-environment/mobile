import { faker } from "@faker-js/faker";
import type { Profile } from "@/libs/types/profile";
import { makeAddress } from "./make-address";

export function makeProfile(overrides: Partial<Profile> = {}): Profile {
	const firstName = faker.person.firstName();
	const lastName = faker.person.lastName();
	return {
		user_id: faker.string.uuid(),
		id: faker.string.uuid(),
		full_name: `${firstName} ${lastName}`,
		display_name: firstName,
		phone: faker.phone.number(),
		created_at: faker.date.past(),
		updated_at: faker.date.recent(),
		address: makeAddress(),
		profile_image: null,
		...overrides,
	};
}
