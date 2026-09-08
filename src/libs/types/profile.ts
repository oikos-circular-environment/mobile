import type { GetV1ProfilesResponses } from "@oikos-circular-environment/oikos-sdk";

export type Profile = NonNullable<GetV1ProfilesResponses[200]["profile"]>;
