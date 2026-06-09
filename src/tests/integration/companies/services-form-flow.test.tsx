import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import ServiceFormScreen from "@/app/(tabs)/(home)/companies/[companyId]/services/form";
import { useSaveServices } from "@/components/companies/hooks/use-save-services";
import type { Company } from "@/stores/companies-store";
import { useCompaniesStore } from "@/stores/companies-store";

jest.mock("expo-router", () => ({
	useLocalSearchParams: jest.fn(),
	useRouter: jest.fn(),
}));

jest.mock("@/stores/companies-store", () => ({
	useCompaniesStore: jest.fn(),
}));

jest.mock("@/components/companies/hooks/use-save-services");

jest.mock("@/components/ui/decimal-input", () => ({
	DecimalInput: ({ children }: { children: React.ReactNode }) => {
		const React = require("react");
		const { View } = require("react-native");
		return <View>{children}</View>;
	},
	DecimalInputField: ({
		value,
		onChangeText,
		placeholder,
	}: {
		value: unknown;
		onChangeText: (text: string) => void;
		placeholder?: string;
	}) => {
		const React = require("react");
		const { TextInput } = require("react-native");
		return (
			<TextInput
				value={value as string}
				onChangeText={onChangeText}
				placeholder={placeholder}
			/>
		);
	},
	DecimalInputSlot: ({ children }: { children: React.ReactNode }) => {
		const React = require("react");
		const { View } = require("react-native");
		return <View>{children}</View>;
	},
	DecimalInputIcon: () => null,
}));

jest.mock("@/components/companies/waste-category", () => ({
	WasteCategory: ({
		onSelectionChange,
		children,
	}: {
		onSelectionChange: (cat: { id: string; name: string }) => void;
		children: React.ReactNode;
	}) => {
		const React = require("react");
		const { Pressable, View } = require("react-native");
		return (
			<View>
				<Pressable
					testID="mock-select-category"
					onPress={() => onSelectionChange({ id: "cat-1", name: "Recicláveis" })}
				/>
				{children}
			</View>
		);
	},
	WasteCategoryChips: () => null,
	WasteCategoryContent: () => null,
}));

const mockService = {
	id: "svc-1",
	name: "Coleta de RCC",
	description: "Resíduos de construção civil",
	price: 150,
	quantity: 1,
	unit: "M3",
	observations: null,
	waste_category_id: "cat-1",
	waste_category: { id: "cat-1", name: "Construção Civil", hazard_levels: [] },
} as unknown as Company["services"][number];

const mockCompany: Company = {
	id: "company-1",
	user_id: "user-1",
	identity: "12.345.678/0001-99",
	identity_type: "CNPJ",
	company_type: "COMPANY",
	status: true,
	business_name: "Empresa Teste",
	corporate_name: "Empresa Teste Ltda",
	email: null,
	phones: [],
	started_activity_in: new Date("2020-01-01"),
	is_company_valid: true,
	avatar: null,
	created_at: new Date(),
	updated_at: new Date(),
	address: null,
	business_hours: [],
	wastes: [],
	services: [mockService],
};

function createQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: { retry: false, gcTime: 0 },
			mutations: { retry: false, gcTime: 0 },
		},
	});
}

function setupStore(company: Company = mockCompany, isLoaded = true) {
	jest
		.mocked(useCompaniesStore)
		.mockImplementation(selector =>
			selector({ companies: [company], isLoaded } as never),
		);
}

const mockSaveAsync = jest.fn().mockResolvedValue({});
let queryClient: QueryClient;
let mockBack: jest.Mock;

async function renderScreen() {
	queryClient = createQueryClient();
	await render(
		<QueryClientProvider client={queryClient}>
			<ServiceFormScreen />
		</QueryClientProvider>,
	);
}

describe("ServiceFormScreen — integração", () => {
	beforeEach(() => {
		mockBack = jest.fn();
		jest.mocked(useRouter).mockReturnValue({
			back: mockBack,
			push: jest.fn(),
			replace: jest.fn(),
		} as unknown as ReturnType<typeof useRouter>);
		jest
			.mocked(useLocalSearchParams)
			.mockReturnValue({ companyId: "company-1" });
		setupStore();
		jest.mocked(useSaveServices).mockReturnValue({
			mutateAsync: mockSaveAsync,
			isPending: false,
		} as unknown as ReturnType<typeof useSaveServices>);
	});

	afterEach(async () => {
		await act(async () => {});
		queryClient?.clear();
		jest.clearAllMocks();
	});

	it("modo criação exibe título de cadastro e campos vazios", async () => {
		await renderScreen();
		expect(screen.getByText("Cadastro de serviços")).toBeOnTheScreen();
		expect(
			screen.getByPlaceholderText("Ex.: Coleta de RCC"),
		).toHaveProp("value", "");
	});

	it("modo edição exibe título de edição e campos pré-preenchidos", async () => {
		jest.mocked(useLocalSearchParams).mockReturnValue({
			companyId: "company-1",
			id: "svc-1",
		});
		await renderScreen();
		expect(screen.getByText("Editar serviço")).toBeOnTheScreen();
		expect(
			screen.getByPlaceholderText("Ex.: Coleta de RCC"),
		).toHaveProp("value", "Coleta de RCC");
	});

	it("botão de submit desabilitado quando nome está vazio", async () => {
		await renderScreen();
		expect(screen.getByTestId("btn-submit")).toBeDisabled();
	});

	it("submit no modo criação chama saveServices com serviço existente e novo", async () => {
		await renderScreen();
		await fireEvent.changeText(
			screen.getByPlaceholderText("Ex.: Coleta de RCC"),
			"Coleta Teste",
		);
		await fireEvent.press(screen.getByTestId("mock-select-category"));
		await waitFor(() =>
			expect(screen.getByTestId("btn-submit")).not.toBeDisabled(),
		);
		await fireEvent.press(screen.getByTestId("btn-submit"));
		await waitFor(() =>
			expect(mockSaveAsync).toHaveBeenCalledWith(
				expect.objectContaining({
					services: expect.arrayContaining([
						expect.objectContaining({ name: "Coleta de RCC" }),
						expect.objectContaining({
							name: "Coleta Teste",
							waste_category_id: "cat-1",
						}),
					]),
				}),
			),
		);
	});

	it("submit no modo edição chama saveServices com serviço atualizado", async () => {
		jest.mocked(useLocalSearchParams).mockReturnValue({
			companyId: "company-1",
			id: "svc-1",
		});
		await renderScreen();
		await fireEvent.changeText(
			screen.getByPlaceholderText("Ex.: Coleta de RCC"),
			"Coleta Atualizada",
		);
		await waitFor(() =>
			expect(screen.getByTestId("btn-submit")).not.toBeDisabled(),
		);
		await fireEvent.press(screen.getByTestId("btn-submit"));
		await waitFor(() =>
			expect(mockSaveAsync).toHaveBeenCalledWith(
				expect.objectContaining({
					services: [
						expect.objectContaining({
							name: "Coleta Atualizada",
							waste_category_id: "cat-1",
						}),
					],
				}),
			),
		);
	});

	it("cancelar chama router.back()", async () => {
		await renderScreen();
		await fireEvent.press(screen.getByTestId("btn-cancel"));
		expect(mockBack).toHaveBeenCalled();
	});
});
