import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
	render,
	screen,
	userEvent,
	waitFor,
} from "@testing-library/react-native";
import type React from "react";
import HomeScreen from "@/app/(tabs)/(home)";
import { useAuthContext } from "@/contexts/auth-context";
import { useGeospatial } from "@/contexts/geospatial-context";
import { isCompanyOpenNow } from "@/libs/market/is-company-open";
import { getV1Market } from "@/libs/oikos-sdk";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockLinkPress = jest.fn();

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
		const wrapped = (onPress?: () => void) =>
			React.createElement(Pressable, { onPress }, children);
		if (asChild) {
			const child = React.Children.only(children);
			return React.cloneElement(child, {
				onPress: () => mockLinkPress(),
			});
		}
		return wrapped(() => mockLinkPress());
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

jest.mock("@/components/ui/grid", () => {
	const R = require("react");
	return {
		Grid: ({ children }: { children: React.ReactNode }) =>
			R.createElement(R.Fragment, null, children),
		GridItem: ({ children }: { children: React.ReactNode }) =>
			R.createElement(R.Fragment, null, children),
	};
});

jest.mock("@/components/home/home-header-skeleton", () => {
	const { View: V } = require("react-native");
	return { HomeHeaderSkeleton: () => <V testID="home-header-skeleton" /> };
});

jest.mock("expo-image", () => ({
	Image: () => null,
}));

jest.mock("@/components/auth/button-sign-out", () => {
	const { View: V } = require("react-native");
	return { ButtonSignOut: () => <V testID="button-sign-out" /> };
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
		const { Pressable, Text: T, View: V } = require("react-native");
		return (
			<V testID="profile-completion-modal">
				<T testID="modal-is-open">{String(isOpen)}</T>
				<Pressable testID="modal-close-btn" onPress={onClose}>
					<T>Fechar</T>
				</Pressable>
				{description ? <T testID="modal-description">{description}</T> : null}
			</V>
		);
	},
}));

jest.mock("@/components/toast", () => ({
	Toaster: () => null,
	toast: {
		success: jest.fn(),
		error: jest.fn(),
		info: jest.fn(),
		warning: jest.fn(),
		close: jest.fn(),
		closeAll: jest.fn(),
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
	company_type: "COLLECTOR" as const,
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
	services: [],
	wastes: [
		{
			id: "w-1",
			name: "Papel",
			description: null,
			price: 0,
			unit: "KG" as const,
			waste_type: "RECYCLABLE" as const,
			quantity: 0,
			observations: null,
			sub_items: null,
		},
	],
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
describe("HomeScreen — integração", () => {
	beforeEach(() => {
		jest.useFakeTimers();
		mockLinkPress.mockReset();
		setupAuth();
		setupGeospatial();
		jest.mocked(getV1Market).mockResolvedValue({
			data: { companies: [], next_cursor: null },
		});
		jest.mocked(isCompanyOpenNow).mockReturnValue(true);
	});

	afterEach(() => {
		jest.useRealTimers();
		jest.clearAllMocks();
	});

	// -----------------------------------------------------------------------
	// Header — componentes reais
	// -----------------------------------------------------------------------
	it("renderiza GuestCard com boas-vindas para visitante", async () => {
		setupAuth({ isAuthenticated: false });
		await renderHome();

		expect(screen.getByText("Bem-Vindos a Oikos!")).toBeOnTheScreen();
	});

	it("renderiza UserCard com nome de exibição para usuário logado", async () => {
		setupAuth({
			isAuthenticated: true,
			user: {
				profile: {
					user_id: "u1",
					id: "p1",
					full_name: "João Silva",
					display_name: "João",
					phone: "11999999999",
					created_at: new Date(),
					updated_at: new Date(),
					profile_image: null,
					address: {
						id: "a1",
						zip_code: "01310100",
						street: "Av Paulista",
						number: "1000",
						complement: null,
						district: "Bela Vista",
						city: "São Paulo",
						city_ibge_id: 3550308,
						state: "São Paulo",
						state_code: "SP",
						state_ibge_id: 35,
						latitude: -23.55,
						longitude: -46.63,
					},
				},
			} as never,
		});
		await renderHome();

		expect(screen.getByText("João")).toBeOnTheScreen();
		expect(screen.getByTestId("button-sign-out")).toBeOnTheScreen();
	});

	it("renderiza card de cadastro pendente quando autenticado sem perfil", async () => {
		setupAuth({ isAuthenticated: true, user: null });
		await renderHome();

		expect(screen.getByText("Finalize seu cadastro")).toBeOnTheScreen();
	});

	// -----------------------------------------------------------------------
	// Seções fixas
	// -----------------------------------------------------------------------
	it("exibe títulos das seções Serviços e Próximas de você", async () => {
		await renderHome();

		expect(screen.getByText("Serviços")).toBeOnTheScreen();
		expect(screen.getByText("Próximas de você")).toBeOnTheScreen();
		expect(screen.getByText("Empresas em até 2 km")).toBeOnTheScreen();
		expect(screen.getByText("Ver todas")).toBeOnTheScreen();
	});

	// -----------------------------------------------------------------------
	// Fluxo completo de dados — API → tela
	// -----------------------------------------------------------------------
	it("carrega e exibe empresas próximas com dados formatados", async () => {
		const company2 = {
			...mockCompany,
			id: "company-2",
			corporate_name: "Coleta Seletiva S.A.",
			company_type: "COMPANY" as const,
			wastes: [
				{
					id: "w-2",
					name: "Plástico",
					description: null,
					price: 0,
					unit: "KG" as const,
					waste_type: "RECYCLABLE" as const,
					quantity: 0,
					observations: null,
					sub_items: null,
				},
				{
					id: "w-3",
					name: "Vidro",
					description: null,
					price: 0,
					unit: "KG" as const,
					waste_type: "RECYCLABLE" as const,
					quantity: 0,
					observations: null,
					sub_items: null,
				},
			],
			distance_in_meters: 1200,
		};

		setupGeospatial({
			location: { coords: { latitude: -23.55, longitude: -46.63 } } as never,
		});
		jest.mocked(getV1Market).mockResolvedValue({
			data: { companies: [mockCompany, company2], next_cursor: null },
		});

		await renderHome();

		// Nomes das empresas
		expect(await screen.findByText("Recicladora Verde Ltda")).toBeOnTheScreen();
		expect(screen.getByText("Coleta Seletiva S.A.")).toBeOnTheScreen();

		// Resíduos (apenas 3 primeiros, separados por ", ")
		expect(screen.getByText("Papel")).toBeOnTheScreen();
		expect(screen.getByText("Plástico, Vidro")).toBeOnTheScreen();

		// Distância formatada
		expect(screen.getByText("500 m")).toBeOnTheScreen();
		expect(screen.getByText("1,2 km")).toBeOnTheScreen();

		// Badge de status (ambas abertas)
		expect(screen.getAllByText("Aberto")).toHaveLength(2);

		// Ícone COLLECTOR (Sprout) — o fallback de iniciais não deve aparecer
		expect(screen.queryByText("RV")).not.toBeOnTheScreen();
	});

	it("renderiza iniciais do nome para empresas do tipo COMPANY", async () => {
		setupGeospatial({
			location: { coords: { latitude: -23.55, longitude: -46.63 } } as never,
		});
		jest.mocked(getV1Market).mockResolvedValue({
			data: {
				companies: [
					{
						...mockCompany,
						id: "company-3",
						company_type: "COMPANY",
						corporate_name: "Coleta Seletiva S.A.",
					},
				],
				next_cursor: null,
			},
		});

		await renderHome();

		expect(await screen.findByText("CS")).toBeOnTheScreen();
	});

	it("exibe badge Fechado quando isCompanyOpenNow retorna false", async () => {
		jest.mocked(isCompanyOpenNow).mockReturnValue(false);
		setupGeospatial({
			location: { coords: { latitude: -23.55, longitude: -46.63 } } as never,
		});
		jest.mocked(getV1Market).mockResolvedValue({
			data: { companies: [mockCompany], next_cursor: null },
		});

		await renderHome();

		expect(await screen.findByText("Fechado")).toBeOnTheScreen();
	});

	// -----------------------------------------------------------------------
	// Transições de estado
	// -----------------------------------------------------------------------
	it("transita de skeleton → UserCard ao fim do carregamento", async () => {
		setupAuth({ isLoading: true });
		await renderHome();

		expect(screen.getByTestId("home-header-skeleton")).toBeOnTheScreen();

		setupAuth({
			isLoading: false,
			isAuthenticated: true,
			user: {
				profile: {
					user_id: "u1",
					id: "p1",
					full_name: "Maria Souza",
					display_name: "Maria",
					phone: "11988888888",
					created_at: new Date(),
					updated_at: new Date(),
					profile_image: { url: "https://example.com/avatar.jpg" },
					address: {
						id: "a1",
						zip_code: "01310100",
						street: "Av Paulista",
						number: "500",
						complement: null,
						district: "Bela Vista",
						city: "São Paulo",
						city_ibge_id: 3550308,
						state: "São Paulo",
						state_code: "SP",
						state_ibge_id: 35,
						latitude: -23.55,
						longitude: -46.63,
					},
				},
			} as never,
		});
		await renderHome();

		expect(screen.getByText("Maria")).toBeOnTheScreen();
		expect(screen.queryByTestId("home-header-skeleton")).not.toBeOnTheScreen();
	});

	it("exibe loader → lista de empresas quando os dados chegam", async () => {
		setupGeospatial({
			location: { coords: { latitude: -23.55, longitude: -46.63 } } as never,
		});

		// Query pendente (promessa que nunca resolve)
		let resolveQuery!: (value: unknown) => void;
		jest.mocked(getV1Market).mockReturnValue(
			new Promise(resolve => {
				resolveQuery = resolve;
			}),
		);

		await renderHome();
		expect(screen.getByText("Buscando empresas…")).toBeOnTheScreen();

		// Resolve a query
		resolveQuery({
			data: { companies: [mockCompany], next_cursor: null },
		});

		await waitFor(() => {
			expect(screen.getByText("Recicladora Verde Ltda")).toBeOnTheScreen();
		});
		expect(screen.queryByText("Buscando empresas…")).not.toBeOnTheScreen();
	});

	// -----------------------------------------------------------------------
	// Interação: modal de perfil
	// -----------------------------------------------------------------------
	it("abre modal de finalizar cadastro ao pressionar Empresas com needsProfileCompletion", async () => {
		const user = userEvent.setup();
		setupAuth({
			isAuthenticated: true,
			needsProfileCompletion: true,
			user: null,
		});
		await renderHome();

		await user.press(screen.getByText("Empresas"));

		expect(screen.getByTestId("modal-is-open")).toHaveTextContent("true");
		expect(screen.getByTestId("modal-description")).toHaveTextContent(
			"Para acessar o gerenciamento de empresas você precisa finalizar o seu cadastro.",
		);
	});

	it("fecha modal ao pressionar botão de fechar", async () => {
		const user = userEvent.setup();
		setupAuth({
			isAuthenticated: true,
			needsProfileCompletion: true,
			user: null,
		});
		await renderHome();

		await user.press(screen.getByText("Empresas"));
		expect(screen.getByTestId("modal-is-open")).toHaveTextContent("true");

		await user.press(screen.getByTestId("modal-close-btn"));
		expect(screen.getByTestId("modal-is-open")).toHaveTextContent("false");
	});
});
