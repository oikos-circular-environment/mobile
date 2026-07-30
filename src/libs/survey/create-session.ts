import type { AppRouter } from "@oikos-circular-environment/survey-api/routers/index";
import type { inferRouterInputs } from "@trpc/server";
import * as Crypto from "expo-crypto";
import { getSurveyDb } from "@/libs/survey/db/client";
import { surveySession } from "@/libs/survey/db/schema";
import { getSurveyDeviceInfo } from "@/libs/survey/device-info";
import { enqueueSessionUpsert } from "@/libs/survey/queue/outbox";

type SessionUpsertInput =
	inferRouterInputs<AppRouter>["usability"]["session"]["upsert"];

export interface CreateSurveySessionInput {
	protocolKey: string;
	protocolVersion: number;
	persona: string;
	stateUf: string;
	cityName: string;
	ageRange: string;
	educationLevel: string;
	chainRole: string;
	wasteContactFrequency: number;
	appExperience: number;
	consentVersion: string;
	consentAt: string;
}

/**
 * Cria a sessão local (E2 espelhado em `survey_session`) e enfileira o envio. É o
 * único ponto em que persona e caracterização se tornam uma sessão de verdade —
 * antes disso tudo vive só no `survey-draft-store`.
 */
export async function createSurveySession(
	input: CreateSurveySessionInput,
): Promise<string> {
	const sessionId = Crypto.randomUUID();
	const now = new Date().toISOString();
	const device = getSurveyDeviceInfo();

	const db = getSurveyDb();
	await db.insert(surveySession).values({
		id: sessionId,
		protocolKey: input.protocolKey,
		protocolVersion: input.protocolVersion,
		persona: input.persona,
		stateUf: input.stateUf,
		cityName: input.cityName,
		ageRange: input.ageRange,
		educationLevel: input.educationLevel,
		chainRole: input.chainRole,
		wasteContactFrequency: input.wasteContactFrequency,
		appExperience: input.appExperience,
		consentVersion: input.consentVersion,
		consentAt: input.consentAt,
		deviceOs: device.os,
		deviceOsVersion: device.os_version,
		appVersion: device.app_version,
		screenSize: device.screen_size,
		status: "IN_PROGRESS",
		startedAt: now,
		createdAt: now,
		updatedAt: now,
	});

	const upsertInput: SessionUpsertInput = {
		session_id: sessionId,
		protocol_key: input.protocolKey,
		protocol_version: input.protocolVersion,
		// biome-ignore lint/suspicious/noExplicitAny: chaves vêm das opções do protocolo (E1), tipadas como enum no servidor
		persona: input.persona as any,
		screener: {
			// biome-ignore lint/suspicious/noExplicitAny: idem — validado pelo protocolo, não pelo tipo estático
			state_uf: input.stateUf as any,
			city_name: input.cityName,
			// biome-ignore lint/suspicious/noExplicitAny: idem
			age_range: input.ageRange as any,
			// biome-ignore lint/suspicious/noExplicitAny: idem
			education_level: input.educationLevel as any,
			// biome-ignore lint/suspicious/noExplicitAny: idem
			chain_role: input.chainRole as any,
			waste_contact_frequency: input.wasteContactFrequency,
			app_experience: input.appExperience,
		},
		consent: { version: input.consentVersion, accepted_at: input.consentAt },
		device,
		started_at: now,
	};

	await enqueueSessionUpsert(sessionId, upsertInput);

	return sessionId;
}
