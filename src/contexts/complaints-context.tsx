import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
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
import { getV1Complaints, getV1ComplaintsDashboard } from "@/libs/oikos-sdk";

export type ApiComplaint =
	NonNullable<GetV1ComplaintsResponse>["complaints"][number];

export type ComplaintDashboard =
	NonNullable<GetV1ComplaintsDashboardResponse>["dashboard"];
export type ApiComplaintStatus = ApiComplaint["status"];

export const COMPLAINTS_QUERY_KEY = ["complaints"] as const;
export const DASHBOARD_QUERY_KEY = ["complaints", "dashboard"] as const;

const PAGE_LIMIT = 15;

type ComplaintsContextValue = {
	complaints: ApiComplaint[];
	dashboard: ComplaintDashboard | undefined;
	activeFilter: ApiComplaintStatus | null;
	setActiveFilter: (status: ApiComplaintStatus | null) => void;
	filteredComplaints: ApiComplaint[];
	isLoadingComplaints: boolean;
	isLoadingDashboard: boolean;
	fetchNextPage: () => void;
	hasNextPage: boolean;
	isFetchingNextPage: boolean;
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
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useInfiniteQuery({
		queryKey: COMPLAINTS_QUERY_KEY,
		queryFn: async ({ pageParam }) => {
			const res = await getV1Complaints({
				query: { cursor: pageParam, limit: PAGE_LIMIT },
			});
			return res.data;
		},
		initialPageParam: undefined as Date | undefined,
		getNextPageParam: lastPage => lastPage?.next_cursor ?? undefined,
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

	const complaints = useMemo(
		() => complaintsData?.pages.flatMap(page => page?.complaints ?? []) ?? [],
		[complaintsData],
	);

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
			fetchNextPage,
			hasNextPage,
			isFetchingNextPage,
			refetchAll,
		}),
		[
			complaints,
			dashboardData,
			activeFilter,
			filteredComplaints,
			isLoadingComplaints,
			isLoadingDashboard,
			fetchNextPage,
			hasNextPage,
			isFetchingNextPage,
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
