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
import {
	makeAddress,
	makeCompany,
	makeProfile,
	makeUser,
	makeWaste,
} from "@/tests/factories";

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

jest.mock("@/components/settings/settings-bottom-sheet", () => {
	const { View: V } = require("react-native");
	return {
		SettingsBottomSheet: require("react").forwardRef(() => (
			<V testID="settings-bottom-sheet" />
		)),
	};
});

jest.mock("@/components/settings/delete-account-modal", () => {
	const { View: V } = require("react-native");
	return { DeleteAccountModal: () => <V testID="delete-account-modal" /> };
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

const mockCompany = makeCompany({
	id: "company-1",
	business_name: "Recicladora Verde Ltda",
	corporate_name: "Recicladora Verde Ltda",
	company_type: "COLLECTOR",
	phones: ["11999999999"],
	wastes: [
		makeWaste({ id: "w-1", name: "Papel", unit: "KG", price: 0, quantity: 0 }),
	],
	distance_in_meters: 500,
});

const defaultAuth = {
	user: null,
	isAuthenticated: false,
	isLoading: false,
	needsProfileCompletion: false,
	deletionScheduledAt: null,
	signIn: jest.fn(),
	signUp: jest.fn(),
	signOut: jest.fn(),
	requestDeletion: jest.fn(),
	cancelDeletion: jest.fn(),
	isRequestingDeletion: false,
	isCancellingDeletion: false,
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

describe("HomeScreen — integração", () => {
	beforeEach(() => {
		jest.useFakeTimers();
		mockLinkPress.mockReset();
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

	it("renderiza GuestCard com boas-vindas para visitante", async () => {
		setupAuth({ isAuthenticated: false });
		await renderHome();

		expect(screen.getByText("Bem-Vindos a Oikos!")).toBeOnTheScreen();
	});

	it("renderiza UserCard com nome de exibição para usuário logado", async () => {
		setupAuth({
			isAuthenticated: true,
			user: makeUser({
				profile: makeProfile({
					user_id: "u1",
					id: "p1",
					full_name: "João Silva",
					display_name: "João",
					phone: "11999999999",
					address: makeAddress({
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
					}),
				}),
			}) as never,
		});
		await renderHome();

		expect(screen.getByText("João")).toBeOnTheScreen();
	});

	it("renderiza card de cadastro pendente quando autenticado sem perfil", async () => {
		setupAuth({ isAuthenticated: true, user: null });
		await renderHome();

		expect(screen.getByText("Finalize seu cadastro")).toBeOnTheScreen();
	});

	it("exibe títulos das seções Serviços e Próximas de você", async () => {
		await renderHome();

		expect(screen.getByText("Serviços")).toBeOnTheScreen();
		expect(screen.getByText("Próximas de você")).toBeOnTheScreen();
		expect(screen.getByText("Empresas em até 2 km")).toBeOnTheScreen();
		expect(screen.getByText("Ver todas")).toBeOnTheScreen();
	});

	it("carrega e exibe 20 empresas próximas com dados formatados", async () => {
		const companies = Array.from({ length: 20 }, (_, i) =>
			makeCompany({
				id: `company-${i + 1}`,
				business_name: `Empresa ${i + 1}`,
				corporate_name: `Empresa ${i + 1}`,
				company_type: i === 0 ? "COLLECTOR" : "COMPANY",
			}),
		);

		// Primeira é COLLECTOR para testar badge Coletor
		companies[0] = {
			...companies[0],
			distance_in_meters: 500,
			wastes: [makeWaste({ id: "w-1", name: "Papel" })],
		};
		// Segunda é COMPANY com nome específico para testar iniciais
		companies[1] = {
			...companies[1],
			business_name: "Coleta Seletiva S.A.",
			distance_in_meters: 1200,
			wastes: [
				makeWaste({ id: "w-2", name: "Plástico" }),
				makeWaste({ id: "w-3", name: "Vidro" }),
			],
		};

		setupGeospatial({
			location: { coords: { latitude: -23.55, longitude: -46.63 } } as never,
		});
		jest.mocked(getV1Market).mockResolvedValue({
			data: { companies, next_cursor: null },
		} as unknown as Awaited<ReturnType<typeof getV1Market>>);

		await renderHome();

		// Nomes das empresas
		expect(await screen.findByText("Empresa 1")).toBeOnTheScreen();
		expect(screen.getByText("Coleta Seletiva S.A.")).toBeOnTheScreen();
		expect(screen.getByText("Empresa 3")).toBeOnTheScreen();

		// Resíduos (cada um em seu badge)
		expect(screen.getByText("Papel")).toBeOnTheScreen();
		expect(screen.getByText("Plástico")).toBeOnTheScreen();
		expect(screen.getByText("Vidro")).toBeOnTheScreen();

		// Distância formatada
		expect(screen.getByText("500 m")).toBeOnTheScreen();
		expect(screen.getByText("1,2 km")).toBeOnTheScreen();

		// 20 badges de status (todas abertas)
		expect(screen.getAllByText("Aberto")).toHaveLength(20);

		// Badge Coletor (apenas company-1 é COLLECTOR)
		expect(screen.getByText("Coletor")).toBeOnTheScreen();
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
						business_name: "Coleta Seletiva S.A.",
						company_type: "COMPANY",
						corporate_name: "Coleta Seletiva S.A.",
					},
				],
				next_cursor: null,
			},
		} as unknown as Awaited<ReturnType<typeof getV1Market>>);

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
		} as unknown as Awaited<ReturnType<typeof getV1Market>>);

		await renderHome();

		expect(await screen.findByText("Fechado")).toBeOnTheScreen();
	});

	it("transita de skeleton → UserCard ao fim do carregamento", async () => {
		setupAuth({ isLoading: true });
		await renderHome();

		expect(screen.getByTestId("home-header-skeleton")).toBeOnTheScreen();

		setupAuth({
			isLoading: false,
			isAuthenticated: true,
			user: makeUser({
				profile: makeProfile({
					user_id: "u1",
					id: "p1",
					full_name: "Maria Souza",
					display_name: "Maria",
					phone: "11988888888",
					profile_image: {
						id: "pi-1",
						url: "https://example.com/avatar.jpg",
						file_name: "avatar.jpg",
						path: "/avatars/avatar.jpg",
						created_at: new Date("2025-01-01"),
					},
					address: makeAddress({
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
					}),
				}),
			}) as never,
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
			}) as unknown as ReturnType<typeof getV1Market>,
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
