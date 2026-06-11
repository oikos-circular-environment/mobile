import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
	fireEvent,
	render,
	screen,
	userEvent,
	waitFor,
} from "@testing-library/react-native";
import type React from "react";
import MarketScreen from "@/app/(tabs)/market";
import { useAuthContext } from "@/contexts/auth-context";
import { useGeospatial } from "@/contexts/geospatial-context";
import { MarketProvider } from "@/contexts/market-context";
import { isCompanyOpenNow } from "@/libs/market/is-company-open";
import { getV1Market } from "@/libs/oikos-sdk";
import {
	makeCompany,
	makeCompanyList,
	makeService,
	makeWaste,
} from "@/tests/factories";


jest.mock("expo-router", () => ({
	Link: ({
		children,
		asChild,
	}: {
		children: React.ReactNode;
		asChild?: boolean;
		href?: unknown;
	}) => {
		const React = require("react");
		const { Pressable } = require("react-native");
		if (asChild) {
			const child = React.Children.only(children);
			return React.cloneElement(child, { onPress: jest.fn() });
		}
		return React.createElement(Pressable, { onPress: jest.fn() }, children);
	},
}));

jest.mock("@/contexts/auth-context");
jest.mock("@/contexts/geospatial-context");

jest.mock("@/libs/oikos-sdk", () => ({
	getV1Market: jest.fn(),
}));

jest.mock("@/libs/market/is-company-open", () => ({
	isCompanyOpenNow: jest.fn(() => true),
}));

// Stub sem dependências nativas — expõe botões testáveis de raio
jest.mock("@/components/market/location-source-bottom-sheet", () => ({
	LocationSourceBottomSheet: () => {
		const { View } = require("react-native");
		return <View testID="location-source-stub" />;
	},
}));

// Stub com botões de raio que chamam setAppliedFilters diretamente
jest.mock("@/components/market/radius-bottom-sheet", () => ({
	RadiusBottomSheet: function MockRadiusBottomSheet() {
		const { useMarket } = require("@/contexts/market-context");
		const { Pressable, Text, View } = require("react-native");
		const { appliedFilters, setAppliedFilters } = useMarket();
		return (
			<View>
				{(
					[
						{ value: "2000", label: "2 km" },
						{ value: "10000", label: "10 km" },
						{ value: "20000", label: "20 km" },
					] as const
				).map(opt => (
					<Pressable
						key={opt.value}
						testID={`radius-btn-${opt.value}`}
						onPress={() =>
							setAppliedFilters({ ...appliedFilters, radius: opt.value })
						}
					>
						<Text>{opt.label}</Text>
					</Pressable>
				))}
			</View>
		);
	},
}));


const COORDS = { latitude: -23.55, longitude: -46.63 };

const defaultGeospatial = {
	currentDate: new Date("2026-06-11T10:00:00"),
	heading: null,
	location: { coords: COORDS } as never,
	addresses: [],
	permissionDenied: false,
	isResolving: false,
	reverseGeocodeError: false,
};

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


function setupGeospatial(overrides: Partial<typeof defaultGeospatial> = {}) {
	jest
		.mocked(useGeospatial)
		.mockReturnValue({ ...defaultGeospatial, ...overrides });
}

function setupAuth(overrides: Partial<typeof defaultAuth> = {}) {
	jest.mocked(useAuthContext).mockReturnValue({ ...defaultAuth, ...overrides });
}

function mockMarketResponse(
	companies: ReturnType<typeof makeCompany>[],
	nextCursor: string | null = null,
) {
	jest.mocked(getV1Market).mockResolvedValue({
		data: { companies, next_cursor: nextCursor },
	} as unknown as Awaited<ReturnType<typeof getV1Market>>);
}

async function renderMarket() {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	});
	return await render(
		<QueryClientProvider client={queryClient}>
			<MarketProvider>
				<MarketScreen />
			</MarketProvider>
		</QueryClientProvider>,
	);
}


describe("Market — filtros (integração)", () => {
	beforeEach(() => {
		jest.useFakeTimers();
		setupGeospatial();
		setupAuth();
		mockMarketResponse([]);
		jest.mocked(isCompanyOpenNow).mockReturnValue(true);
	});

	afterEach(() => {
		jest.useRealTimers();
		jest.clearAllMocks();
	});


	describe("carga de dados", () => {
		it("renderiza lista com 25 empresas e exibe contador correto", async () => {
			const companies = makeCompanyList(25);
			mockMarketResponse(companies);
			await renderMarket();

			expect(await screen.findByText("25 resultados")).toBeOnTheScreen();
			expect(screen.getByText(companies[0].business_name)).toBeOnTheScreen();
			expect(screen.getByText(companies[9].business_name)).toBeOnTheScreen();
		});

		it("exibe estado vazio quando API retorna lista vazia", async () => {
			mockMarketResponse([]);
			await renderMarket();

			expect(
				await screen.findByText(
					"Nenhuma empresa encontrada para os filtros aplicados.",
				),
			).toBeOnTheScreen();
		});
	});


	describe("filtro de categoria", () => {
		it("chama API com category=waste ao pressionar Resíduos", async () => {
			const user = userEvent.setup();
			const wasteCompany = makeCompany({ wastes: [makeWaste()], services: [] });
			mockMarketResponse([wasteCompany]);
			await renderMarket();

			await screen.findByText("1 resultados");

			await user.press(screen.getByText("Resíduos"));

			await waitFor(() => {
				expect(getV1Market).toHaveBeenCalledWith(
					expect.objectContaining({
						query: expect.objectContaining({ category: "waste" }),
					}),
				);
			});
		});

		it("chama API com category=services ao pressionar Serviços", async () => {
			const user = userEvent.setup();
			const serviceCompany = makeCompany({
				wastes: [],
				services: [makeService()],
			});
			mockMarketResponse([serviceCompany]);
			await renderMarket();

			await screen.findByText("1 resultados");

			await user.press(screen.getByText("Serviços"));

			await waitFor(() => {
				expect(getV1Market).toHaveBeenCalledWith(
					expect.objectContaining({
						query: expect.objectContaining({ category: "services" }),
					}),
				);
			});
		});

		it("remove filtro de categoria ao pressionar Resíduos duas vezes", async () => {
			const user = userEvent.setup();
			mockMarketResponse([makeCompany()]);
			await renderMarket();

			await screen.findByText("1 resultados");

			await user.press(screen.getByText("Resíduos"));
			await user.press(screen.getByText("Resíduos"));

			await waitFor(() => {
				const calls = jest.mocked(getV1Market).mock.calls;
				const lastCall = calls[calls.length - 1][0];
				expect(lastCall?.query?.category).toBeUndefined();
			});
		});
	});


	describe("filtro de texto", () => {
		it("chama API com q preenchido ao submeter busca", async () => {
			mockMarketResponse([makeCompany()]);
			await renderMarket();

			await screen.findByText("1 resultados");

			const input = screen.getByPlaceholderText(
				"Empresas, resíduos ou serviços",
			);
			fireEvent.changeText(input, "Recicladora");
			fireEvent(input, "submitEditing");

			await waitFor(() => {
				expect(getV1Market).toHaveBeenCalledWith(
					expect.objectContaining({
						query: expect.objectContaining({ q: "Recicladora" }),
					}),
				);
			});
		});
	});


	describe("filtro de raio", () => {
		it("chama API com radius=10000 ao selecionar 10 km", async () => {
			mockMarketResponse([makeCompany()]);
			await renderMarket();

			await waitFor(() => {
				expect(screen.getByTestId("radius-btn-10000")).toBeOnTheScreen();
			});
			fireEvent.press(screen.getByTestId("radius-btn-10000"));

			await waitFor(() => {
				expect(getV1Market).toHaveBeenCalledWith(
					expect.objectContaining({
						query: expect.objectContaining({ radius: 10000 }),
					}),
				);
			});
		});

		it("chama API com radius=20000 ao selecionar 20 km", async () => {
			mockMarketResponse([makeCompany()]);
			await renderMarket();

			await waitFor(() => {
				expect(screen.getByTestId("radius-btn-20000")).toBeOnTheScreen();
			});
			fireEvent.press(screen.getByTestId("radius-btn-20000"));

			await waitFor(() => {
				expect(getV1Market).toHaveBeenCalledWith(
					expect.objectContaining({
						query: expect.objectContaining({ radius: 20000 }),
					}),
				);
			});
		});
	});
});
