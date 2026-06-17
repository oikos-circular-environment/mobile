import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { useLocalSearchParams } from "expo-router";
import CompanyHubScreen from "@/app/(tabs)/(home)/companies/[companyId]/index";
import { useCompanyValidations } from "@/components/companies/hooks/use-company-validations";
import { useToggleCompanyStatus } from "@/components/companies/hooks/use-toggle-company-status";
import type { Company } from "@/stores/companies-store";
import { useCompaniesStore } from "@/stores/companies-store";
import { makeStoreCompany } from "@/tests/factories";

jest.mock("expo-router", () => ({
	Link: ({
		children,
	}: {
		href: string;
		asChild?: boolean;
		children: React.ReactNode;
	}) => {
		const React = require("react");
		return <>{children}</>;
	},
	useLocalSearchParams: jest.fn(),
}));

jest.mock("@/stores/companies-store", () => ({
	useCompaniesStore: jest.fn(),
}));

jest.mock("@/components/companies/hooks/use-company-validations");
jest.mock("@/components/companies/hooks/use-toggle-company-status");

jest.mock("@/components/ui/switch", () => ({
	Switch: ({
		value,
		onValueChange,
		isDisabled,
	}: {
		value: boolean;
		onValueChange: (v: boolean) => void;
		isDisabled?: boolean;
	}) => {
		const React = require("react");
		const { Switch: RNSwitch } = require("react-native");
		return (
			<RNSwitch
				testID="company-status-switch"
				value={value}
				onValueChange={onValueChange}
				disabled={isDisabled}
			/>
		);
	},
}));

type ValidationData = {
	general_registration: boolean;
	address: boolean;
	business_hours: boolean;
	services: boolean;
	wastes: boolean;
};

const ALL_FALSE: ValidationData = {
	general_registration: false,
	address: false,
	business_hours: false,
	services: false,
	wastes: false,
};

const ALL_TRUE: ValidationData = {
	general_registration: true,
	address: true,
	business_hours: true,
	services: true,
	wastes: true,
};

const mockCompany = makeStoreCompany({
	id: "company-1",
	business_name: "Empresa Teste",
	corporate_name: "Empresa Teste Ltda",
});

function createQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: { retry: false, gcTime: 0 },
			mutations: { retry: false, gcTime: 0 },
		},
	});
}

function setupStore(
	company: Company | null = makeStoreCompany({
		id: "company-1",
		business_name: "Empresa Teste",
		corporate_name: "Empresa Teste Ltda",
	}),
	isLoaded = true,
) {
	jest
		.mocked(useCompaniesStore)
		.mockImplementation(selector =>
			selector({ companies: company ? [company] : [], isLoaded } as never),
		);
}

function setupValidation(data: Partial<ValidationData> = {}) {
	jest.mocked(useCompanyValidations).mockReturnValue({
		data: { ...ALL_FALSE, ...data },
	} as never);
}

const mockToggle = jest.fn();
let queryClient: QueryClient;

async function renderScreen() {
	queryClient = createQueryClient();
	await render(
		<QueryClientProvider client={queryClient}>
			<CompanyHubScreen />
		</QueryClientProvider>,
	);
}

describe("CompanyHubScreen — integração", () => {
	beforeEach(() => {
		jest
			.mocked(useLocalSearchParams)
			.mockReturnValue({ companyId: "company-1" });
		setupStore();
		setupValidation();
		jest.mocked(useToggleCompanyStatus).mockReturnValue({
			mutate: mockToggle,
			isPending: false,
		} as never);
	});

	afterEach(async () => {
		await act(async () => {});
		queryClient?.clear();
		jest.clearAllMocks();
	});

	describe("badges de validação — Empresa", () => {
		it("exibe badge quando general_registration é false", async () => {
			await renderScreen();
			expect(
				screen.getByText("Todos os dados obrigatórios devem ser preenchidos"),
			).toBeOnTheScreen();
		});

		it("oculta badge quando general_registration é true", async () => {
			setupValidation({ general_registration: true });
			await renderScreen();
			expect(
				screen.queryByText("Todos os dados obrigatórios devem ser preenchidos"),
			).toBeNull();
		});
	});

	describe("badges de validação — Endereço", () => {
		it("exibe badge quando address é false", async () => {
			await renderScreen();
			expect(
				screen.getByText("Todos os dados obrigatórios devem ser preenchidos."),
			).toBeOnTheScreen();
		});

		it("oculta badge quando address é true", async () => {
			setupValidation({ address: true });
			await renderScreen();
			expect(
				screen.queryByText(
					"Todos os dados obrigatórios devem ser preenchidos.",
				),
			).toBeNull();
		});
	});

	describe("badges de validação — Funcionamento", () => {
		it("exibe badge quando business_hours é false", async () => {
			await renderScreen();
			expect(
				screen.getByText("Deve abrir ao menos 1x na semana."),
			).toBeOnTheScreen();
		});

		it("oculta badge quando business_hours é true", async () => {
			setupValidation({ business_hours: true });
			await renderScreen();
			expect(
				screen.queryByText("Deve abrir ao menos 1x na semana."),
			).toBeNull();
		});
	});

	describe("badges de validação — Serviços e Resíduos", () => {
		it("exibe 2 badges quando services e wastes são false", async () => {
			await renderScreen();
			expect(
				screen.getAllByText(
					"Deve haver ao menos 1 (um) Serviço ou Resíduo cadastrado.",
				),
			).toHaveLength(2);
		});

		it("oculta badge de Serviços quando services é true", async () => {
			setupValidation({ services: true });
			await renderScreen();
			expect(
				screen.getAllByText(
					"Deve haver ao menos 1 (um) Serviço ou Resíduo cadastrado.",
				),
			).toHaveLength(1);
		});

		it("oculta badge de Resíduos quando wastes é true", async () => {
			setupValidation({ wastes: true });
			await renderScreen();
			expect(
				screen.getAllByText(
					"Deve haver ao menos 1 (um) Serviço ou Resíduo cadastrado.",
				),
			).toHaveLength(1);
		});

		it("oculta ambos os badges quando services e wastes são true", async () => {
			setupValidation({ services: true, wastes: true });
			await renderScreen();
			expect(
				screen.queryByText(
					"Deve haver ao menos 1 (um) Serviço ou Resíduo cadastrado.",
				),
			).toBeNull();
		});
	});

	describe("validação completa", () => {
		it("nenhum badge visível quando todas as validações são true", async () => {
			setupValidation(ALL_TRUE);
			await renderScreen();
			expect(
				screen.queryByText("Todos os dados obrigatórios devem ser preenchidos"),
			).toBeNull();
			expect(
				screen.queryByText(
					"Todos os dados obrigatórios devem ser preenchidos.",
				),
			).toBeNull();
			expect(
				screen.queryByText("Deve abrir ao menos 1x na semana."),
			).toBeNull();
			expect(
				screen.queryByText(
					"Deve haver ao menos 1 (um) Serviço ou Resíduo cadastrado.",
				),
			).toBeNull();
		});
	});

	describe("status da empresa", () => {
		it("exibe switch de status quando empresa está registrada", async () => {
			await renderScreen();
			expect(screen.getByTestId("company-status-switch")).toBeOnTheScreen();
		});

		it("não exibe switch quando empresa não está registrada", async () => {
			setupStore(null);
			await renderScreen();
			expect(screen.queryByTestId("company-status-switch")).toBeNull();
		});

		it("toggle chama mutate com o novo valor", async () => {
			await renderScreen();
			fireEvent(
				screen.getByTestId("company-status-switch"),
				"valueChange",
				false,
			);
			expect(mockToggle).toHaveBeenCalledWith(false);
		});
	});
});
