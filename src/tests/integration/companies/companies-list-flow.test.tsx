import { render, screen, userEvent } from "@testing-library/react-native";
import { router, useRouter } from "expo-router";
import CompaniesListScreen from "@/app/(tabs)/(home)/companies/index";
import type { Company } from "@/stores/companies-store";
import { useCompaniesStore } from "@/stores/companies-store";
import { makeStoreCompany } from "@/tests/factories";

jest.mock("expo-router", () => ({
	useRouter: jest.fn(),
	router: { push: jest.fn() },
}));

jest.mock("@/stores/companies-store", () => ({
	useCompaniesStore: jest.fn(),
}));

const mockCompany = makeStoreCompany({
	id: "company-1",
	business_name: "Reciclagem Express",
	corporate_name: "Reciclagem Express Ltda",
	identity: "12.345.678/0001-99",
	phones: ["11999999999"],
});

const mockPush = jest.fn();

function setupStore(companies: Company[] = [], isLoaded = true) {
	jest
		.mocked(useCompaniesStore)
		.mockImplementation(selector => selector({ companies, isLoaded } as never));
}

async function renderScreen() {
	return await render(<CompaniesListScreen />);
}

describe("CompaniesListScreen — integração", () => {
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

	it("exibe título, descrição e seção Minhas Empresas no cabeçalho", async () => {
		await renderScreen();

		expect(screen.getByText("Empresas")).toBeOnTheScreen();
		expect(
			screen.getByText("Gerencie suas empresas cadastradas na plataforma."),
		).toBeOnTheScreen();
		expect(screen.getByText("Minhas Empresas")).toBeOnTheScreen();
	});

	it("exibe botão Nova Empresa no cabeçalho", async () => {
		await renderScreen();

		expect(screen.getByText("Nova Empresa")).toBeOnTheScreen();
	});

	it("navega para criação de empresa ao pressionar Nova Empresa", async () => {
		const user = userEvent.setup();
		await renderScreen();

		await user.press(screen.getByText("Nova Empresa"));

		expect(jest.mocked(router.push)).toHaveBeenCalledWith({
			pathname: "/(tabs)/(home)/companies/[companyId]/company",
			params: { companyId: "new-company" },
		});
	});

	it("exibe business_name como título e corporate_name como subtítulo quando ambos presentes", async () => {
		setupStore([mockCompany]);
		await renderScreen();

		expect(await screen.findByText("Reciclagem Express")).toBeOnTheScreen();
		expect(screen.getByText("Reciclagem Express Ltda")).toBeOnTheScreen();
	});

	it("exibe corporate_name como único título quando business_name é nulo", async () => {
		setupStore([{ ...mockCompany, business_name: null } as unknown as Company]);
		await renderScreen();

		expect(
			await screen.findByText("Reciclagem Express Ltda"),
		).toBeOnTheScreen();
		// corporate_name não deve aparecer duplicado como subtítulo
		expect(screen.getAllByText("Reciclagem Express Ltda")).toHaveLength(1);
	});

	it("exibe a identity da empresa no card", async () => {
		setupStore([mockCompany]);
		await renderScreen();

		expect(await screen.findByText("12.345.678/0001-99")).toBeOnTheScreen();
	});

	it("exibe badge Ativa quando status é true", async () => {
		setupStore([{ ...mockCompany, status: true }]);
		await renderScreen();

		expect(await screen.findByText("Ativa")).toBeOnTheScreen();
		expect(screen.queryByText("Inativa")).not.toBeOnTheScreen();
	});

	it("exibe badge Inativa quando status é false", async () => {
		setupStore([{ ...mockCompany, status: false }]);
		await renderScreen();

		expect(await screen.findByText("Inativa")).toBeOnTheScreen();
		expect(screen.queryByText("Ativa")).not.toBeOnTheScreen();
	});

	it("exibe badge Perfil incompleto quando is_company_valid é false", async () => {
		setupStore([{ ...mockCompany, is_company_valid: false }]);
		await renderScreen();

		expect(await screen.findByText("Perfil incompleto")).toBeOnTheScreen();
	});

	it("não exibe badge Perfil incompleto quando is_company_valid é true", async () => {
		setupStore([{ ...mockCompany, is_company_valid: true }]);
		await renderScreen();

		await screen.findByText("Reciclagem Express");
		expect(screen.queryByText("Perfil incompleto")).not.toBeOnTheScreen();
	});

	it("navega para o detalhe da empresa ao pressionar o card", async () => {
		const user = userEvent.setup();
		setupStore([mockCompany]);
		await renderScreen();

		await user.press(await screen.findByText("Reciclagem Express"));

		expect(mockPush).toHaveBeenCalledWith({
			pathname: "/(tabs)/(home)/companies/[companyId]",
			params: { companyId: "company-1" },
		});
	});

	it("navega para o detalhe correto quando há múltiplas empresas", async () => {
		const user = userEvent.setup();
		const company2: Company = {
			...mockCompany,
			id: "company-2",
			business_name: "Coleta Verde",
			corporate_name: "Coleta Verde Ltda",
		};
		setupStore([mockCompany, company2]);
		await renderScreen();

		await user.press(await screen.findByText("Coleta Verde"));

		expect(mockPush).toHaveBeenCalledWith({
			pathname: "/(tabs)/(home)/companies/[companyId]",
			params: { companyId: "company-2" },
		});
		expect(mockPush).not.toHaveBeenCalledWith(
			expect.objectContaining({ params: { companyId: "company-1" } }),
		);
	});
});
