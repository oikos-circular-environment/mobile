import { render, screen } from "@testing-library/react-native";
import type React from "react";
import { useAuthContext } from "@/contexts/auth-context";
import { useGeospatial } from "@/contexts/geospatial-context";
import { useMarket } from "@/contexts/market-context";

jest.mock("@/contexts/auth-context");
jest.mock("@/contexts/geospatial-context");
jest.mock("@/contexts/market-context");

const defaultAuth = {
	user: null,
	isAuthenticated: false,
	isLoading: false,
	needsProfileCompletion: false,
	signIn: jest.fn(),
	signUp: jest.fn(),
	signOut: jest.fn(),
	updateUserProfile: jest.fn(),
};

const setAppliedFilters = jest.fn();

const defaultGeospatial = {
	currentDate: new Date("2025-06-05T12:00:00"),
	heading: null,
	location: null,
	addresses: [],
	permissionDenied: false,
	isResolving: false,
	reverseGeocodeError: false,
};

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

function setupAuth(overrides: Partial<typeof defaultAuth> = {}) {
	jest.mocked(useAuthContext).mockReturnValue({
		...defaultAuth,
		...overrides,
	});
}

function setupGeospatial(overrides: Partial<typeof defaultGeospatial> = {}) {
	jest.mocked(useGeospatial).mockReturnValue({
		...defaultGeospatial,
		...overrides,
	});
}

function setupMarket(overrides: Partial<typeof defaultMarket> = {}) {
	jest.mocked(useMarket).mockReturnValue({
		...defaultMarket,
		...overrides,
	});
}

describe("MarketListHeader", () => {
	beforeEach(() => {
		jest.useFakeTimers();
		setupAuth();
		setupGeospatial();
		setupMarket();
	});

	afterEach(() => {
		jest.useRealTimers();
		jest.clearAllMocks();
	});

	const { MarketListHeader } = jest.requireActual(
		"@/components/market/list-header-market",
	);

	async function renderHeader() {
		return await render(<MarketListHeader />);
	}

	describe("botão de raio", () => {
		it("exibe '2 km' quando appliedFilters.radius é '2000'", async () => {
			await renderHeader();
			expect(screen.getByText("2 km")).toBeOnTheScreen();
		});

		it("exibe '10 km' quando appliedFilters.radius é '10000'", async () => {
			setupMarket({
				appliedFilters: { query: "", radius: "10000", category: undefined },
			});
			await renderHeader();
			expect(screen.getByText("10 km")).toBeOnTheScreen();
		});

		it("exibe '40 km' quando appliedFilters.radius é '40000'", async () => {
			setupMarket({
				appliedFilters: { query: "", radius: "40000", category: undefined },
			});
			await renderHeader();
			expect(screen.getByText("40 km")).toBeOnTheScreen();
		});
	});

	describe("botões de categoria", () => {
		it("chama setAppliedFilters com category='waste' ao pressionar Resíduos", async () => {
			const userEvent = require("@testing-library/react-native").userEvent;
			const user = userEvent.setup();
			await renderHeader();

			await user.press(screen.getByText("Resíduos"));

			expect(setAppliedFilters).toHaveBeenCalledWith(
				expect.objectContaining({ category: "waste" }),
			);
		});

		it("chama setAppliedFilters com category='services' ao pressionar Serviços", async () => {
			const userEvent = require("@testing-library/react-native").userEvent;
			const user = userEvent.setup();
			await renderHeader();

			await user.press(screen.getByText("Serviços"));

			expect(setAppliedFilters).toHaveBeenCalledWith(
				expect.objectContaining({ category: "services" }),
			);
		});

		it("desativa categoria ao pressionar botão já ativo (2º clique)", async () => {
			const userEvent = require("@testing-library/react-native").userEvent;
			const user = userEvent.setup();
			await renderHeader();

			await user.press(screen.getByText("Resíduos"));
			expect(setAppliedFilters).toHaveBeenLastCalledWith(
				expect.objectContaining({ category: "waste" }),
			);

			await user.press(screen.getByText("Resíduos"));
			expect(setAppliedFilters).toHaveBeenLastCalledWith(
				expect.objectContaining({ category: undefined }),
			);
		});

		it("preserva o raio do contexto ao mudar categoria", async () => {
			const userEvent = require("@testing-library/react-native").userEvent;
			const user = userEvent.setup();
			setupMarket({
				appliedFilters: { query: "", radius: "30000", category: undefined },
			});
			await renderHeader();

			await user.press(screen.getByText("Resíduos"));

			expect(setAppliedFilters).toHaveBeenCalledWith(
				expect.objectContaining({ radius: "30000", category: "waste" }),
			);
		});
	});
});
