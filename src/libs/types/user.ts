import type { GetV1UsersMeResponses } from "@/libs/oikos-sdk";
import type { Profile } from "./profile";

export type Account = GetV1UsersMeResponses[200]["user"];

export type User = {
	account: Account;
	profile: Profile;
};
