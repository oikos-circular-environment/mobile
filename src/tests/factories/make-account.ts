import { faker } from "@faker-js/faker";
import type { Account } from "@/libs/types/user";

export function makeAccount(overrides: Partial<Account> = {}): Account {
	return {
		id: faker.string.uuid(),
		email: faker.internet.email(),
		created_at: faker.date.past(),
		deleted_at: null,
		...overrides,
	};
}
