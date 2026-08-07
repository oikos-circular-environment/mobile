import { eq } from "drizzle-orm";
import { getSurveyDb } from "./db/client";
import { surveyProtocolCache } from "./db/schema";

export interface CachedProtocol {
	key: string;
	version: number;
	payload: unknown;
}

export async function getCachedProtocol(
	protocolKey: string,
): Promise<CachedProtocol | null> {
	const db = getSurveyDb();
	const [row] = await db
		.select()
		.from(surveyProtocolCache)
		.where(eq(surveyProtocolCache.protocolKey, protocolKey))
		.limit(1);

	if (!row) return null;

	return {
		key: row.protocolKey,
		version: row.protocolVersion,
		payload: row.payload as unknown,
	};
}

export async function setCachedProtocol(
	protocolKey: string,
	protocolVersion: number,
	payload: unknown,
) {
	if (!protocolKey) {
		console.warn("[survey] tentativa de cachear protocolo sem chave");
		return;
	}

	const db = getSurveyDb();
	const now = new Date().toISOString();

	await db
		.insert(surveyProtocolCache)
		.values({
			protocolKey,
			protocolVersion,
			payload,
			createdAt: now,
			updatedAt: now,
		})
		.onConflictDoUpdate({
			target: surveyProtocolCache.protocolKey,
			set: {
				protocolVersion,
				payload,
				updatedAt: now,
			},
		});
}
