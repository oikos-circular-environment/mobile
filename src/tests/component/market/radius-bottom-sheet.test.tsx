import { act, render, screen } from "@testing-library/react-native";
import { createRef } from "react";
import type BottomSheet from "@gorhom/bottom-sheet";
import { useMarket } from "@/contexts/market-context";

jest.mock("@/contexts/market-context");

const setAppliedFilters = jest.fn();
const radiusSheetRef = createRef<BottomSheet>();
const locationSheetRef = createRef<BottomSheet>();

const defaultMarket = {
	appliedFilters: { query: "", radius: "2000", category: undefined },
	setAppliedFilters,
	locationSource: "current" as const,
	setLocationSource: jest.fn(),
	isLocationReady: false,
	isResolvingLocation: false,
	companies: [],
	isPending: false,
	isFetchingNextPage: false,
	hasNextPage: false,
	fetchNextPage: jest.fn(),
	isError: false,
	getCompanyById: jest.fn(),
	radiusSheetRef,
	locationSheetRef,
	openLocationSheet: jest.fn(),
	openRadiusSheet: jest.fn(),
};

function setupMarket(overrides: Partial<typeof defaultMarket> = {}) {
	jest.mocked(useMarket).mockReturnValue({
		...defaultMarket,
		...overrides,
	});
}

describe("RadiusBottomSheet", () => {
	beforeEach(() => {
		jest.useFakeTimers();
		setupMarket();
	});

	afterEach(() => {
		jest.useRealTimers();
		jest.clearAllMocks();
	});

	const { RadiusBottomSheet } = jest.requireActual(
		"@/components/market/radius-bottom-sheet",
	);

	async function renderSheet() {
		return await render(<RadiusBottomSheet />);
	}

	async function openSheet() {
		await act(async () => {
			radiusSheetRef.current?.snapToIndex(0);
		});
	}

	describe("abertura", () => {
		it("exibe as opções de raio ao abrir o sheet", async () => {
			await renderSheet();

			expect(screen.queryByText("5 km")).not.toBeOnTheScreen();
			expect(screen.queryByText("10 km")).not.toBeOnTheScreen();

			await openSheet();

			expect(screen.getByText("5 km")).toBeOnTheScreen();
			expect(screen.getByText("10 km")).toBeOnTheScreen();
			expect(screen.getByText("15 km")).toBeOnTheScreen();
			expect(screen.getByText("20 km")).toBeOnTheScreen();
			expect(screen.getByText("30 km")).toBeOnTheScreen();
			expect(screen.getByText("40 km")).toBeOnTheScreen();
		});

		it("marca como selecionado o raio armazenado em appliedFilters", async () => {
			setupMarket({
				appliedFilters: {
					query: "",
					radius: "10000",
					category: undefined,
				},
			});
			await renderSheet();
			await openSheet();

			expect(
				screen.getByLabelText("Raio de busca: 10 km (selecionado)"),
			).toBeOnTheScreen();
		});
	});

	describe("seleção", () => {
		it("chama setAppliedFilters com o valor selecionado", async () => {
			await renderSheet();
			await openSheet();

			const userEvent = require("@testing-library/react-native").userEvent;
			await userEvent.press(screen.getByText("10 km"));

			expect(setAppliedFilters).toHaveBeenCalledWith(
				expect.objectContaining({ radius: "10000" }),
			);
		});

		it("fecha o bottom sheet após selecionar um raio", async () => {
			await renderSheet();
			await openSheet();

			expect(screen.getByText("5 km")).toBeOnTheScreen();

			const userEvent = require("@testing-library/react-native").userEvent;
			await userEvent.press(screen.getByText("10 km"));

			expect(screen.queryByText("5 km")).not.toBeOnTheScreen();
		});
	});
});
