import { render, screen } from "@testing-library/react-native";
import type React from "react";
import { useMarket } from "@/contexts/market-context";

jest.mock("@/contexts/market-context");

const setAppliedFilters = jest.fn();

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

	describe("abertura", () => {
		it("exibe as opções de raio ao pressionar o botão", async () => {
			await renderSheet();

			// Trigger button shows current radius; options are hidden
			expect(screen.getByText("2 km")).toBeOnTheScreen();
			expect(screen.queryByText("5 km")).not.toBeOnTheScreen();
			expect(screen.queryByText("10 km")).not.toBeOnTheScreen();

			const userEvent = require("@testing-library/react-native").userEvent;
			await userEvent.press(screen.getByText("2 km"));

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

			const userEvent = require("@testing-library/react-native").userEvent;
			await userEvent.press(screen.getByText("10 km"));

			expect(
				screen.getByLabelText("Raio de busca: 10 km (selecionado)"),
			).toBeOnTheScreen();
		});
	});

	describe("seleção", () => {
		it("chama setAppliedFilters com o valor selecionado", async () => {
			await renderSheet();

			const userEvent = require("@testing-library/react-native").userEvent;
			await userEvent.press(screen.getByText("2 km"));
			await userEvent.press(screen.getByText("10 km"));

			expect(setAppliedFilters).toHaveBeenCalledWith(
				expect.objectContaining({ radius: "10000" }),
			);
		});

		it("fecha o bottom sheet após selecionar um raio", async () => {
			await renderSheet();

			const userEvent = require("@testing-library/react-native").userEvent;
			await userEvent.press(screen.getByText("2 km"));

			expect(screen.getByText("5 km")).toBeOnTheScreen();

			await userEvent.press(screen.getByText("10 km"));

			expect(screen.queryByText("5 km")).not.toBeOnTheScreen();
		});
	});
});
