import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const appError = sqliteTable("app_error", {
	id: text("id").primaryKey(),
	message: text("message").notNull(),
	stack: text("stack"),
	componentStack: text("component_stack"),
	route: text("route"),
	severity: text("severity", { enum: ["error", "fatal"] }).notNull(),
	occurredAt: text("occurred_at").notNull(),
});
