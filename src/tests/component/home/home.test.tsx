import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, userEvent } from "@testing-library/react-native";
import type React from "react";
import HomeScreen from "@/app/(tabs)/(home)";
import { useAuthContext } from "@/contexts/auth-context";
import { useGeospatial } from "@/contexts/geospatial-context";
import { isCompanyOpenNow } from "@/libs/market/is-company-open";
import { getV1Market } from "@/libs/oikos-sdk";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
jest.mock("expo-router", () => ({
	Link: ({
		children,
		asChild,
	}: {
		children: React.ReactNode;
		asChild?: boolean;
		href?: unknown;
	}) => {
		const React = require("react");
		const { Pressable } = require("react-native");
		if (asChild) {
			return React.cloneElement(React.Children.only(children));
		}
		return React.createElement(Pressable, null, children);
	},
}));

jest.mock("@/contexts/auth-context");

jest.mock("@/contexts/geospatial-context");

jest.mock("@/libs/oikos-sdk", () => ({
	getV1Market: jest.fn(),
}));

jest.mock("@/libs/market/is-company-open", () => ({
	isCompanyOpenNow: jest.fn(),
}));

jest.mock("@/components/ui/grid", () => ({
	Grid: ({ children }: { children: React.ReactNode }) => <>{children}</>,
	GridItem: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock("@/components/home/home-guest-card", () => {
	const { View: V } = require("react-native");
	return { HomeGuestCard: () => <V testID="home-guest-card" /> };
});

jest.mock("@/components/home/home-user-card", () => {
	const { View: V } = require("react-native");
	return { HomeUserCard: () => <V testID="home-user-card" /> };
});

jest.mock("@/components/home/home-header-skeleton", () => {
	const { View: V } = require("react-native");
	return { HomeHeaderSkeleton: () => <V testID="home-header-skeleton" /> };
});

jest.mock("@/components/auth/profile-completion-modal", () => ({
	ProfileCompletionModal: ({
		isOpen,
		onClose,
		description,
	}: {
		isOpen: boolean;
		onClose: () => void;
		description?: string;
	}) => {
		const { Text, Pressable, View: RV } = require("react-native");
		return (
			<RV testID="profile-completion-modal">
				<Text testID="modal-is-open">{String(isOpen)}</Text>
				<Pressable testID="modal-close-btn" onPress={onClose}>
					<Text>Fechar</Text>
				</Pressable>
				{description ? (
					<Text testID="modal-description">{description}</Text>
				) : null}
			</RV>
		);
	},
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const defaultAuth = {
	user: null,
	isAuthenticated: false,
	isLoading: false,
	needsProfileCompletion: false,
	signIn: jest.fn(),
	signUp: jest.fn(),
	signOut: jest.fn(),
	updateUserProfile: jest.fn(),
};

const defaultGeospatial = {
	currentDate: new Date("2025-06-05T12:00:00"),
	heading: null,
	location: null,
	addresses: [],
	permissionDenied: false,
	isResolving: false,
	reverseGeocodeError: false,
};

const mockCompany = {
	id: "company-1",
	business_name: null,
	corporate_name: "Recicladora Verde Ltda",
	company_type: "COLLECTOR",
	accept_appointments: true,
	status: true,
	phones: ["11999999999"],
	address: {
		id: "addr-1",
		zip_code: "01310100",
		street: "Rua Augusta",
		number: "500",
		complement: null,
		district: "Consolação",
		city: "São Paulo",
		state: "São Paulo",
		state_code: "SP",
		latitude: -23.55,
		longitude: -46.63,
	},
	wastes: [
		{
			id: "w-1",
			name: "Papel",
			description: null,
			price: 0,
			unit: "KG",
			waste_type: "RECYCLABLE",
			quantity: 0,
			observations: null,
			sub_items: null,
		},
	],
	services: [],
	business_hours: [],
	distance_in_meters: 500,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function setupAuth(overrides: Partial<typeof defaultAuth> = {}) {
	jest.mocked(useAuthContext).mockReturnValue({
		...defaultAuth,
		...overrides,
	});
}

function setupGeospatial(overrides: Partial<typeof defaultGeospatial> = {}) {
	jest.mocked(useGeospatial).mockReturnValue({
		...defaultGeospatial,
		...overrides,
	});
}

async function renderHome() {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	});
	return await render(
		<QueryClientProvider client={queryClient}>
			<HomeScreen />
		</QueryClientProvider>,
	);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("HomeScreen — componente", () => {
	beforeEach(() => {
		jest.useFakeTimers();
		setupAuth();
		setupGeospatial();
		jest.mocked(getV1Market).mockResolvedValue({
			data: { companies: [], next_cursor: null },
		} as unknown as Awaited<ReturnType<typeof getV1Market>>);
		jest.mocked(isCompanyOpenNow).mockReturnValue(true);
	});

	afterEach(() => {
		jest.useRealTimers();
		jest.clearAllMocks();
	});

	// -----------------------------------------------------------------------
	// Header (skeleton / guest / user)
	// -----------------------------------------------------------------------
	it("exibe skeleton enquanto isLoading é true", async () => {
		setupAuth({ isLoading: true });
		await renderHome();

		expect(screen.getByTestId("home-header-skeleton")).toBeOnTheScreen();
		expect(screen.queryByTestId("home-guest-card")).not.toBeOnTheScreen();
		expect(screen.queryByTestId("home-user-card")).not.toBeOnTheScreen();
	});

	it("renderiza HomeGuestCard quando não autenticado", async () => {
		await renderHome();

		expect(screen.getByTestId("home-guest-card")).toBeOnTheScreen();
		expect(screen.queryByTestId("home-user-card")).not.toBeOnTheScreen();
		expect(screen.queryByTestId("home-header-skeleton")).not.toBeOnTheScreen();
	});

	it("renderiza HomeUserCard quando autenticado", async () => {
		setupAuth({ isAuthenticated: true, user: {} as never });
		await renderHome();

		expect(screen.getByTestId("home-user-card")).toBeOnTheScreen();
		expect(screen.queryByTestId("home-guest-card")).not.toBeOnTheScreen();
	});

	// -----------------------------------------------------------------------
	// Cards de serviço
	// -----------------------------------------------------------------------
	it("exibe Pontos de Coleta e Denúncias (sempre visíveis)", async () => {
		await renderHome();

		expect(screen.getByText("Pontos de Coleta")).toBeOnTheScreen();
		expect(screen.getByText("Denúncias")).toBeOnTheScreen();
	});

	it("exibe card Empresas apenas quando autenticado", async () => {
		await renderHome();
		expect(screen.queryByText("Empresas")).not.toBeOnTheScreen();

		setupAuth({ isAuthenticated: true, user: {} as never });
		await renderHome();
		expect(screen.getByText("Empresas")).toBeOnTheScreen();
	});

	it("abre modal de finalizar cadastro ao pressionar Empresas com needsProfileCompletion", async () => {
		const user = userEvent.setup();
		setupAuth({
			isAuthenticated: true,
			needsProfileCompletion: true,
			user: {} as never,
		});
		await renderHome();

		await user.press(screen.getByText("Empresas"));

		expect(screen.getByTestId("modal-is-open")).toHaveTextContent("true");
	});

	it("fecha modal ao pressionar botão de fechar", async () => {
		const user = userEvent.setup();
		setupAuth({
			isAuthenticated: true,
			needsProfileCompletion: true,
			user: {} as never,
		});
		await renderHome();

		await user.press(screen.getByText("Empresas"));
		expect(screen.getByTestId("modal-is-open")).toHaveTextContent("true");

		await user.press(screen.getByTestId("modal-close-btn"));
		expect(screen.getByTestId("modal-is-open")).toHaveTextContent("false");
	});

	it("passa description correta para o modal", async () => {
		const user = userEvent.setup();
		setupAuth({
			isAuthenticated: true,
			needsProfileCompletion: true,
			user: {} as never,
		});
		await renderHome();

		await user.press(screen.getByText("Empresas"));

		expect(screen.getByTestId("modal-description")).toHaveTextContent(
			"Para acessar o gerenciamento de empresas você precisa finalizar o seu cadastro.",
		);
	});

	// -----------------------------------------------------------------------
	// Empresas próximas — loading / erro / vazio / dados
	// -----------------------------------------------------------------------
	it("exibe mensagem de localização indisponível quando permissionDenied", async () => {
		setupGeospatial({ permissionDenied: true });
		await renderHome();

		expect(screen.getByText("Localização indisponível")).toBeOnTheScreen();
	});

	it("exibe loader de localização enquanto isResolving", async () => {
		setupGeospatial({ isResolving: true, location: null });
		await renderHome();

		expect(screen.getByText("Obtendo localização…")).toBeOnTheScreen();
	});

	it("exibe loader de localização quando location ainda não está pronto", async () => {
		setupGeospatial({ isResolving: false, location: null });
		await renderHome();

		expect(screen.getByText("Obtendo localização…")).toBeOnTheScreen();
	});

	it("não chama getV1Market quando location não está disponível", async () => {
		await renderHome();

		expect(getV1Market).not.toHaveBeenCalled();
	});

	it("exibe loader de empresas durante o carregamento da query", async () => {
		setupGeospatial({
			location: { coords: { latitude: -23.55, longitude: -46.63 } } as never,
		});
		let resolveQuery!: (value: unknown) => void;
		jest.mocked(getV1Market).mockImplementation(
			() =>
				new Promise(resolve => {
					resolveQuery = resolve;
				}) as unknown as ReturnType<typeof getV1Market>,
		);
		await renderHome();

		expect(screen.getByText("Buscando empresas…")).toBeOnTheScreen();

		resolveQuery({ data: { companies: [] as never[], next_cursor: null } });
	});

	it("chama getV1Market com coordenadas corretas após localização pronta", async () => {
		setupGeospatial({
			location: { coords: { latitude: -23.55, longitude: -46.63 } } as never,
		});
		await renderHome();

		expect(getV1Market).toHaveBeenCalledWith({
			query: { lat: -23.55, lon: -46.63, radius: 2000, limit: 5 },
		});
	});

	it("exibe mensagem de nenhuma empresa quando lista retorna vazia", async () => {
		setupGeospatial({
			location: { coords: { latitude: -23.55, longitude: -46.63 } } as never,
		});
		await renderHome();

		expect(
			await screen.findByText("Nenhuma empresa encontrada em até 2 km."),
		).toBeOnTheScreen();
	});

	it("renderiza lista de empresas quando há dados", async () => {
		setupGeospatial({
			location: { coords: { latitude: -23.55, longitude: -46.63 } } as never,
		});
		jest.mocked(getV1Market).mockResolvedValue({
			data: { companies: [mockCompany], next_cursor: null },
		} as unknown as Awaited<ReturnType<typeof getV1Market>>);
		await renderHome();

		expect(await screen.findByText("Recicladora Verde Ltda")).toBeOnTheScreen();
		expect(screen.getByText("Papel")).toBeOnTheScreen();
		expect(screen.getByText("500 m")).toBeOnTheScreen();
	});

	it("formata distância em km quando >= 1000 metros", async () => {
		const farCompany = {
			...mockCompany,
			id: "company-2",
			corporate_name: "Coleta Seletiva S.A.",
			distance_in_meters: 1200,
			wastes: [
				{
					id: "w-2",
					name: "Plástico",
					description: null,
					price: 0,
					unit: "KG",
					waste_type: "RECYCLABLE",
					quantity: 0,
					observations: null,
					sub_items: null,
				},
			],
		};
		setupGeospatial({
			location: { coords: { latitude: -23.55, longitude: -46.63 } } as never,
		});
		jest.mocked(getV1Market).mockResolvedValue({
			data: { companies: [farCompany], next_cursor: null },
		} as unknown as Awaited<ReturnType<typeof getV1Market>>);
		await renderHome();

		expect(await screen.findByText("1,2 km")).toBeOnTheScreen();
	});

	it("exibe badge Aberto baseado em isCompanyOpenNow", async () => {
		jest.mocked(isCompanyOpenNow).mockReturnValue(true);
		setupGeospatial({
			location: { coords: { latitude: -23.55, longitude: -46.63 } } as never,
		});
		jest.mocked(getV1Market).mockResolvedValue({
			data: { companies: [mockCompany], next_cursor: null },
		} as unknown as Awaited<ReturnType<typeof getV1Market>>);
		await renderHome();

		expect(await screen.findByText("Aberto")).toBeOnTheScreen();
	});

	it("exibe badge Fechado baseado em isCompanyOpenNow", async () => {
		jest.mocked(isCompanyOpenNow).mockReturnValue(false);
		setupGeospatial({
			location: { coords: { latitude: -23.55, longitude: -46.63 } } as never,
		});
		jest.mocked(getV1Market).mockResolvedValue({
			data: { companies: [mockCompany], next_cursor: null },
		} as unknown as Awaited<ReturnType<typeof getV1Market>>);
		await renderHome();

		expect(await screen.findByText("Fechado")).toBeOnTheScreen();
	});

	it("chama isCompanyOpenNow com business_hours e currentDate", async () => {
		setupGeospatial({
			location: { coords: { latitude: -23.55, longitude: -46.63 } } as never,
			currentDate: new Date("2025-06-05T15:00:00"),
		});
		jest.mocked(getV1Market).mockResolvedValue({
			data: { companies: [mockCompany], next_cursor: null },
		} as unknown as Awaited<ReturnType<typeof getV1Market>>);
		await renderHome();

		await screen.findByText("Recicladora Verde Ltda");
		expect(isCompanyOpenNow).toHaveBeenCalledWith(
			mockCompany.business_hours,
			new Date("2025-06-05T15:00:00"),
		);
	});
});
