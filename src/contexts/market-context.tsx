import { useInfiniteQuery } from "@tanstack/react-query";
import {
	createContext,
	type PropsWithChildren,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import { z } from "zod";
import { useAuthContext } from "@/contexts/auth-context";
import { useGeospatial } from "@/contexts/geospatial-context";
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

export type LocationSource = "current" | "profile";

const defaultFilters: MarketFilterValues = {
	query: "",
	radius: "2000",
	category: undefined,
};

type MarketContextValue = {
	appliedFilters: MarketFilterValues;
	setAppliedFilters: (filters: MarketFilterValues) => void;
	locationSource: LocationSource;
	setLocationSource: (source: LocationSource) => void;
	isLocationReady: boolean;
	isResolvingLocation: boolean;
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
	const { user, isAuthenticated } = useAuthContext();
	const { location, isResolving } = useGeospatial();
	const [appliedFilters, setAppliedFilters] =
		useState<MarketFilterValues>(defaultFilters);
	const [locationSource, setLocationSource] =
		useState<LocationSource>("current");

	const profileLat = user?.profile?.address?.latitude ?? undefined;
	const profileLon = user?.profile?.address?.longitude ?? undefined;

	const lat =
		locationSource === "current"
			? (location?.coords.latitude ?? undefined)
			: profileLat;
	const lon =
		locationSource === "current"
			? (location?.coords.longitude ?? undefined)
			: profileLon;

	const isLocationReady = lat != null && lon != null;
	const isResolvingLocation = locationSource === "current" && isResolving;

	useEffect(() => {
		const profileHasCoords = profileLat != null && profileLon != null;
		if (
			locationSource === "profile" &&
			(!isAuthenticated || !profileHasCoords)
		) {
			setLocationSource("current");
		}
	}, [isAuthenticated, locationSource, profileLat, profileLon]);

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
			locationSource,
			setLocationSource,
			isLocationReady,
			isResolvingLocation,
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
			locationSource,
			isLocationReady,
			isResolvingLocation,
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
