import type { User } from "@/libs/types/user";
import { makeProfile } from "./make-profile";

export function makeUser(overrides: Partial<User> = {}): User {
	return {
		profile: makeProfile(),
		...overrides,
	};
}
