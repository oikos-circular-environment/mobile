import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import WasteIndexScreen from "@/app/(tabs)/(home)/companies/[companyId]/waste/index";
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

jest.mock("@/components/ui/swipeable-card", () => ({
	SwipeableCard: ({
		onPress,
		onDelete,
		children,
	}: {
		onPress: () => void;
		onDelete: () => void;
		children: React.ReactNode;
	}) => {
		const React = require("react");
		const { Pressable, View } = require("react-native");
		return (
			<View>
				<Pressable testID="swipeable-press" onPress={onPress}>
					{children}
				</Pressable>
				<Pressable testID="swipeable-delete" onPress={onDelete} />
			</View>
		);
	},
}));

jest.mock("@/components/custom/waste-category", () => ({
	WasteCategoryHazardLevel: ({ variant }: { variant: string }) => {
		const React = require("react");
		const { Text } = require("react-native");
		return <Text>{variant}</Text>;
	},
}));

jest.mock("@/components/companies/waste/waste-skeleton", () => ({
	WasteSkeleton: () => {
		const React = require("react");
		const { View } = require("react-native");
		return <View testID="skeleton-waste" />;
	},
}));

const mockWaste1 = {
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

const mockWaste2 = {
	id: "waste-2",
	name: "Plástico",
	description: null,
	price: 0.8,
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
	wastes: [mockWaste1, mockWaste2],
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
		wastes: [mockWaste1, mockWaste2],
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
let mockPush: jest.Mock;
let mockReplace: jest.Mock;

async function renderScreen() {
	queryClient = createQueryClient();
	await render(
		<QueryClientProvider client={queryClient}>
			<WasteIndexScreen />
		</QueryClientProvider>,
	);
}

describe("WasteIndexScreen — integração", () => {
	beforeEach(() => {
		mockPush = jest.fn();
		mockReplace = jest.fn();
		jest.mocked(useRouter).mockReturnValue({
			push: mockPush,
			replace: mockReplace,
			back: jest.fn(),
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

	it("exibe skeleton quando isLoaded é false", async () => {
		setupStore(mockCompany, false);
		await renderScreen();
		expect(screen.getByTestId("skeleton-waste")).toBeOnTheScreen();
	});

	it("redireciona para o formulário quando empresa não tem resíduos", async () => {
		setupStore(makeStoreCompany({ id: "company-1", wastes: [] }));
		await renderScreen();
		expect(mockReplace).toHaveBeenCalledWith(
			expect.objectContaining({
				pathname: "/(tabs)/(home)/companies/[companyId]/waste/form",
				params: { companyId: "company-1" },
			}),
		);
	});

	it("exibe a lista de resíduos quando empresa tem resíduos", async () => {
		await renderScreen();
		expect(screen.getByText("Papelão")).toBeOnTheScreen();
		expect(screen.getByText("Plástico")).toBeOnTheScreen();
	});

	it("botão Novo navega para o formulário sem id", async () => {
		await renderScreen();
		await fireEvent.press(screen.getByTestId("btn-new"));
		expect(mockPush).toHaveBeenCalledWith(
			expect.objectContaining({
				pathname: "/(tabs)/(home)/companies/[companyId]/waste/form",
				params: { companyId: "company-1" },
			}),
		);
	});

	it("pressionar um resíduo navega para o formulário com o id do resíduo", async () => {
		await renderScreen();
		const pressButtons = screen.getAllByTestId("swipeable-press");
		await fireEvent.press(pressButtons[0]);
		expect(mockPush).toHaveBeenCalledWith(
			expect.objectContaining({
				pathname: "/(tabs)/(home)/companies/[companyId]/waste/form",
				params: { companyId: "company-1", id: "waste-1" },
			}),
		);
	});

	it("deletar resíduo chama saveWastes com a lista restante", async () => {
		await renderScreen();
		const deleteButtons = screen.getAllByTestId("swipeable-delete");
		await fireEvent.press(deleteButtons[0]);
		await waitFor(() =>
			expect(mockSaveAsync).toHaveBeenCalledWith(
				expect.objectContaining({
					wastes: [expect.objectContaining({ name: "Plástico" })],
				}),
			),
		);
	});
});
