import type { User } from "@/libs/types/user";
import { makeAccount } from "./make-account";
import { makeProfile } from "./make-profile";

export function makeUser(overrides: Partial<User> = {}): User {
	return {
		account: makeAccount(),
		profile: makeProfile(),
		...overrides,
	};
}
