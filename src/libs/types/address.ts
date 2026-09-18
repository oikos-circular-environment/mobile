import type { GetV1ProfilesAddressesResponses } from "@oikos-circular-environment/oikos-sdk";

export type Address = NonNullable<
	GetV1ProfilesAddressesResponses[200]["address"]
>;
