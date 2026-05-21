"use client";

import { useQuery } from "@tanstack/react-query";
import {
	createContext,
	type PropsWithChildren,
	useCallback,
	useContext,
	useMemo,
	useState,
} from "react";
import type {
	GetV1ComplaintsDashboardResponse,
	GetV1ComplaintsResponse,
} from "@/libs/oikos-sdk";
import {
	getV1Complaints,
	getV1ComplaintsDashboard,
} from "@/libs/oikos-sdk";

export type ApiComplaint = NonNullable<GetV1ComplaintsResponse>["complaints"][number];

export type ComplaintDashboard = NonNullable<GetV1ComplaintsDashboardResponse>["dashboard"];
export type ApiComplaintStatus = ApiComplaint["status"];

export const COMPLAINTS_QUERY_KEY = ["complaints"] as const;
export const DASHBOARD_QUERY_KEY = ["complaints", "dashboard"] as const;

type ComplaintsContextValue = {
	complaints: ApiComplaint[];
	dashboard: ComplaintDashboard | undefined;
	activeFilter: ApiComplaintStatus | null;
	setActiveFilter: (status: ApiComplaintStatus | null) => void;
	filteredComplaints: ApiComplaint[];
	isLoadingComplaints: boolean;
	isLoadingDashboard: boolean;
	refetchAll: () => void;
};

const ComplaintsContext = createContext<ComplaintsContextValue | null>(null);

export function ComplaintsProvider({ children }: PropsWithChildren) {
	const [activeFilter, setActiveFilter] = useState<ApiComplaintStatus | null>(
		null,
	);

	const {
		data: complaintsData,
		isLoading: isLoadingComplaints,
		refetch: refetchComplaints,
	} = useQuery({
		queryKey: COMPLAINTS_QUERY_KEY,
		queryFn: async () => {
			const res = await getV1Complaints();
			return res.data?.complaints ?? [];
		},
	});

	const {
		data: dashboardData,
		isLoading: isLoadingDashboard,
		refetch: refetchDashboard,
	} = useQuery({
		queryKey: DASHBOARD_QUERY_KEY,
		queryFn: async () => {
			const res = await getV1ComplaintsDashboard();
			return res.data?.dashboard;
		},
	});

	const complaints = complaintsData ?? [];

	const filteredComplaints = useMemo(() => {
		if (!activeFilter) return complaints;
		return complaints.filter(c => c.status === activeFilter);
	}, [complaints, activeFilter]);

	const refetchAll = useCallback(() => {
		void refetchComplaints();
		void refetchDashboard();
	}, [refetchComplaints, refetchDashboard]);

	const value = useMemo<ComplaintsContextValue>(
		() => ({
			complaints,
			dashboard: dashboardData,
			activeFilter,
			setActiveFilter,
			filteredComplaints,
			isLoadingComplaints,
			isLoadingDashboard,
			refetchAll,
		}),
		[
			complaints,
			dashboardData,
			activeFilter,
			filteredComplaints,
			isLoadingComplaints,
			isLoadingDashboard,
			refetchAll,
		],
	);

	return (
		<ComplaintsContext.Provider value={value}>
			{children}
		</ComplaintsContext.Provider>
	);
}

export function useComplaintsContext() {
	const context = useContext(ComplaintsContext);
	if (!context) {
		throw new Error(
			"useComplaintsContext deve ser usado dentro de ComplaintsProvider.",
		);
	}
	return context;
}
