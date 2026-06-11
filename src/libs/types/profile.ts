import type { GetV1ProfilesResponses } from "@/libs/oikos-sdk";

export type Profile = NonNullable<GetV1ProfilesResponses[200]["profile"]>;
