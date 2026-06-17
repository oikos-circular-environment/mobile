import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { getV1Complaints, getV1ComplaintsDashboard } from "@/libs/oikos-sdk";
import { useComplaintsStore } from "@/stores/complaints-store";

export const COMPLAINTS_QUERY_KEY = ["complaints"] as const;
export const DASHBOARD_QUERY_KEY = ["complaints", "dashboard"] as const;

const PAGE_LIMIT = 15;

export function useComplaintsList() {
	const setComplaints = useComplaintsStore(s => s.setComplaints);
	const setDashboard = useComplaintsStore(s => s.setDashboard);

	const {
		data,
		isLoading: isLoadingComplaints,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		refetch: refetchComplaints,
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

	useEffect(() => {
		if (!data) return;
		const all = data.pages.flatMap(page => page?.complaints ?? []);
		const lastPage = data.pages[data.pages.length - 1];
		setComplaints(all, lastPage?.next_cursor ?? undefined);
	}, [data, setComplaints]);

	useEffect(() => {
		if (!dashboardData) return;
		setDashboard(dashboardData);
	}, [dashboardData, setDashboard]);

	const refetchAll = () => {
		void refetchComplaints();
		void refetchDashboard();
	};

	return {
		isLoadingComplaints,
		isLoadingDashboard,
		fetchNextPage,
		hasNextPage: hasNextPage ?? false,
		isFetchingNextPage,
		refetchAll,
	};
}
