import { render, screen, userEvent } from "@testing-library/react-native";
import type React from "react";
import MarketScreen from "@/app/(tabs)/market";
import { useGeospatial } from "@/contexts/geospatial-context";
import { useMarket } from "@/contexts/market-context";
import { isCompanyOpenNow } from "@/libs/market/is-company-open";
import { makeCompany, makeCompanyList } from "@/tests/factories";


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

jest.mock("@/contexts/market-context");
jest.mock("@/contexts/geospatial-context");
jest.mock("@/libs/market/is-company-open");

jest.mock("@/components/market/list-header-market", () => ({
	MarketListHeader: () => {
		const { View } = require("react-native");
		return <View testID="market-list-header" />;
	},
}));


const defaultGeospatial = {
	currentDate: new Date("2026-06-11T10:00:00"),
	heading: null,
	location: null,
	addresses: [],
	permissionDenied: false,
	isResolving: false,
	reverseGeocodeError: false,
};

const defaultMarket = {
	appliedFilters: { query: "", radius: "2000", category: undefined },
	setAppliedFilters: jest.fn(),
	locationSource: "current" as const,
	setLocationSource: jest.fn(),
	isLocationReady: true,
	isResolvingLocation: false,
	companies: [],
	isPending: false,
	isFetchingNextPage: false,
	hasNextPage: false,
	fetchNextPage: jest.fn(),
	isError: false,
	getCompanyById: jest.fn(),
};


function setupGeospatial(overrides: Partial<typeof defaultGeospatial> = {}) {
	jest
		.mocked(useGeospatial)
		.mockReturnValue({ ...defaultGeospatial, ...overrides });
}

function setupMarket(overrides: Partial<typeof defaultMarket> = {}) {
	jest.mocked(useMarket).mockReturnValue({ ...defaultMarket, ...overrides });
}

async function renderScreen() {
	return await render(<MarketScreen />);
}


describe("MarketScreen", () => {
	beforeEach(() => {
		jest.useFakeTimers();
		setupGeospatial();
		setupMarket();
		jest.mocked(isCompanyOpenNow).mockReturnValue(true);
	});

	afterEach(() => {
		jest.useRealTimers();
		jest.clearAllMocks();
	});


	describe("estados da lista", () => {
		it("não exibe cards de empresa durante carregamento (isPending=true)", async () => {
			const companies = makeCompanyList(3);
			setupMarket({ isPending: true, companies: [] });
			await renderScreen();

			for (const company of companies) {
				expect(screen.queryByText(company.business_name)).not.toBeOnTheScreen();
			}
		});

		it("exibe mensagem de erro quando isError=true", async () => {
			setupMarket({ isError: true, companies: [] });
			await renderScreen();

			expect(screen.getByText("Erro ao carregar")).toBeOnTheScreen();
		});

		it("exibe mensagem de vazio quando não há empresas", async () => {
			setupMarket({ companies: [], isPending: false });
			await renderScreen();

			expect(
				screen.getByText(
					"Nenhuma empresa encontrada para os filtros aplicados.",
				),
			).toBeOnTheScreen();
		});

		it("exibe aviso de endereço quando locationSource=profile sem coordenadas", async () => {
			setupMarket({
				locationSource: "profile",
				isLocationReady: false,
				companies: [],
			});
			await renderScreen();

			expect(screen.getByText("Endereço não configurado")).toBeOnTheScreen();
		});
	});


	describe("cards de empresa", () => {
		it("renderiza 25 empresas geradas pela factory", async () => {
			const companies = makeCompanyList(25);
			setupMarket({ companies });
			await renderScreen();

			expect(screen.getByText(companies[0].business_name)).toBeOnTheScreen();
			expect(screen.getByText(companies[9].business_name)).toBeOnTheScreen();
		});

		it("exibe badge Aberto para empresa aberta", async () => {
			jest.mocked(isCompanyOpenNow).mockReturnValue(true);
			setupMarket({ companies: [makeCompany()] });
			await renderScreen();

			expect(screen.getByText("Aberto")).toBeOnTheScreen();
		});

		it("exibe badge Fechado para empresa fechada", async () => {
			jest.mocked(isCompanyOpenNow).mockReturnValue(false);
			setupMarket({ companies: [makeCompany()] });
			await renderScreen();

			expect(screen.getByText("Fechado")).toBeOnTheScreen();
		});

		it("exibe badge Coletor para empresa do tipo COLLECTOR", async () => {
			setupMarket({ companies: [makeCompany({ company_type: "COLLECTOR" })] });
			await renderScreen();

			expect(screen.getByText("Coletor")).toBeOnTheScreen();
		});

		it("não exibe badge Coletor para empresa do tipo COMPANY", async () => {
			setupMarket({ companies: [makeCompany({ company_type: "COMPANY" })] });
			await renderScreen();

			expect(screen.queryByText("Coletor")).not.toBeOnTheScreen();
		});

		it("renderiza badges dos resíduos da empresa", async () => {
			const { makeWaste } = jest.requireActual("@/tests/factories");
			const waste = makeWaste({ name: "Vidro" });
			setupMarket({ companies: [makeCompany({ wastes: [waste] })] });
			await renderScreen();

			expect(screen.getByText("Vidro")).toBeOnTheScreen();
		});

		it("renderiza badges dos serviços da empresa", async () => {
			const { makeService } = jest.requireActual("@/tests/factories");
			const service = makeService({ name: "Coleta domiciliar" });
			setupMarket({
				companies: [makeCompany({ wastes: [], services: [service] })],
			});
			await renderScreen();

			expect(screen.getByText("Coleta domiciliar")).toBeOnTheScreen();
		});
	});


	describe("paginação", () => {
		it("exibe botão Carregar mais quando hasNextPage=true", async () => {
			setupMarket({ companies: makeCompanyList(5), hasNextPage: true });
			await renderScreen();

			expect(screen.getByText("Carregar mais")).toBeOnTheScreen();
		});

		it("não exibe botão Carregar mais quando hasNextPage=false", async () => {
			setupMarket({ companies: makeCompanyList(5), hasNextPage: false });
			await renderScreen();

			expect(screen.queryByText("Carregar mais")).not.toBeOnTheScreen();
		});

		it("chama fetchNextPage ao pressionar Carregar mais", async () => {
			const user = userEvent.setup();
			const fetchNextPage = jest.fn();
			setupMarket({
				companies: makeCompanyList(5),
				hasNextPage: true,
				fetchNextPage,
			});
			await renderScreen();

			await user.press(screen.getByText("Carregar mais"));

			expect(fetchNextPage).toHaveBeenCalledTimes(1);
		});
	});
});
