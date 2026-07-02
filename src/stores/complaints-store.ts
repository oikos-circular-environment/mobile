import { create } from "zustand";
import { sessionBus } from "@/libs/session-bus";
import type {
	Complaint,
	ComplaintDashboard,
	ComplaintStatus,
	MapComplaint,
} from "@/libs/types/complaint";

type ListState = {
	complaints: Complaint[];
	dashboard: ComplaintDashboard | undefined;
	nextCursor: Date | undefined;
	hasNextPage: boolean;
	activeFilter: ComplaintStatus | null;
};

type ListActions = {
	setComplaints: (complaints: Complaint[], nextCursor?: Date) => void;
	appendComplaints: (complaints: Complaint[], nextCursor?: Date) => void;
	setDashboard: (dashboard: ComplaintDashboard) => void;
	setActiveFilter: (status: ComplaintStatus | null) => void;
	shiftComplaintStatus: (id: string, newStatus: ComplaintStatus) => void;
	updateComplaint: (id: string, patch: Partial<Complaint>) => void;
};

type VoteType = "RESOLVED" | "NOT_RESOLVED";

type MapSelectionState = {
	selectedMapComplaint: MapComplaint | null;
};

type MapSelectionActions = {
	setSelectedMapComplaint: (complaint: MapComplaint | null) => void;
	patchSelectedMapComplaintVoteCounts: (delta: {
		previousVote: VoteType | null;
		nextVote: VoteType | null;
	}) => void;
};

export type ResolutionDraft = {
	resolutionId: string;
	description: string;
	companyJson?: string;
	attachmentsJson?: string;
};

type ResolutionDraftState = {
	resolutionDraft: ResolutionDraft | null;
};

type ResolutionDraftActions = {
	setResolutionDraft: (draft: ResolutionDraft) => void;
	clearResolutionDraft: () => void;
};

type ComplaintsStoreState = ListState &
	ListActions &
	MapSelectionState &
	MapSelectionActions &
	ResolutionDraftState &
	ResolutionDraftActions;

const INITIAL_STATE: ListState & MapSelectionState & ResolutionDraftState = {
	complaints: [],
	dashboard: undefined,
	nextCursor: undefined,
	hasNextPage: false,
	activeFilter: null,
	selectedMapComplaint: null,
	resolutionDraft: null,
};

export const useComplaintsStore = create<ComplaintsStoreState>(set => ({
	...INITIAL_STATE,

	setComplaints: (complaints, nextCursor) =>
		set({ complaints, nextCursor, hasNextPage: !!nextCursor }),

	appendComplaints: (newComplaints, nextCursor) =>
		set(state => ({
			complaints: [...state.complaints, ...newComplaints],
			nextCursor,
			hasNextPage: !!nextCursor,
		})),

	setDashboard: dashboard => set({ dashboard }),

	setActiveFilter: status => set({ activeFilter: status }),

	updateComplaint: (id, patch) =>
		set(state => ({
			complaints: state.complaints.map(c =>
				c.id === id ? { ...c, ...patch } : c,
			),
		})),

	shiftComplaintStatus: (id, newStatus) => {
		set(state => {
			const complaint = state.complaints.find(c => c.id === id);
			if (!complaint) return {};

			const oldStatus = complaint.status as ComplaintStatus;
			const updatedComplaints = state.complaints.map(c =>
				c.id === id ? { ...c, status: newStatus } : c,
			);

			if (!state.dashboard) return { complaints: updatedComplaints };

			const dash = { ...state.dashboard };

			if (oldStatus === "OPEN") dash.open = Math.max(0, dash.open - 1);
			else if (oldStatus === "RESOLVED")
				dash.resolved = Math.max(0, dash.resolved - 1);
			else if (oldStatus === "CANCELED")
				dash.canceled = Math.max(0, dash.canceled - 1);

			if (newStatus === "OPEN") dash.open += 1;
			else if (newStatus === "RESOLVED") dash.resolved += 1;
			else if (newStatus === "CANCELED") dash.canceled += 1;

			return { complaints: updatedComplaints, dashboard: dash };
		});
	},

	setSelectedMapComplaint: complaint =>
		set({ selectedMapComplaint: complaint }),

	patchSelectedMapComplaintVoteCounts: ({ previousVote, nextVote }) =>
		set(state => {
			if (!state.selectedMapComplaint) return {};
			const counts = { ...state.selectedMapComplaint.vote_counts };
			if (previousVote === "RESOLVED")
				counts.resolved = Math.max(0, counts.resolved - 1);
			if (previousVote === "NOT_RESOLVED")
				counts.not_resolved = Math.max(0, counts.not_resolved - 1);
			if (nextVote === "RESOLVED") counts.resolved += 1;
			if (nextVote === "NOT_RESOLVED") counts.not_resolved += 1;
			return {
				selectedMapComplaint: {
					...state.selectedMapComplaint,
					vote_counts: counts,
				},
			};
		}),

	setResolutionDraft: draft => set({ resolutionDraft: draft }),

	clearResolutionDraft: () => set({ resolutionDraft: null }),
}));

sessionBus.subscribe(() => useComplaintsStore.setState(INITIAL_STATE));

export const selectFilteredComplaints = (state: ComplaintsStoreState) => {
	if (!state.activeFilter) return state.complaints;
	return state.complaints.filter(c => c.status === state.activeFilter);
};
