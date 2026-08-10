export interface SurveyInviteStage {
	code: string;
	status: "done" | "current" | "upcoming" | "completed";
	currentLabel?: string;
}
