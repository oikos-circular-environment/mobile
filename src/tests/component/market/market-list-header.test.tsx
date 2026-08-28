import type BottomSheet from "@gorhom/bottom-sheet";
import { render, screen } from "@testing-library/react-native";
import { createRef } from "react";
import { useAuthContext } from "@/contexts/auth-context";
import { useGeospatial } from "@/contexts/geospatial-context";
import { useMarket } from "@/contexts/market-context";
import { makeAddress, makeProfile, makeUser } from "@/tests/factories";

jest.mock("@/contexts/auth-context");
jest.mock("@/contexts/geospatial-context");
jest.mock("@/contexts/market-context");

jest.mock("@/components/market/radius-bottom-sheet", () => ({
	formatRadiusLabel: (value: string) => `${Number(value) / 1000} km`,
	RadiusBottomSheet: () => null,
}));

const setAppliedFilters = jest.fn();
const radiusSheetRef = createRef<BottomSheet>();
const locationSheetRef = createRef<BottomSheet>();

const defaultAuth: ReturnType<typeof useAuthContext> = {
	user: null,
	isAuthenticated: false,
	isLoading: false,
	needsProfileCompletion: false,
	deletionScheduledAt: null,
	signIn: jest.fn(),
	signUp: jest.fn(),
	signOut: jest.fn(),
	refreshSession: jest.fn(),
	requestDeletion: jest.fn(),
	cancelDeletion: jest.fn(),
	isRequestingDeletion: false,
	account: null,
	changePassword: jest.fn(),
	isChangingPassword: false,
	isCancellingDeletion: false,
	updateUserProfile: jest.fn(),
};

const defaultGeospatial = {
	heading: null,
	location: null,
	addresses: [],
	permissionDenied: false,
	isResolving: false,
	reverseGeocodeError: false,
};

const defaultMarket: ReturnType<typeof useMarket> = {
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

function setupAuth(overrides: Partial<typeof defaultAuth> = {}) {
	jest.mocked(useAuthContext).mockReturnValue({ ...defaultAuth, ...overrides });
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
		"@/components/market/market-list-header",
	);

	async function renderHeader() {
		return await render(<MarketListHeader />);
	}

	describe("trigger de localização", () => {
		it("exibe endereço geocodificado quando locationSource é 'current'", async () => {
			setupGeospatial({
				addresses: [
					{
						streetNumber: "123",
						street: "Rua das Flores",
						district: "Centro",
					} as never,
				],
			});
			setupMarket({ locationSource: "current" });

			await renderHeader();

			expect(screen.getByText("123, Rua das Flores, Centro")).toBeOnTheScreen();
		});

		it("exibe endereço do perfil quando locationSource é 'profile'", async () => {
			const address = makeAddress({
				street: "Av. Paulista",
				number: "1000",
				district: "Bela Vista",
			});
			setupAuth({ user: makeUser({ profile: makeProfile({ address }) }) });
			setupMarket({ locationSource: "profile" });

			await renderHeader();

			expect(
				screen.getByText("Av. Paulista, 1000, Bela Vista"),
			).toBeOnTheScreen();
		});

		it("exibe endereço geocodificado mesmo com perfil preenchido quando locationSource é 'current'", async () => {
			setupGeospatial({
				addresses: [
					{
						streetNumber: "42",
						street: "Rua GPS",
						district: "Bairro GPS",
					} as never,
				],
			});
			const address = makeAddress({ street: "Av. Perfil", number: "999" });
			setupAuth({ user: makeUser({ profile: makeProfile({ address }) }) });
			setupMarket({ locationSource: "current" });

			await renderHeader();

			expect(screen.getByText("42, Rua GPS, Bairro GPS")).toBeOnTheScreen();
			expect(screen.queryByText(/Av\. Perfil/)).not.toBeOnTheScreen();
		});

		it("exibe skeleton quando locationSource é 'current' sem endereço geocodificado", async () => {
			setupGeospatial({ addresses: [] });
			setupMarket({ locationSource: "current" });

			await renderHeader();

			expect(screen.queryByText(/Rua|Av\./)).not.toBeOnTheScreen();
		});
	});

	describe("botão de raio", () => {
		it("exibe 'Raio 2 km' quando appliedFilters.radius é '2000'", async () => {
			await renderHeader();
			expect(screen.getByText("Raio 2 km")).toBeOnTheScreen();
		});

		it("exibe 'Raio 10 km' quando appliedFilters.radius é '10000'", async () => {
			setupMarket({
				appliedFilters: { query: "", radius: "10000", category: undefined },
			});
			await renderHeader();
			expect(screen.getByText("Raio 10 km")).toBeOnTheScreen();
		});

		it("exibe 'Raio 40 km' quando appliedFilters.radius é '40000'", async () => {
			setupMarket({
				appliedFilters: { query: "", radius: "40000", category: undefined },
			});
			await renderHeader();
			expect(screen.getByText("Raio 40 km")).toBeOnTheScreen();
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
