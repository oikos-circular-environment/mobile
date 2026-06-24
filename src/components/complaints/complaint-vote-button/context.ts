import { createContext, useContext } from "react";

export type ComplaintVoteButtonContextValue = {
	resolvedVotes: number;
	notResolvedVotes: number;
	currentVote: "RESOLVED" | "NOT_RESOLVED" | null;
	isPending: boolean;
	disabled: boolean;
	onVote: (vote: "RESOLVED" | "NOT_RESOLVED") => void;
};

export const ComplaintVoteButtonContext =
	createContext<ComplaintVoteButtonContextValue | null>(null);

export function useComplaintVoteButtonContext(): ComplaintVoteButtonContextValue {
	const ctx = useContext(ComplaintVoteButtonContext);
	if (!ctx) {
		throw new Error(
			"useComplaintVoteButtonContext must be used within ComplaintVote",
		);
	}
	return ctx;
}
