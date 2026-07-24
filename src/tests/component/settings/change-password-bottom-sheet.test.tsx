import type BottomSheet from "@gorhom/bottom-sheet";
import { act, render, screen, userEvent } from "@testing-library/react-native";
import { createRef } from "react";
import { ChangePasswordBottomSheet } from "@/components/settings/change-password-bottom-sheet";
import { useAuthContext } from "@/contexts/auth-context";

jest.mock("@/contexts/auth-context");

const changePassword = jest.fn();
const onSuccess = jest.fn();
const sheetRef = createRef<BottomSheet>();

function setupAuth(overrides: Record<string, unknown> = {}) {
	jest.mocked(useAuthContext).mockReturnValue({
		changePassword,
		isChangingPassword: false,
		...overrides,
	} as unknown as ReturnType<typeof useAuthContext>);
}

async function renderSheet() {
	await render(
		<ChangePasswordBottomSheet ref={sheetRef} onSuccess={onSuccess} />,
	);
	await act(async () => {
		sheetRef.current?.snapToIndex(0);
	});
}

async function fillForm(
	user: ReturnType<typeof userEvent.setup>,
	values: { current: string; next: string; confirm: string },
) {
	const [current, next, confirm] = screen.getAllByPlaceholderText("••••••••");
	await user.type(current, values.current);
	await user.type(next, values.next);
	await user.type(confirm, values.confirm);
}

describe("change-password-bottom-sheet", () => {
	beforeEach(() => {
		jest.useFakeTimers();
		setupAuth();
	});

	afterEach(() => {
		jest.useRealTimers();
		jest.clearAllMocks();
	});

	it("renders the three password fields when opened", async () => {
		await renderSheet();

		expect(screen.getByText("Senha atual")).toBeOnTheScreen();
		expect(screen.getByText("Nova senha")).toBeOnTheScreen();
		expect(screen.getByText("Confirmar nova senha")).toBeOnTheScreen();
	});

	it("submits the typed passwords", async () => {
		const user = userEvent.setup();
		await renderSheet();

		await fillForm(user, {
			current: "old-password",
			next: "new-password",
			confirm: "new-password",
		});
		await user.press(screen.getByText("Salvar nova senha"));

		expect(changePassword).toHaveBeenCalledWith(
			{ currentPassword: "old-password", newPassword: "new-password" },
			expect.objectContaining({ onSuccess: expect.any(Function) }),
		);
	});

	it("closes the sheet after a successful change", async () => {
		const user = userEvent.setup();
		changePassword.mockImplementation((_values, options) => {
			options.onSuccess();
		});
		await renderSheet();

		await fillForm(user, {
			current: "old-password",
			next: "new-password",
			confirm: "new-password",
		});
		await user.press(screen.getByText("Salvar nova senha"));

		expect(onSuccess).toHaveBeenCalledTimes(1);
	});

	it("rejects a confirmation that does not match", async () => {
		const user = userEvent.setup();
		await renderSheet();

		await fillForm(user, {
			current: "old-password",
			next: "new-password",
			confirm: "other-password",
		});
		await user.press(screen.getByText("Salvar nova senha"));

		expect(
			await screen.findByText("As senhas não conferem."),
		).toBeOnTheScreen();
		expect(changePassword).not.toHaveBeenCalled();
	});

	it("rejects a new password equal to the current one", async () => {
		const user = userEvent.setup();
		await renderSheet();

		await fillForm(user, {
			current: "same-password",
			next: "same-password",
			confirm: "same-password",
		});
		await user.press(screen.getByText("Salvar nova senha"));

		expect(
			await screen.findByText("A nova senha precisa ser diferente da atual."),
		).toBeOnTheScreen();
		expect(changePassword).not.toHaveBeenCalled();
	});

	it("rejects passwords shorter than six characters", async () => {
		const user = userEvent.setup();
		await renderSheet();

		await fillForm(user, { current: "abc", next: "abcde", confirm: "abcde" });
		await user.press(screen.getByText("Salvar nova senha"));

		expect(
			await screen.findAllByText("A senha precisa ter no mínimo 6 caracteres."),
		).toHaveLength(2);
		expect(changePassword).not.toHaveBeenCalled();
	});
});
