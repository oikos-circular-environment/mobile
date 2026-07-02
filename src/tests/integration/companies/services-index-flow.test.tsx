import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import ServicesIndexScreen from "@/app/(tabs)/(home)/companies/[companyId]/services/index";
import { useSaveServices } from "@/components/companies/hooks/use-save-services";
import type { Company } from "@/stores/companies-store";
import { useCompaniesStore } from "@/stores/companies-store";
import { makeStoreCompany } from "@/tests/factories";

jest.mock("expo-router", () => ({
	useLocalSearchParams: jest.fn(),
	useRouter: jest.fn(),
	Stack: { Screen: () => null },
	Redirect: ({ href }: { href: unknown }) => {
		const React = require("react");
		const { Text } = require("react-native");
		return React.createElement(
			Text,
			{ testID: "redirect" },
			JSON.stringify(href),
		);
	},
}));

jest.mock("@/stores/companies-store", () => ({
	useCompaniesStore: jest.fn(),
}));

jest.mock("@/components/companies/hooks/use-save-services");

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

jest.mock("@/components/companies/services/service-skeleton", () => ({
	ServiceSkeleton: () => {
		const React = require("react");
		const { View } = require("react-native");
		return <View testID="skeleton-services" />;
	},
}));

const mockService1 = {
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

const mockService2 = {
	id: "svc-2",
	name: "Coleta de Orgânicos",
	description: null,
	price: 50,
	quantity: 1,
	unit: "KG",
	observations: null,
	waste_category_id: "cat-2",
	waste_category: { id: "cat-2", name: "Orgânicos", hazard_levels: [] },
} as unknown as Company["services"][number];

const mockCompany = makeStoreCompany({
	id: "company-1",
	business_name: "Empresa Teste",
	corporate_name: "Empresa Teste Ltda",
	services: [mockService1, mockService2],
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
		services: [mockService1, mockService2],
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
			<ServicesIndexScreen />
		</QueryClientProvider>,
	);
}

describe("ServicesIndexScreen — integração", () => {
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

	it("exibe skeleton quando isLoaded é false", async () => {
		setupStore(mockCompany, false);
		await renderScreen();
		expect(screen.getByTestId("skeleton-services")).toBeOnTheScreen();
	});

	it("redireciona para o formulário quando empresa não tem serviços", async () => {
		setupStore(makeStoreCompany({ id: "company-1", services: [] }));
		await renderScreen();
		expect(screen.getByTestId("redirect")).toHaveTextContent(
			JSON.stringify({
				pathname: "/(tabs)/(home)/companies/[companyId]/services/form",
				params: { companyId: "company-1" },
			}),
		);
	});

	it("exibe a lista de serviços quando empresa tem serviços", async () => {
		await renderScreen();
		expect(screen.getByText("Coleta de RCC")).toBeOnTheScreen();
		expect(screen.getByText("Coleta de Orgânicos")).toBeOnTheScreen();
	});

	it("botão Novo navega para o formulário sem id", async () => {
		await renderScreen();
		await fireEvent.press(screen.getByTestId("btn-new"));
		expect(mockPush).toHaveBeenCalledWith(
			expect.objectContaining({
				pathname: "/(tabs)/(home)/companies/[companyId]/services/form",
				params: { companyId: "company-1" },
			}),
		);
	});

	it("pressionar um serviço navega para o formulário com o id do serviço", async () => {
		await renderScreen();
		const pressButtons = screen.getAllByTestId("swipeable-press");
		await fireEvent.press(pressButtons[0]);
		expect(mockPush).toHaveBeenCalledWith(
			expect.objectContaining({
				pathname: "/(tabs)/(home)/companies/[companyId]/services/form",
				params: { companyId: "company-1", id: "svc-1" },
			}),
		);
	});

	it("deletar serviço chama saveServices com a lista restante", async () => {
		await renderScreen();
		const deleteButtons = screen.getAllByTestId("swipeable-delete");
		await fireEvent.press(deleteButtons[0]);
		await waitFor(() =>
			expect(mockSaveAsync).toHaveBeenCalledWith(
				expect.objectContaining({
					services: [expect.objectContaining({ name: "Coleta de Orgânicos" })],
				}),
			),
		);
	});
});
