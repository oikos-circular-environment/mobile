import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, userEvent } from "@testing-library/react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import CompanyAddressScreen from "@/app/(tabs)/(home)/companies/[companyId]/address";
import { useSaveAddress } from "@/components/companies/hooks/use-save-address";
import { listIbgeMunicipios, listIbgeUfs } from "@/libs/brasil-api-sdk";
import type { Company } from "@/libs/types/companies";
import { useCompaniesStore } from "@/stores/companies-store";
import { makeAddress, makeCompany } from "@/tests/factories";

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

jest.mock("@/components/toast", () => ({
	toast: {
		success: jest.fn(),
		error: jest.fn(),
		info: jest.fn(),
		warning: jest.fn(),
	},
}));

// WrapperMap mock: expõe um Pressable que chama onChange com coordenadas fixas,
// permitindo testar a interação do mapa sem efeitos colaterais.
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

const mockAddress = makeAddress({
	id: "address-1",
	zip_code: "01001-000",
	street: "Praça da Sé",
	number: "1",
	complement: null,
	district: "Sé",
	city: "São Paulo",
	state: "São Paulo",
	state_code: "SP",
	state_ibge_id: 35,
	city_ibge_id: 3550308,
	latitude: null as unknown as number,
	longitude: null as unknown as number,
});

const mockCompany = makeCompany({
	id: "company-1",
	address: mockAddress,
}) as unknown as Company;

const mockRegiao = { id: 3, sigla: "SE", nome: "Sudeste" };
const mockStates = [
	{ id: 35, sigla: "SP", nome: "São Paulo", regiao: mockRegiao },
];
const mockCities = [{ nome: "São Paulo", codigo_ibge: "3550308" }];

function createQueryClient() {
	return new QueryClient({
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	});
}

function setupStore(company: Company | null = mockCompany, isLoaded = true) {
	jest
		.mocked(useCompaniesStore)
		.mockImplementation(selector =>
			selector({ companies: company ? [company] : [], isLoaded } as never),
		);
}

const mockSaveAsync = jest.fn().mockResolvedValue({});

async function renderScreen() {
	const queryClient = createQueryClient();
	return await render(
		<QueryClientProvider client={queryClient}>
			<CompanyAddressScreen />
		</QueryClientProvider>,
	);
}

describe("CompanyAddressScreen — componente", () => {
	beforeEach(() => {
		jest.useFakeTimers();
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
			data: mockCities,
		} as unknown as Awaited<ReturnType<typeof listIbgeMunicipios>>);
	});

	afterEach(() => {
		jest.useRealTimers();
		jest.clearAllMocks();
	});

	it("não renderiza campos quando o endereço está carregando", async () => {
		setupStore(mockCompany, false);
		await renderScreen();

		expect(screen.queryByTestId("input-zip-code")).not.toBeOnTheScreen();
		expect(screen.queryByTestId("btn-save")).not.toBeOnTheScreen();
	});

	it("preenche os campos com os dados do endereço existente", async () => {
		await renderScreen();

		expect(screen.getByTestId("input-zip-code")).toHaveProp(
			"value",
			"01001-000",
		);
		expect(screen.getByTestId("input-street")).toHaveProp(
			"value",
			"Praça da Sé",
		);
		expect(screen.getByTestId("input-number")).toHaveProp("value", "1");
		expect(screen.getByTestId("input-district")).toHaveProp("value", "Sé");
	});

	it("exibe campos vazios quando a empresa não tem endereço", async () => {
		setupStore({ ...mockCompany, address: null });
		await renderScreen();

		expect(screen.getByTestId("input-zip-code")).toHaveProp("value", "");
		expect(screen.getByTestId("input-street")).toHaveProp("value", "");
		expect(screen.getByTestId("input-number")).toHaveProp("value", "");
	});

	it("toque no mapa torna o formulário dirty e habilita o botão Salvar", async () => {
		const user = userEvent.setup();
		await renderScreen();

		expect(screen.getByTestId("btn-save")).toBeDisabled();

		await user.press(screen.getByTestId("map-press"));

		expect(screen.getByTestId("btn-save")).not.toBeDisabled();
	});

	it("botões Cancelar e Salvar estão desabilitados quando o formulário não foi alterado", async () => {
		await renderScreen();

		expect(screen.getByTestId("btn-cancel")).toBeDisabled();
		expect(screen.getByTestId("btn-save")).toBeDisabled();
	});

	it("botões ficam habilitados ao editar um campo de texto", async () => {
		const user = userEvent.setup();
		await renderScreen();

		await user.type(screen.getByTestId("input-number"), "2");

		expect(screen.getByTestId("btn-cancel")).not.toBeDisabled();
		expect(screen.getByTestId("btn-save")).not.toBeDisabled();
	});

	it("pressionar Cancelar restaura os valores originais do endereço", async () => {
		const user = userEvent.setup();
		await renderScreen();

		const numberInput = screen.getByTestId("input-number");
		await user.clear(numberInput);
		await user.type(numberInput, "99");
		expect(numberInput).toHaveProp("value", "99");

		await user.press(screen.getByTestId("btn-cancel"));

		expect(screen.getByTestId("input-number")).toHaveProp("value", "1");
		expect(screen.getByTestId("btn-cancel")).toBeDisabled();
	});
});
