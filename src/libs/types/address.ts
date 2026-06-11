import type { GetV1ProfilesAddressesResponses } from "@/libs/oikos-sdk";

export type Address = NonNullable<
	GetV1ProfilesAddressesResponses[200]["address"]
>;
