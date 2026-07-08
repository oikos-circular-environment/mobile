import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import CompanyAddressScreen from "@/app/(tabs)/(home)/companies/[companyId]/address";
import { useSaveAddress } from "@/components/companies/hooks/use-save-address";
import { Toaster } from "@/components/toast";
import {
	getCepV2,
	listIbgeMunicipios,
	listIbgeUfs,
} from "@/libs/brasil-api-sdk";
import type { Company } from "@/libs/types/companies";
import { useCompaniesStore } from "@/stores/companies-store";
import { makeAddress, makeStoreCompany } from "@/tests/factories";

jest.mock("expo-router", () => ({
	useLocalSearchParams: jest.fn(),
	useRouter: jest.fn(),
}));

jest.mock("@/stores/companies-store", () => ({
	useCompaniesStore: jest.fn(),
}));

jest.mock("@/libs/brasil-api-sdk", () => ({
	getCepV2: jest.fn(),
	listIbgeMunicipios: jest.fn(),
	listIbgeUfs: jest.fn(),
}));

jest.mock("@/components/companies/hooks/use-save-address", () => ({
	useSaveAddress: jest.fn(),
}));

jest.mock("@/components/toast", () => {
	const React = require("react");
	const { View, Text } = require("react-native");
	return {
		toast: {
			success: jest.fn((title, message) => {
				global.mockToastShow({ type: "success", title, message });
			}),
			error: jest.fn((title, message) => {
				global.mockToastShow({ type: "error", title, message });
			}),
			info: jest.fn(),
			warning: jest.fn(),
			close: jest.fn(),
			closeAll: jest.fn(),
		},
		Toaster: () => {
			const [visibleToast, setVisibleToast] = React.useState(null);
			React.useEffect(() => {
				global.mockToastShow = t => setVisibleToast(t);
				return () => {
					global.mockToastShow = () => {};
				};
			}, []);

			if (!visibleToast) return null;
			return (
				<View testID="mock-toaster">
					<Text testID="toast-title">{visibleToast.title}</Text>
					<Text testID="toast-message">{visibleToast.message}</Text>
				</View>
			);
		},
	};
});

jest.mock("@/components/wrapper-map", () => ({
	__esModule: true,
	default: ({
		onChange,
	}: {
		onChange?: (loc: { latitude: number; longitude: number }) => void;
		latitude?: number | null;
		longitude?: number | null;
	}) => {
		const { Pressable, View: V } = require("react-native");
		return (
			<V testID="wrapper-map">
				<Pressable
					testID="map-press"
					onPress={() => onChange?.({ latitude: -23.55, longitude: -46.63 })}
				/>
			</V>
		);
	},
}));

const mockRegiao = { id: 3, sigla: "SE", nome: "Sudeste" };

const mockStates = [
	{ id: 35, sigla: "SP", nome: "São Paulo", regiao: mockRegiao },
	{ id: 33, sigla: "RJ", nome: "Rio de Janeiro", regiao: mockRegiao },
];

const mockCitiesSP = [
	{ nome: "São Paulo", codigo_ibge: "3550308" },
	{ nome: "Campinas", codigo_ibge: "3509502" },
];

const mockCepResponse = {
	cep: "01001000",
	state: "SP",
	city: "São Paulo",
	neighborhood: "Sé",
	street: "Praça da Sé",
	timezoneName: "America/Sao_Paulo",
	location: {
		type: "Point",
		coordinates: { longitude: "-46.6338", latitude: "-23.5503" },
	},
};

const mockAddress = makeAddress({
	id: "address-1",
	zip_code: "04001-000",
	street: "Av. Paulista",
	number: "1000",
	complement: null,
	district: "Bela Vista",
	city: "São Paulo",
	state: "São Paulo",
	state_code: "SP",
	state_ibge_id: 35,
	city_ibge_id: 3550308,
	latitude: null as unknown as number,
	longitude: null as unknown as number,
});

const mockCompany = makeStoreCompany({
	id: "company-1",
	business_name: "Empresa Teste",
	corporate_name: "Empresa Teste Ltda",
	identity: "12.345.678/0001-99",
	address: mockAddress,
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
		address: mockAddress,
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

async function renderScreen() {
	queryClient = createQueryClient();
	await render(
		<QueryClientProvider client={queryClient}>
			<Toaster />
			<CompanyAddressScreen />
		</QueryClientProvider>,
	);
	// useCompanyAddress fires loadStates() on mount via useMutation + useEffect.
	// Waiting here keeps the act() scope open until that mutation's onSuccess
	// (setStates) runs, preventing "overlapping act() calls" from leaking into
	// subsequent tests and corrupting the React act() stack.
	await waitFor(() => expect(listIbgeUfs).toHaveBeenCalled());
	// Drain loadCities (fires when state_code is already set on mount) and any
	// other follow-on microtasks from the TanStack Query scheduler.
	await act(async () => {});
}

describe("CompanyAddressScreen — integração", () => {
	beforeEach(() => {
		jest
			.mocked(useRouter)
			.mockReturnValue({ back: jest.fn() } as unknown as ReturnType<
				typeof useRouter
			>);
		jest
			.mocked(useLocalSearchParams)
			.mockReturnValue({ companyId: "company-1" });
		setupStore();
		jest.mocked(useSaveAddress).mockReturnValue({
			mutateAsync: mockSaveAsync,
			isPending: false,
		} as unknown as ReturnType<typeof useSaveAddress>);
		jest.mocked(listIbgeUfs).mockResolvedValue({
			data: mockStates,
		} as unknown as Awaited<ReturnType<typeof listIbgeUfs>>);
		jest.mocked(listIbgeMunicipios).mockResolvedValue({
			data: mockCitiesSP,
		} as unknown as Awaited<ReturnType<typeof listIbgeMunicipios>>);
		jest.mocked(getCepV2).mockResolvedValue({
			data: mockCepResponse,
		} as unknown as Awaited<ReturnType<typeof getCepV2>>);
	});

	afterEach(async () => {
		// Flush any remaining TanStack Query async work before RNTL auto-cleanup
		// unmounts the component, preventing state updates on unmounted components.
		await act(async () => {});
		queryClient?.clear();
		jest.clearAllMocks();
	});

	it("busca CEP bem-sucedida preenche rua e bairro com os dados retornados", async () => {
		await renderScreen();

		await fireEvent.changeText(
			screen.getByTestId("input-zip-code"),
			"01001-000",
		);
		await fireEvent.press(
			screen.getByTestId("cep-search-btn", { includeHiddenElements: true }),
		);

		await waitFor(() => {
			expect(screen.getByTestId("input-street")).toHaveProp(
				"value",
				"Praça da Sé",
			);
		});
		expect(screen.getByTestId("input-district")).toHaveProp("value", "Sé");
	});

	it("busca CEP bem-sucedida atualiza o campo CEP com a máscara formatada", async () => {
		await renderScreen();

		await fireEvent.changeText(
			screen.getByTestId("input-zip-code"),
			"01001-000",
		);
		await fireEvent.press(
			screen.getByTestId("cep-search-btn", { includeHiddenElements: true }),
		);

		await waitFor(() => {
			expect(screen.getByTestId("input-zip-code")).toHaveProp(
				"value",
				"01001-000",
			);
		});
	});

	it("após busca CEP, dispara a query de cidades para o estado retornado", async () => {
		await renderScreen();

		await fireEvent.changeText(
			screen.getByTestId("input-zip-code"),
			"01001-000",
		);
		await fireEvent.press(
			screen.getByTestId("cep-search-btn", { includeHiddenElements: true }),
		);

		await waitFor(() => {
			expect(listIbgeMunicipios).toHaveBeenCalledWith(
				expect.objectContaining({ path: { siglaUF: "SP" } }),
			);
		});
	});

	it("após carregar cidades, auto-seleciona city_ibge_id correspondente à cidade do CEP", async () => {
		await renderScreen();

		await fireEvent.changeText(
			screen.getByTestId("input-zip-code"),
			"01001-000",
		);
		await fireEvent.press(
			screen.getByTestId("cep-search-btn", { includeHiddenElements: true }),
		);

		await waitFor(() => {
			expect(screen.getByTestId("input-street")).toHaveProp(
				"value",
				"Praça da Sé",
			);
		});

		await fireEvent.press(screen.getByTestId("btn-save"));

		await waitFor(() => {
			expect(mockSaveAsync).toHaveBeenCalledWith(
				expect.objectContaining({ city_ibge_id: 3550308 }),
			);
		});
	});

	it("busca CEP preenche state_code com a sigla do estado retornado", async () => {
		setupStore(makeStoreCompany({ id: "company-1", address: null }));

		await renderScreen();

		await fireEvent.changeText(
			screen.getByTestId("input-zip-code"),
			"01001-000",
		);
		await fireEvent.press(
			screen.getByTestId("cep-search-btn", { includeHiddenElements: true }),
		);

		await waitFor(() => {
			expect(listIbgeMunicipios).toHaveBeenCalledWith(
				expect.objectContaining({ path: { siglaUF: "SP" } }),
			);
		});
	});

	it("CEP com menos de 8 dígitos exibe toast de validação ao pressionar buscar", async () => {
		await renderScreen();

		await fireEvent.changeText(screen.getByTestId("input-zip-code"), "01001");
		await fireEvent.press(
			screen.getByTestId("cep-search-btn", { includeHiddenElements: true }),
		);

		await waitFor(() => {
			expect(screen.getByTestId("toast-title")).toHaveTextContent(
				"CEP inválido",
			);
		});
		expect(screen.getByTestId("toast-message")).toHaveTextContent(
			"O CEP deve conter 8 dígitos.",
		);
		expect(getCepV2).not.toHaveBeenCalled();
	});

	it("erro na busca de CEP exibe toast de erro e não altera os campos", async () => {
		jest.mocked(getCepV2).mockRejectedValue(new Error("Not found"));

		await renderScreen();

		const originalStreet = screen.getByTestId("input-street").props.value;

		await fireEvent.changeText(
			screen.getByTestId("input-zip-code"),
			"00000-000",
		);
		await fireEvent.press(
			screen.getByTestId("cep-search-btn", { includeHiddenElements: true }),
		);

		await waitFor(() => {
			expect(screen.getByTestId("toast-title")).toHaveTextContent(
				"CEP não encontrado",
			);
		});
		expect(screen.getByTestId("toast-message")).toHaveTextContent(
			"Verifique o número e tente novamente.",
		);
		expect(screen.getByTestId("input-street")).toHaveProp(
			"value",
			originalStreet,
		);
	});

	it("submit com dados válidos chama saveAddress com o payload completo", async () => {
		await renderScreen();

		await fireEvent.press(screen.getByTestId("map-press"));
		await fireEvent.press(screen.getByTestId("btn-save"));

		await waitFor(() => {
			expect(mockSaveAsync).toHaveBeenCalledWith(
				expect.objectContaining({
					zip_code: "04001-000",
					street: "Av. Paulista",
					number: "1000",
					district: "Bela Vista",
					city: "São Paulo",
					state: "São Paulo",
					state_code: "SP",
					state_ibge_id: 35,
					city_ibge_id: 3550308,
					latitude: -23.55,
					longitude: -46.63,
				}),
			);
		});
	});
});
