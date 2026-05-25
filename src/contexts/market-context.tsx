import { useInfiniteQuery } from "@tanstack/react-query";
import {
	createContext,
	type PropsWithChildren,
	useCallback,
	useContext,
	useMemo,
	useState,
} from "react";
import { z } from "zod";
import { useAuthContext } from "@/contexts/auth-context";
import { getV1Market } from "@/libs/oikos-sdk";
import type { MarketCompany } from "@/libs/types/market";

export const marketFilterSchema = z.object({
	query: z
		.string()
		.trim()
		.max(80, "A pesquisa deve ter no máximo 80 caracteres."),
	radius: z.string(),
	category: z.enum(["services", "waste"]).optional(),
});

export type MarketFilterValues = z.infer<typeof marketFilterSchema>;

const defaultFilters: MarketFilterValues = {
	query: "",
	radius: "2000",
	category: undefined,
};

type MarketContextValue = {
	appliedFilters: MarketFilterValues;
	setAppliedFilters: (filters: MarketFilterValues) => void;
	isLocationReady: boolean;
	companies: MarketCompany[];
	isPending: boolean;
	isFetchingNextPage: boolean;
	hasNextPage: boolean;
	fetchNextPage: () => void;
	isError: boolean;
	getCompanyById: (id: string) => MarketCompany | undefined;
};

const MarketContext = createContext<MarketContextValue | null>(null);

export function MarketProvider({ children }: PropsWithChildren) {
	const { user } = useAuthContext();
	const [appliedFilters, setAppliedFilters] =
		useState<MarketFilterValues>(defaultFilters);

	const lat = user?.profile?.address?.latitude ?? undefined;
	const lon = user?.profile?.address?.longitude ?? undefined;
	const isLocationReady = lat != null && lon != null;

	const {
		data,
		isPending,
		isFetchingNextPage,
		hasNextPage,
		fetchNextPage,
		isError,
	} = useInfiniteQuery({
		queryKey: ["market", lat, lon, appliedFilters],
		queryFn: ({ pageParam }) =>
			getV1Market({
				query: {
					lat: lat as number,
					lon: lon as number,
					radius: Number(appliedFilters.radius),
					q: appliedFilters.query || undefined,
					category: appliedFilters.category,
					cursor: pageParam as string | undefined,
					limit: 20,
				},
			}).then(r => r.data),
		initialPageParam: undefined as string | undefined,
		getNextPageParam: page => page?.next_cursor ?? undefined,
		enabled: isLocationReady,
	});

	const companies = useMemo(
		() => data?.pages.flatMap(p => p?.companies ?? []) ?? [],
		[data],
	);

	const getCompanyById = useCallback(
		(id: string) => companies.find(c => c.id === id),
		[companies],
	);

	const value = useMemo<MarketContextValue>(
		() => ({
			appliedFilters,
			setAppliedFilters,
			isLocationReady,
			companies,
			isPending,
			isFetchingNextPage,
			hasNextPage,
			fetchNextPage,
			isError,
			getCompanyById,
		}),
		[
			appliedFilters,
			isLocationReady,
			companies,
			isPending,
			isFetchingNextPage,
			hasNextPage,
			fetchNextPage,
			isError,
			getCompanyById,
		],
	);

	return (
		<MarketContext.Provider value={value}>{children}</MarketContext.Provider>
	);
}

export function useMarket() {
	const ctx = useContext(MarketContext);

	if (!ctx) {
		throw new Error("useMarket must be used within MarketProvider");
	}

	return ctx;
}
