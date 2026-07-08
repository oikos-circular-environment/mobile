import { render, screen, userEvent } from "@testing-library/react-native";
import { router, useRouter } from "expo-router";
import CompaniesListScreen from "@/app/(tabs)/(home)/companies/index";
import type { Company } from "@/libs/types/companies";
import { useCompaniesStore } from "@/stores/companies-store";
import {
	makeAddress,
	makeStoreCompany,
	makeStoreCompanyList,
} from "@/tests/factories";

jest.mock("expo-router", () => ({
	useRouter: jest.fn(),
	router: { push: jest.fn() },
	Stack: { Screen: () => null },
}));

jest.mock("@/stores/companies-store", () => ({
	useCompaniesStore: jest.fn(),
}));

function createCompany(overrides: Partial<Company> = {}): Company {
	return makeStoreCompany({
		id: "company-1",
		business_name: "Reciclagem Express",
		corporate_name: "Reciclagem Express Ltda",
		identity: "12.345.678/0001-99",
		phones: ["11999999999"],
		...overrides,
	});
}

function generateCompanies(count: number): Company[] {
	return makeStoreCompanyList(count, {
		business_name: "",
		corporate_name: "",
	}).map((c, i) => ({
		...c,
		id: `company-${i + 1}`,
		business_name: `Empresa ${i + 1}`,
		corporate_name: `Empresa ${i + 1} Ltda`,
		identity: `${String(i + 1).padStart(2, "0")}.${String(i + 1).padStart(3, "0")}.${String(i + 1).padStart(3, "0")}/0001-${String(i + 1).padStart(2, "0")}`,
		is_company_valid: i % 3 !== 0,
	}));
}

const mockPush = jest.fn();

function setupStore(companies: Company[] = [], isLoaded = true) {
	jest
		.mocked(useCompaniesStore)
		.mockImplementation(selector => selector({ companies, isLoaded } as never));
}

async function renderScreen() {
	return await render(<CompaniesListScreen />);
}

describe("CompaniesListScreen — fluxo completo", () => {
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

	it("lista 10 empresas com todas visíveis na tela (ótimo desempenho)", async () => {
		const companies = generateCompanies(10);
		setupStore(companies);
		await renderScreen();

		for (let i = 1; i <= 10; i++) {
			expect(screen.getByText(`Empresa ${i}`)).toBeOnTheScreen();
		}
	});

	it("cada empresa exibe seu próprio identity (CPF/CNPJ)", async () => {
		const companies = generateCompanies(10);
		setupStore(companies);
		await renderScreen();

		for (let i = 1; i <= 10; i++) {
			const expectedIdentity = `${String(i).padStart(2, "0")}.${String(i).padStart(3, "0")}.${String(i).padStart(3, "0")}/0001-${String(i).padStart(2, "0")}`;
			expect(screen.getByText(expectedIdentity)).toBeOnTheScreen();
		}
	});

	// -----------------------------------------------------------------------
	// Perfil completo → sem badge "Perfil incompleto"
	// também → empresa apta a aparecer no Market
	// -----------------------------------------------------------------------
	it("não exibe badge Perfil incompleto quando is_company_valid é true", async () => {
		const company = createCompany({ is_company_valid: true });
		setupStore([company]);
		await renderScreen();

		expect(await screen.findByText("Reciclagem Express")).toBeOnTheScreen();
		expect(screen.queryByText("Perfil incompleto")).not.toBeOnTheScreen();
	});

	it("exibe badge Perfil incompleto quando is_company_valid é false", async () => {
		const company = createCompany({ is_company_valid: false });
		setupStore([company]);
		await renderScreen();

		expect(await screen.findByText("Perfil incompleto")).toBeOnTheScreen();
	});

	it("empresa com perfil completo está apta a aparecer no Market", async () => {
		// Regra de negócio: is_company_valid === true é um dos pré-requisitos
		// para a empresa ser retornada pela rota GET /v1/market e aparecer
		// na listagem do Market. O badge "Perfil incompleto" não aparece.
		const company = createCompany({
			is_company_valid: true,
			status: true,
			address: makeAddress({
				id: "addr-1",
				zip_code: "01001-000",
				street: "Rua Exemplo",
				number: "100",
				complement: null,
				district: "Centro",
				city: "São Paulo",
				state: "São Paulo",
				state_code: "SP",
				state_ibge_id: 35,
				city_ibge_id: 3550308,
				latitude: -23.55,
				longitude: -46.63,
			}),
			business_hours: [
				{
					id: "bh-1",
					day_of_week: "MONDAY",
					is_open: true,
					time_slots: [{ id: "ts-1", start_time: "08:00", end_time: "18:00" }],
				},
			],
			services: [
				{
					id: "svc-1",
					name: "Coleta de recicláveis",
					description: null,
					price: 0,
					unit: "UNIT",
					waste_category_id: "wc-1",
					waste_category: {
						id: "wc-1",
						name: "Recicláveis",
						description: null,
						observations: null,
						hazard_levels: [],
						created_at: new Date(),
						updated_at: new Date(),
						subcategories: [],
					},
					quantity: 1,
					created_at: new Date(),
					updated_at: new Date(),
				},
			],
		});
		setupStore([company]);
		await renderScreen();

		expect(await screen.findByText("Reciclagem Express")).toBeOnTheScreen();
		expect(screen.queryByText("Perfil incompleto")).not.toBeOnTheScreen();
	});

	it("empresa com perfil incompleto exibe badge e não deve aparecer no Market", async () => {
		// Regra de negócio: is_company_valid === false impede a empresa
		// de ser listada no Market (GET /v1/market filtra por empresas válidas).
		const company = createCompany({
			is_company_valid: false,
			status: true,
		});
		setupStore([company]);
		await renderScreen();

		expect(await screen.findByText("Perfil incompleto")).toBeOnTheScreen();
	});

	it("exibe badge apenas nas empresas com perfil incompleto em lista mista", async () => {
		const validCompany = createCompany({
			id: "company-1",
			business_name: "Válida Ltda",
			is_company_valid: true,
		});
		const invalidCompany = createCompany({
			id: "company-2",
			business_name: "Inválida Ltda",
			is_company_valid: false,
		});
		setupStore([validCompany, invalidCompany]);
		await renderScreen();

		expect(screen.getByText("Válida Ltda")).toBeOnTheScreen();
		expect(screen.getByText("Inválida Ltda")).toBeOnTheScreen();
		expect(screen.getByText("Perfil incompleto")).toBeOnTheScreen();
		// Apenas 1 badge deve aparecer (somente a inválida)
		expect(screen.getAllByText("Perfil incompleto")).toHaveLength(1);
	});

	it("navega para detalhes ao pressionar o company-card", async () => {
		const user = userEvent.setup();
		const company = createCompany({ id: "company-detail-1" });
		setupStore([company]);
		await renderScreen();

		await user.press(await screen.findByText("Reciclagem Express"));

		expect(mockPush).toHaveBeenCalledWith({
			pathname: "/(tabs)/(home)/companies/[companyId]",
			params: { companyId: "company-detail-1" },
		});
	});

	it("cada card navega para o ID correto em lista com múltiplas empresas", async () => {
		const user = userEvent.setup();
		const companies = [
			createCompany({ id: "id-alfa", business_name: "Alfa" }),
			createCompany({ id: "id-beta", business_name: "Beta" }),
			createCompany({ id: "id-gamma", business_name: "Gamma" }),
		];
		setupStore(companies);
		await renderScreen();

		await user.press(screen.getByText("Gamma"));

		expect(mockPush).toHaveBeenCalledWith({
			pathname: "/(tabs)/(home)/companies/[companyId]",
			params: { companyId: "id-gamma" },
		});
		expect(mockPush).not.toHaveBeenCalledWith(
			expect.objectContaining({ params: { companyId: "id-alfa" } }),
		);
	});

	it("navega para tela de criação ao pressionar Nova Empresa", async () => {
		const user = userEvent.setup();
		await renderScreen();

		await user.press(screen.getByText("Nova Empresa"));

		expect(jest.mocked(router.push)).toHaveBeenCalledWith({
			pathname: "/(tabs)/(home)/companies/[companyId]/company",
			params: { companyId: "new-company" },
		});
	});

	it("após cadastrar uma nova empresa, ela aparece na listagem", async () => {
		// Simula o estado pós-criação: a empresa foi adicionada à store
		const newCompany = createCompany({
			id: "company-new-1",
			business_name: "Nova Reciclagem",
			corporate_name: "Nova Reciclagem Ltda",
		});
		setupStore([newCompany]);
		await renderScreen();

		expect(await screen.findByText("Nova Reciclagem")).toBeOnTheScreen();
		expect(screen.getByText("Nova Reciclagem Ltda")).toBeOnTheScreen();
	});
});
