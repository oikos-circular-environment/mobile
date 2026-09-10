import { render, screen, userEvent } from "@testing-library/react-native";
import AccountScreen from "@/app/(tabs)/(home)/account";
import { useAuthContext } from "@/contexts/auth-context";

jest.mock("@/contexts/auth-context");

jest.mock("@/hooks/use-route-interactive", () => ({
	useRouteInteractive: jest.fn(),
}));

jest.mock("@/components/settings/change-password-bottom-sheet", () => {
	const { View: V } = require("react-native");
	return {
		ChangePasswordBottomSheet: require("react").forwardRef(() => (
			<V testID="change-password-bottom-sheet" />
		)),
	};
});

jest.mock("@/components/settings/delete-account-modal", () => {
	const { Pressable, Text: T, View: V } = require("react-native");
	return {
		DeleteAccountModal: ({
			isOpen,
			onConfirm,
		}: {
			isOpen: boolean;
			onConfirm: () => void;
		}) => (
			<V testID="delete-account-modal">
				<T testID="delete-modal-is-open">{String(isOpen)}</T>
				<Pressable testID="delete-modal-confirm" onPress={onConfirm}>
					<T>Confirmar</T>
				</Pressable>
			</V>
		),
	};
});

const requestDeletion = jest.fn();
const cancelDeletion = jest.fn();

const account = {
	id: "user-1",
	email: "maria.silva@email.com",
	created_at: new Date("2026-01-01"),
	deleted_at: null,
};

function setupAuth(overrides: Record<string, unknown> = {}) {
	jest.mocked(useAuthContext).mockReturnValue({
		account,
		deletionScheduledAt: null,
		requestDeletion,
		isRequestingDeletion: false,
		cancelDeletion,
		isCancellingDeletion: false,
		...overrides,
	} as unknown as ReturnType<typeof useAuthContext>);
}

describe("account", () => {
	beforeEach(() => {
		jest.useFakeTimers();
		setupAuth();
	});

	afterEach(() => {
		jest.useRealTimers();
		jest.clearAllMocks();
	});

	it("shows the account email", async () => {
		await render(<AccountScreen />);

		expect(screen.getByText("maria.silva@email.com")).toBeOnTheScreen();
	});

	it("offers password change and account deletion", async () => {
		await render(<AccountScreen />);

		expect(screen.getByText("Mudar senha")).toBeOnTheScreen();
		expect(screen.getByText("Excluir minha conta")).toBeOnTheScreen();
	});

	it("requests deletion after confirming the modal", async () => {
		const user = userEvent.setup();
		await render(<AccountScreen />);

		await user.press(screen.getByText("Excluir minha conta"));
		expect(screen.getByTestId("delete-modal-is-open")).toHaveTextContent(
			"true",
		);

		await user.press(screen.getByTestId("delete-modal-confirm"));

		expect(requestDeletion).toHaveBeenCalledTimes(1);
	});

	it("shows the remaining days when deletion is scheduled", async () => {
		const scheduledAt = new Date();
		scheduledAt.setDate(scheduledAt.getDate() - 3);
		setupAuth({ deletionScheduledAt: scheduledAt });

		await render(<AccountScreen />);

		expect(screen.getByText("Faltam 87 dias")).toBeOnTheScreen();
		expect(screen.queryByText("Excluir minha conta")).not.toBeOnTheScreen();
	});

	it("cancels a scheduled deletion", async () => {
		const user = userEvent.setup();
		setupAuth({ deletionScheduledAt: new Date() });
		await render(<AccountScreen />);

		await user.press(screen.getByText("Cancelar exclusão da conta"));

		expect(cancelDeletion).toHaveBeenCalledTimes(1);
	});
});
