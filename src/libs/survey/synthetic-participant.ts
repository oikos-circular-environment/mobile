import { fakerPT_BR as faker } from "@faker-js/faker";
import { AxiosError } from "axios";
import { setAuthToken, setRefreshToken } from "@/libs/api/oikos-api";
import {
	postV1AuthLogin,
	postV1UsersRegister,
	putV1Profiles,
} from "@/libs/oikos-sdk";

type SyntheticCredentials = { email: string; password: string };

function generateCredentials(): SyntheticCredentials {
	return {
		email: `oikos-survey-${faker.string.uuid()}@participant.invalid`,
		password: faker.internet.password({ length: 16 }),
	};
}

async function registerParticipant(): Promise<SyntheticCredentials> {
	const credentials = generateCredentials();

	try {
		await postV1UsersRegister({ body: credentials });
		return credentials;
	} catch (error) {
		if (!(error instanceof AxiosError) || error.response?.status !== 409) {
			throw error;
		}
	}

	const retryCredentials = generateCredentials();
	await postV1UsersRegister({ body: retryCredentials });
	return retryCredentials;
}

export async function provisionSyntheticParticipant(): Promise<void> {
	const credentials = await registerParticipant();

	const authResponse = await postV1AuthLogin({ body: credentials });
	const { token, refreshToken } = authResponse.data ?? {};
	if (!token || !refreshToken) {
		throw new Error("Token não recebido ao provisionar participante sintético");
	}

	await Promise.all([setAuthToken(token), setRefreshToken(refreshToken)]);

	await putV1Profiles({
		body: {
			full_name: faker.person.fullName(),
			display_name: faker.person.firstName(),
			phone: faker.phone.number({ style: "national" }).replace(/\D/g, ""),
		},
	});
}
