import type BottomSheet from "@gorhom/bottom-sheet";
import { getV1Market } from "@oikos-circular-environment/oikos-sdk";
import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import {
	createContext,
	type PropsWithChildren,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { z } from "zod";
import { useAuthContext } from "@/contexts/auth-context";
import { useGeospatial } from "@/contexts/geospatial-context";
import { roundCoord } from "@/libs/geospatial";
import { logMarketEvent } from "@/libs/observe-events";
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
	radius: "10000",
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
	locationSheetRef: React.RefObject<BottomSheet | null>;
	radiusSheetRef: React.RefObject<BottomSheet | null>;
	openLocationSheet: () => void;
	openRadiusSheet: () => void;
};

const MarketContext = createContext<MarketContextValue | null>(null);

export function MarketProvider({ children }: PropsWithChildren) {
	const { user, isAuthenticated } = useAuthContext();
	const { location, isResolving } = useGeospatial();
	const [appliedFilters, setAppliedFilters] =
		useState<MarketFilterValues>(defaultFilters);
	const [locationSource, setLocationSource] =
		useState<LocationSource>("current");
	const locationSheetRef = useRef<BottomSheet>(null);
	const radiusSheetRef = useRef<BottomSheet>(null);

	const handleSetAppliedFilters = useCallback((filters: MarketFilterValues) => {
		setAppliedFilters(filters);
		logMarketEvent("market.filter_applied", {
			radius: filters.radius,
			category: filters.category ?? "",
			hasQuery: filters.query.length > 0,
		});
	}, []);

	const handleSetLocationSource = useCallback((source: LocationSource) => {
		setLocationSource(source);
		logMarketEvent("market.location_source_changed", { source });
	}, []);

	const profileLat = user?.profile?.address?.latitude ?? undefined;
	const profileLon = user?.profile?.address?.longitude ?? undefined;

	const rawLat =
		locationSource === "current"
			? (location?.coords.latitude ?? undefined)
			: profileLat;
	const rawLon =
		locationSource === "current"
			? (location?.coords.longitude ?? undefined)
			: profileLon;

	const lat = rawLat != null ? roundCoord(rawLat) : undefined;
	const lon = rawLon != null ? roundCoord(rawLon) : undefined;

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
		placeholderData: keepPreviousData,
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
			setAppliedFilters: handleSetAppliedFilters,
			locationSource,
			setLocationSource: handleSetLocationSource,
			isLocationReady,
			isResolvingLocation,
			companies,
			isPending,
			isFetchingNextPage,
			hasNextPage,
			fetchNextPage,
			isError,
			getCompanyById,
			locationSheetRef,
			radiusSheetRef,
			openLocationSheet: () => locationSheetRef.current?.snapToIndex(0),
			openRadiusSheet: () => radiusSheetRef.current?.snapToIndex(0),
		}),
		[
			appliedFilters,
			handleSetAppliedFilters,
			locationSource,
			handleSetLocationSource,
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
