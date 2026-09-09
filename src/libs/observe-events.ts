import { Observe, type ObserveAttributes } from "expo-observe";

function logEvent(
	name: string,
	attributes?: ObserveAttributes,
	severity?: "error" | "fatal",
) {
	try {
		Observe.logEvent(name, { attributes, severity });
	} catch (error) {
		console.warn(`[observe-events] failed to log "${name}"`, error);
	}
}

export type ProfileEventName = "profile.updated" | "profile.avatar_updated";

export function logProfileEvent(
	name: ProfileEventName,
	attributes?: ObserveAttributes,
) {
	logEvent(name, attributes);
}

export type CompanyEventName =
	| "company.created"
	| "company.updated"
	| "company.address_updated"
	| "company.hours_updated"
	| "company.service_saved"
	| "company.waste_saved"
	| "company.avatar_updated";

export function logCompanyEvent(
	name: CompanyEventName,
	attributes?: ObserveAttributes,
) {
	logEvent(name, attributes);
}

export type MarketEventName =
	| "market.filter_applied"
	| "market.location_source_changed";

export function logMarketEvent(
	name: MarketEventName,
	attributes?: ObserveAttributes,
) {
	logEvent(name, attributes);
}

export type ComplaintEventName =
	| "complaint.created"
	| "complaint.updated"
	| "complaint.voted"
	| "complaint.resolved"
	| "complaint.cancelled";

export function logComplaintEvent(
	name: ComplaintEventName,
	attributes?: ObserveAttributes,
) {
	logEvent(name, attributes);
}

export function logAppErrorEvent(
	message: string,
	route?: string,
	severity: "error" | "fatal" = "error",
) {
	logEvent(
		"app.error_boundary_triggered",
		{ message, route: route ?? "" },
		severity,
	);
}
