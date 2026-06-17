import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import WasteFormScreen from "@/app/(tabs)/(home)/companies/[companyId]/waste/form";
import { useSaveWastes } from "@/components/companies/hooks/use-save-wastes";
import type { Company } from "@/stores/companies-store";
import { useCompaniesStore } from "@/stores/companies-store";
import { makeStoreCompany } from "@/tests/factories";

jest.mock("expo-router", () => ({
	useLocalSearchParams: jest.fn(),
	useRouter: jest.fn(),
}));

jest.mock("@/stores/companies-store", () => ({
	useCompaniesStore: jest.fn(),
}));

jest.mock("@/components/companies/hooks/use-save-wastes");

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

jest.mock("@/components/custom/waste-category", () => ({
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
					onPress={() =>
						onSelectionChange({ id: "cat-1", name: "Recicláveis" })
					}
				/>
				{children}
			</View>
		);
	},
	WasteCategoryChips: () => null,
	WasteCategoryContent: () => null,
}));

const mockWaste = {
	id: "waste-1",
	name: "Papelão",
	description: "Papel e papelão reciclável",
	price: 0.5,
	quantity: 1,
	unit: "KG",
	observations: null,
	waste_category_id: "cat-1",
	waste_category: { id: "cat-1", name: "Recicláveis", hazard_levels: [] },
} as unknown as Company["wastes"][number];

const mockCompany = makeStoreCompany({
	id: "company-1",
	business_name: "Empresa Teste",
	corporate_name: "Empresa Teste Ltda",
	wastes: [mockWaste],
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
	company: Company = makeStoreCompany({
		id: "company-1",
		business_name: "Empresa Teste",
		corporate_name: "Empresa Teste Ltda",
		wastes: [mockWaste],
	}),
	isLoaded = true,
) {
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
			<WasteFormScreen />
		</QueryClientProvider>,
	);
}

describe("WasteFormScreen — integração", () => {
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
		jest.mocked(useSaveWastes).mockReturnValue({
			mutateAsync: mockSaveAsync,
			isPending: false,
		} as unknown as ReturnType<typeof useSaveWastes>);
	});

	afterEach(async () => {
		await act(async () => {});
		queryClient?.clear();
		jest.clearAllMocks();
	});

	it("modo criação exibe título de cadastro e campos vazios", async () => {
		await renderScreen();
		expect(screen.getByText("Cadastro de resíduos")).toBeOnTheScreen();
		expect(screen.getByPlaceholderText("Ex.: Plástico")).toHaveProp(
			"value",
			"",
		);
	});

	it("modo edição exibe título de edição e campos pré-preenchidos", async () => {
		jest.mocked(useLocalSearchParams).mockReturnValue({
			companyId: "company-1",
			id: "waste-1",
		});
		await renderScreen();
		expect(screen.getByText("Editar resíduo")).toBeOnTheScreen();
		expect(screen.getByPlaceholderText("Ex.: Plástico")).toHaveProp(
			"value",
			"Papelão",
		);
	});

	it("botão de submit desabilitado quando nome está vazio", async () => {
		await renderScreen();
		expect(screen.getByTestId("btn-submit")).toBeDisabled();
	});

	it("submit no modo criação chama saveWastes com resíduo existente e novo", async () => {
		await renderScreen();
		await fireEvent.changeText(
			screen.getByPlaceholderText("Ex.: Plástico"),
			"Vidro",
		);
		await fireEvent.press(screen.getByTestId("mock-select-category"));
		await waitFor(() =>
			expect(screen.getByTestId("btn-submit")).not.toBeDisabled(),
		);
		await fireEvent.press(screen.getByTestId("btn-submit"));
		await waitFor(() =>
			expect(mockSaveAsync).toHaveBeenCalledWith(
				expect.objectContaining({
					wastes: expect.arrayContaining([
						expect.objectContaining({ name: "Papelão" }),
						expect.objectContaining({
							name: "Vidro",
							waste_category_id: "cat-1",
						}),
					]),
				}),
			),
		);
	});

	it("submit no modo edição chama saveWastes com resíduo atualizado", async () => {
		jest.mocked(useLocalSearchParams).mockReturnValue({
			companyId: "company-1",
			id: "waste-1",
		});
		await renderScreen();
		await fireEvent.changeText(
			screen.getByPlaceholderText("Ex.: Plástico"),
			"Papelão Reciclado",
		);
		await waitFor(() =>
			expect(screen.getByTestId("btn-submit")).not.toBeDisabled(),
		);
		await fireEvent.press(screen.getByTestId("btn-submit"));
		await waitFor(() =>
			expect(mockSaveAsync).toHaveBeenCalledWith(
				expect.objectContaining({
					wastes: [
						expect.objectContaining({
							name: "Papelão Reciclado",
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
