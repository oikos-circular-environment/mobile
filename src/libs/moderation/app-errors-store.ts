import { desc } from "drizzle-orm";
import * as Crypto from "expo-crypto";
import { getOikosAppDb } from "@/libs/db/client";
import { appError } from "@/libs/db/schema";
import type { SupportLastError } from "@/libs/types/support";

export async function insertAppError(error: {
	message: string;
	stack?: string;
	componentStack?: string;
	route?: string;
	severity: "error" | "fatal";
}) {
	await getOikosAppDb().insert(appError).values({
		id: Crypto.randomUUID(),
		message: error.message,
		stack: error.stack,
		componentStack: error.componentStack,
		route: error.route,
		severity: error.severity,
		occurredAt: new Date().toISOString(),
	});
}

export async function getRecentAppErrors(
	limit = 10,
): Promise<(SupportLastError & { id: string })[]> {
	const rows = await getOikosAppDb()
		.select()
		.from(appError)
		.orderBy(desc(appError.occurredAt))
		.limit(limit);

	return rows.map(row => ({
		id: row.id,
		message: row.message,
		stack: row.stack ?? undefined,
		component_stack: row.componentStack ?? undefined,
		occurred_at: new Date(row.occurredAt),
	}));
}
