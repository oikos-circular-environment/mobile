import type BottomSheet from "@gorhom/bottom-sheet";
import {
	createContext,
	type PropsWithChildren,
	useContext,
	useRef,
} from "react";
import { BusinessHoursBottomSheet } from "@/components/market/business-hours-bottom-sheet";
import type { MarketSimulationItemType } from "@/libs/memory/market-simulations";
import type { MarketBusinessHour, MarketCompany } from "@/libs/types/market";

type CompanyDetailContextValue = {
	company: MarketCompany;
	isOpenNow: boolean;
	currentBusinessHour: MarketBusinessHour | null;
	currentDayLabel: string;
	currentTimeLabel: string;
	businessHoursSheetRef: React.RefObject<BottomSheet | null>;
	openBusinessHoursSheet: () => void;
	onSelectSimulationItem: (
		itemType: MarketSimulationItemType,
		itemId: string,
	) => void;
};

const CompanyDetailContext = createContext<CompanyDetailContextValue | null>(
	null,
);

type CompanyDetailProviderProps = PropsWithChildren<
	Omit<CompanyDetailContextValue, "businessHoursSheetRef" | "openBusinessHoursSheet">
>;

export function CompanyDetailProvider({
	children,
	...value
}: CompanyDetailProviderProps) {
	const businessHoursSheetRef = useRef<BottomSheet>(null);

	return (
		<CompanyDetailContext.Provider
			value={{
				...value,
				businessHoursSheetRef,
				openBusinessHoursSheet: () =>
					businessHoursSheetRef.current?.snapToIndex(0),
			}}
		>
			{children}
			<BusinessHoursBottomSheet
				ref={businessHoursSheetRef}
				businessHours={value.company.business_hours}
			/>
		</CompanyDetailContext.Provider>
	);
}

export function useCompanyDetail() {
	const ctx = useContext(CompanyDetailContext);
	if (!ctx) {
		throw new Error(
			"useCompanyDetail must be used within CompanyDetailProvider",
		);
	}
	return ctx;
}
