import { desc, eq } from "drizzle-orm";
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

export async function getLastAppError(): Promise<
	(SupportLastError & { id: string }) | null
> {
	const [row] = await getOikosAppDb()
		.select()
		.from(appError)
		.orderBy(desc(appError.occurredAt))
		.limit(1);

	if (!row) return null;

	return {
		id: row.id,
		message: row.message,
		stack: row.stack ?? undefined,
		component_stack: row.componentStack ?? undefined,
		occurred_at: new Date(row.occurredAt),
	};
}

export async function deleteAppError(id: string) {
	await getOikosAppDb().delete(appError).where(eq(appError.id, id));
}
