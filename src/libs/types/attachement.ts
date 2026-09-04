import type { GetV1ProfilesResponses } from "@oikos-circular-environment/oikos-sdk";

type _Profile = NonNullable<GetV1ProfilesResponses[200]["profile"]>;
export type Attachment = NonNullable<_Profile["profile_image"]>;
