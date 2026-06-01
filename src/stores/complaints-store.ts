import { create } from "zustand";
import type {
	GetV1ComplaintsDashboardResponse,
	GetV1ComplaintsResponse,
} from "@/libs/oikos-sdk";
import type { ComplaintCapture } from "@/libs/types/complaint";

export type ApiComplaint =
	NonNullable<GetV1ComplaintsResponse>["complaints"][number];
export type ComplaintDashboard =
	NonNullable<GetV1ComplaintsDashboardResponse>["dashboard"];
export type ApiComplaintStatus = ApiComplaint["status"];

// ─── List Slice ──────────────────────────────────────────────────────────────

type ListState = {
	complaints: ApiComplaint[];
	dashboard: ComplaintDashboard | undefined;
	nextCursor: Date | undefined;
	hasNextPage: boolean;
	activeFilter: ApiComplaintStatus | null;
};

type ListActions = {
	setComplaints: (complaints: ApiComplaint[], nextCursor?: Date) => void;
	appendComplaints: (complaints: ApiComplaint[], nextCursor?: Date) => void;
	setDashboard: (dashboard: ComplaintDashboard) => void;
	setActiveFilter: (status: ApiComplaintStatus | null) => void;
	shiftComplaintStatus: (id: string, newStatus: ApiComplaintStatus) => void;
};

// ─── Create Draft Slice ───────────────────────────────────────────────────────

type DraftState = {
	draftCaptures: ComplaintCapture[];
	selectedCaptureId: string;
};

type DraftActions = {
	addCapture: (capture: ComplaintCapture) => void;
	updateCapture: (
		captureId: string,
		payload: Partial<Pick<ComplaintCapture, "observation" | "type">>,
	) => void;
	deleteCapture: (captureId: string) => void;
	clearDraft: () => void;
	setSelectedCaptureId: (id: string) => void;
};

// ─── Map Votes Slice ─────────────────────────────────────────────────────────

type MapVotesState = {
	userVotes: Record<string, "RESOLVED" | "NOT_RESOLVED">;
};

type MapVotesActions = {
	setVote: (complaintId: string, voteType: "RESOLVED" | "NOT_RESOLVED") => void;
	removeVote: (complaintId: string) => void;
};

// ─── Store ───────────────────────────────────────────────────────────────────

type ComplaintsStoreState = ListState &
	ListActions &
	DraftState &
	DraftActions &
	MapVotesState &
	MapVotesActions;

export const useComplaintsStore = create<ComplaintsStoreState>(set => ({
	// ── List ──
	complaints: [],
	dashboard: undefined,
	nextCursor: undefined,
	hasNextPage: false,
	activeFilter: null,

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

	shiftComplaintStatus: (id, newStatus) => {
		set(state => {
			const complaint = state.complaints.find(c => c.id === id);
			if (!complaint) return {};

			const oldStatus = complaint.status as ApiComplaintStatus;
			const updatedComplaints = state.complaints.map(c =>
				c.id === id ? { ...c, status: newStatus } : c,
			);

			if (!state.dashboard) return { complaints: updatedComplaints };

			const dash = { ...state.dashboard };

			if (oldStatus === "OPEN") dash.open = Math.max(0, (dash.open ?? 0) - 1);
			else if (oldStatus === "IN_PROGRESS") dash.pending = Math.max(0, (dash.pending ?? 0) - 1);
			else if (oldStatus === "RESOLVED") dash.resolved = Math.max(0, (dash.resolved ?? 0) - 1);
			else if (oldStatus === "CANCELED") dash.canceled = Math.max(0, (dash.canceled ?? 0) - 1);
			else if (oldStatus === "REJECTED") dash.rejected = Math.max(0, (dash.rejected ?? 0) - 1);

			if (newStatus === "OPEN") dash.open = (dash.open ?? 0) + 1;
			else if (newStatus === "IN_PROGRESS") dash.pending = (dash.pending ?? 0) + 1;
			else if (newStatus === "RESOLVED") dash.resolved = (dash.resolved ?? 0) + 1;
			else if (newStatus === "CANCELED") dash.canceled = (dash.canceled ?? 0) + 1;
			else if (newStatus === "REJECTED") dash.rejected = (dash.rejected ?? 0) + 1;

			return { complaints: updatedComplaints, dashboard: dash };
		});
	},

	// ── Create Draft ──
	draftCaptures: [],
	selectedCaptureId: "",

	addCapture: capture =>
		set(state => ({
			draftCaptures: [capture, ...state.draftCaptures],
			selectedCaptureId: capture.id,
		})),

	updateCapture: (captureId, payload) =>
		set(state => ({
			draftCaptures: state.draftCaptures.map(c =>
				c.id === captureId
					? { ...c, ...payload, updated_at: new Date().toISOString() }
					: c,
			),
		})),

	deleteCapture: captureId =>
		set(state => {
			const updated = state.draftCaptures.filter(c => c.id !== captureId);
			const stillSelected = updated.some(c => c.id === state.selectedCaptureId);
			return {
				draftCaptures: updated,
				selectedCaptureId: stillSelected
					? state.selectedCaptureId
					: (updated[0]?.id ?? ""),
			};
		}),

	clearDraft: () => set({ draftCaptures: [], selectedCaptureId: "" }),

	setSelectedCaptureId: id => set({ selectedCaptureId: id }),

	// ── Map Votes ──
	userVotes: {},

	setVote: (complaintId, voteType) =>
		set(state => ({
			userVotes: { ...state.userVotes, [complaintId]: voteType },
		})),

	removeVote: complaintId =>
		set(state => {
			const next = { ...state.userVotes };
			delete next[complaintId];
			return { userVotes: next };
		}),
}));

// ─── Selectors ───────────────────────────────────────────────────────────────

export const selectFilteredComplaints = (state: ComplaintsStoreState) => {
	if (!state.activeFilter) return state.complaints;
	return state.complaints.filter(c => c.status === state.activeFilter);
};

export const selectSelectedCapture = (state: ComplaintsStoreState) => {
	if (state.draftCaptures.length === 0) return null;
	return (
		state.draftCaptures.find(c => c.id === state.selectedCaptureId) ??
		state.draftCaptures[0] ??
		null
	);
};
