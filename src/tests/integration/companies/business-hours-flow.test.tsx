import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import CompanyBusinessHoursScreen from "@/app/(tabs)/(home)/companies/[companyId]/business-hours";
import { useSaveBusinessHours } from "@/components/companies/hooks/use-save-business-hours";
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

jest.mock("@/components/companies/hooks/use-save-business-hours");

jest.mock(
	"@/components/companies/business-hours/day-business-hour-field",
	() => ({
		DayBusinessHourField: ({
			dayLabel,
			dayIndex,
			control,
		}: {
			dayLabel: string;
			dayIndex: number;
			control: unknown;
		}) => {
			const React = require("react");
			const { Controller } = require("react-hook-form");
			const { Pressable, Text, View } = require("react-native");
			return (
				<Controller
					control={control}
					name={`businessHours.${dayIndex}.is_open`}
					render={({
						field: { value, onChange },
					}: {
						field: { value: boolean; onChange: (v: boolean) => void };
					}) => (
						<View>
							<Text>{dayLabel}</Text>
							<Pressable
								testID={`toggle-${dayLabel}`}
								onPress={() => onChange(!value)}
							/>
						</View>
					)}
				/>
			);
		},
	}),
);

jest.mock("@/components/companies/skeletons", () => ({
	BusinessHoursSkeleton: () => {
		const React = require("react");
		const { View } = require("react-native");
		return <View testID="skeleton-business-hours" />;
	},
}));

const mockBusinessHours = [
	{ id: "bh-sun", day_of_week: "SUNDAY", is_open: false, time_slots: [] },
	{
		id: "bh-mon",
		day_of_week: "MONDAY",
		is_open: true,
		time_slots: [
			{ id: "ts-1", start_time: "08:00", end_time: "12:00" },
			{ id: "ts-2", start_time: "13:00", end_time: "17:00" },
		],
	},
	{ id: "bh-tue", day_of_week: "TUESDAY", is_open: false, time_slots: [] },
	{ id: "bh-wed", day_of_week: "WEDNESDAY", is_open: false, time_slots: [] },
	{ id: "bh-thu", day_of_week: "THURSDAY", is_open: false, time_slots: [] },
	{ id: "bh-fri", day_of_week: "FRIDAY", is_open: false, time_slots: [] },
	{ id: "bh-sat", day_of_week: "SATURDAY", is_open: false, time_slots: [] },
] as unknown as Company["business_hours"];

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
	company: Company = makeStoreCompany({
		id: "company-1",
		business_name: "Empresa Teste",
		corporate_name: "Empresa Teste Ltda",
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
			<CompanyBusinessHoursScreen />
		</QueryClientProvider>,
	);
}

describe("CompanyBusinessHoursScreen — integração", () => {
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
		jest.mocked(useSaveBusinessHours).mockReturnValue({
			mutateAsync: mockSaveAsync,
			isPending: false,
		} as unknown as ReturnType<typeof useSaveBusinessHours>);
	});

	afterEach(async () => {
		await act(async () => {});
		queryClient?.clear();
		jest.clearAllMocks();
	});

	it("exibe skeleton quando isLoaded é false", async () => {
		setupStore(mockCompany, false);
		await renderScreen();
		expect(screen.getByTestId("skeleton-business-hours")).toBeOnTheScreen();
	});

	it("renderiza 7 campos de dias quando empresa não tem business_hours", async () => {
		await renderScreen();
		expect(screen.getByText("Domingo")).toBeOnTheScreen();
		expect(screen.getByText("Segunda-feira")).toBeOnTheScreen();
		expect(screen.getByText("Sábado")).toBeOnTheScreen();
	});

	it("popula o formulário a partir dos business_hours existentes sem marcar dirty", async () => {
		setupStore({ ...mockCompany, business_hours: mockBusinessHours });
		await renderScreen();
		expect(screen.getByTestId("btn-save")).toBeDisabled();
		expect(screen.getByTestId("btn-cancel")).toBeDisabled();
	});

	it("botões Cancelar e Salvar desabilitados quando formulário não está dirty", async () => {
		await renderScreen();
		expect(screen.getByTestId("btn-save")).toBeDisabled();
		expect(screen.getByTestId("btn-cancel")).toBeDisabled();
	});

	it("ativar toggle de um dia torna o formulário dirty e habilita os botões", async () => {
		await renderScreen();
		await fireEvent.press(screen.getByTestId("toggle-Segunda-feira"));
		expect(screen.getByTestId("btn-save")).not.toBeDisabled();
		expect(screen.getByTestId("btn-cancel")).not.toBeDisabled();
	});

	it("submit chama saveBusinessHours com o payload correto", async () => {
		await renderScreen();
		await fireEvent.press(screen.getByTestId("toggle-Segunda-feira"));
		await fireEvent.press(screen.getByTestId("btn-save"));
		await waitFor(() =>
			expect(mockSaveAsync).toHaveBeenCalledWith(
				expect.objectContaining({
					business_hours: expect.arrayContaining([
						expect.objectContaining({
							day_of_week: "MONDAY",
							is_open: true,
						}),
						expect.objectContaining({
							day_of_week: "SUNDAY",
							is_open: false,
						}),
					]),
				}),
			),
		);
	});

	it("cancelar reseta o formulário para os valores iniciais", async () => {
		await renderScreen();
		await fireEvent.press(screen.getByTestId("toggle-Segunda-feira"));
		expect(screen.getByTestId("btn-cancel")).not.toBeDisabled();
		await fireEvent.press(screen.getByTestId("btn-cancel"));
		expect(screen.getByTestId("btn-save")).toBeDisabled();
	});
});
