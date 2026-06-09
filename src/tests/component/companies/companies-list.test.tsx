import { render, screen, userEvent } from "@testing-library/react-native";
import { useRouter } from "expo-router";
import CompaniesListScreen from "@/app/(tabs)/(home)/companies/index";
import type { Company } from "@/stores/companies-store";
import { useCompaniesStore } from "@/stores/companies-store";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
jest.mock("expo-router", () => ({
	useRouter: jest.fn(),
}));

jest.mock("@/stores/companies-store", () => ({
	useCompaniesStore: jest.fn(),
}));

jest.mock("@/components/companies/company-card", () => ({
	CompanyCard: ({
		company,
		onPress,
	}: {
		company: Company;
		onPress: () => void;
	}) => {
		const { Pressable, View: V } = require("react-native");
		return (
			<V testID={`company-card-${company.id}`}>
				<Pressable
					testID={`company-card-press-${company.id}`}
					onPress={onPress}
				/>
			</V>
		);
	},
}));

jest.mock("@/components/companies/company-card-skeleton", () => ({
	CompanyCardSkeleton: () => {
		const { View: V } = require("react-native");
		return <V testID="company-card-skeleton" />;
	},
}));

jest.mock("@/components/companies/company-list-header", () => ({
	CompanyListHeader: () => {
		const { View: V } = require("react-native");
		return <V testID="company-list-header" />;
	},
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const mockCompany: Company = {
	id: "company-1",
	user_id: "user-1",
	identity: "12.345.678/0001-99",
	identity_type: "CNPJ",
	company_type: "COMPANY",
	status: true,
	business_name: "Reciclagem Express",
	corporate_name: "Reciclagem Express Ltda",
	email: null,
	phones: ["11999999999"],
	started_activity_in: new Date("2020-01-01"),
	is_company_valid: true,
	avatar: null,
	created_at: new Date(),
	updated_at: new Date(),
	address: null,
	business_hours: [],
	wastes: [],
	services: [],
};

const mockPush = jest.fn();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function setupStore(companies: Company[] = [], isLoaded = true) {
	jest
		.mocked(useCompaniesStore)
		.mockImplementation(selector => selector({ companies, isLoaded } as never));
}

async function renderScreen() {
	return await render(<CompaniesListScreen />);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("CompaniesListScreen — componente", () => {
	beforeEach(() => {
		jest.useFakeTimers();
		jest
			.mocked(useRouter)
			.mockReturnValue({ push: mockPush } as unknown as ReturnType<
				typeof useRouter
			>);
		setupStore();
	});

	afterEach(() => {
		jest.useRealTimers();
		jest.clearAllMocks();
	});

	// -----------------------------------------------------------------------
	// Header
	// -----------------------------------------------------------------------
	it("renderiza o CompanyListHeader", async () => {
		await renderScreen();

		expect(screen.getByTestId("company-list-header")).toBeOnTheScreen();
	});

	// -----------------------------------------------------------------------
	// Estado de carregamento
	// -----------------------------------------------------------------------
	it("exibe 3 CompanyCardSkeletons enquanto isLoaded é false", async () => {
		setupStore([], false);
		await renderScreen();

		expect(screen.getAllByTestId("company-card-skeleton")).toHaveLength(3);
	});

	it("não exibe skeletons quando isLoaded é true", async () => {
		setupStore([], true);
		await renderScreen();

		expect(screen.queryByTestId("company-card-skeleton")).not.toBeOnTheScreen();
	});

	// -----------------------------------------------------------------------
	// Estado vazio
	// -----------------------------------------------------------------------
	it("exibe mensagem de lista vazia quando não há empresas e isLoaded é true", async () => {
		setupStore([], true);
		await renderScreen();

		expect(screen.getByText("Nenhuma empresa cadastrada.")).toBeOnTheScreen();
	});

	it("não exibe mensagem de lista vazia quando há empresas", async () => {
		setupStore([mockCompany]);
		await renderScreen();

		expect(
			screen.queryByText("Nenhuma empresa cadastrada."),
		).not.toBeOnTheScreen();
	});

	// -----------------------------------------------------------------------
	// Lista de empresas
	// -----------------------------------------------------------------------
	it("renderiza um card para cada empresa da lista", async () => {
		const company2 = { ...mockCompany, id: "company-2" };
		setupStore([mockCompany, company2]);
		await renderScreen();

		expect(screen.getByTestId("company-card-company-1")).toBeOnTheScreen();
		expect(screen.getByTestId("company-card-company-2")).toBeOnTheScreen();
	});

	it("não exibe cards das outras empresas quando só uma está na lista", async () => {
		setupStore([mockCompany]);
		await renderScreen();

		expect(screen.getByTestId("company-card-company-1")).toBeOnTheScreen();
		expect(
			screen.queryByTestId("company-card-company-2"),
		).not.toBeOnTheScreen();
	});

	// -----------------------------------------------------------------------
	// Navegação
	// -----------------------------------------------------------------------
	it("navega para o detalhe da empresa ao pressionar o card", async () => {
		const user = userEvent.setup();
		setupStore([mockCompany]);
		await renderScreen();

		await user.press(screen.getByTestId("company-card-press-company-1"));

		expect(mockPush).toHaveBeenCalledWith({
			pathname: "/(tabs)/(home)/companies/[companyId]",
			params: { companyId: "company-1" },
		});
	});

	it("cada card navega para o detalhe correto com seu próprio id", async () => {
		const user = userEvent.setup();
		const company2 = { ...mockCompany, id: "company-2" };
		setupStore([mockCompany, company2]);
		await renderScreen();

		await user.press(screen.getByTestId("company-card-press-company-2"));

		expect(mockPush).toHaveBeenCalledWith({
			pathname: "/(tabs)/(home)/companies/[companyId]",
			params: { companyId: "company-2" },
		});
		expect(mockPush).not.toHaveBeenCalledWith(
			expect.objectContaining({ params: { companyId: "company-1" } }),
		);
	});
});
