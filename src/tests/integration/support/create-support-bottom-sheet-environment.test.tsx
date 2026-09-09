import type BottomSheet from "@gorhom/bottom-sheet";
import { act, render, screen, userEvent } from "@testing-library/react-native";
import { useEffect, useRef } from "react";
import { CreateSupportBottomSheet } from "@/components/support/create-support-bottom-sheet";
import { useCreateSupportRequest } from "@/components/support/hooks/use-create-support-request";
import {
	clearLastError,
	getLastError,
} from "@/libs/moderation/last-error-store";

jest.mock("@/components/support/hooks/use-create-support-request", () => ({
	useCreateSupportRequest: jest.fn(),
}));

jest.mock("@/contexts/auth-context", () => ({
	useAuthContext: () => ({ account: { email: "user@test.com" } }),
}));

jest.mock("@/libs/use-pick-image", () => ({
	usePickImage: () => ({ pickImage: jest.fn(), isPicking: false }),
}));

jest.mock("@/components/support/attachment-row", () => ({
	AttachmentPickerRow: () => null,
}));

jest.mock("@/libs/moderation/device-info", () => ({
	getSupportDeviceInfo: jest.fn(() => ({
		platform: "ios",
		app_version: "1.2.3",
		os_version: "17.0",
		screen_size: "LARGE",
	})),
}));

jest.mock("@/libs/moderation/last-error-store", () => ({
	getLastError: jest.fn(),
	clearLastError: jest.fn(),
}));

const mockedGetLastError = getLastError as jest.Mock;
const mockedClearLastError = clearLastError as jest.Mock;
const mockedUseCreateSupportRequest = useCreateSupportRequest as jest.Mock;

function OpenedCreateSupportBottomSheet({
	onSuccess,
}: {
	onSuccess: () => void;
}) {
	const ref = useRef<BottomSheet>(null);

	useEffect(() => {
		ref.current?.expand();
	}, []);

	return <CreateSupportBottomSheet ref={ref} onSuccess={onSuccess} />;
}

async function fillAndSubmit() {
	const user = userEvent.setup();

	await user.type(
		screen.getByPlaceholderText("Resuma o problema em poucas palavras"),
		"Titulo com mais de dez caracteres",
	);
	await user.type(
		screen.getByPlaceholderText("Descreva com o máximo de detalhes possível"),
		"Descricao com mais de vinte caracteres para passar na validacao",
	);
	await user.press(screen.getByText("Enviar"));
}

describe("CreateSupportBottomSheet environment metadata", () => {
	let mutate: jest.Mock;

	beforeEach(() => {
		jest.useFakeTimers();
		mockedGetLastError.mockReset().mockReturnValue(null);
		mockedClearLastError.mockReset();
		mutate = jest.fn();
		mockedUseCreateSupportRequest.mockReturnValue({
			mutate,
			isPending: false,
		});
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it("attaches device info without last_error for non-ERROR types", async () => {
		await render(<OpenedCreateSupportBottomSheet onSuccess={jest.fn()} />);
		await fillAndSubmit();

		expect(mutate).toHaveBeenCalledTimes(1);
		const [{ body }] = mutate.mock.calls[0];
		expect(body.environment).toEqual({
			platform: "ios",
			app_version: "1.2.3",
			os_version: "17.0",
			screen_size: "LARGE",
		});
	});

	it("attaches last_error when type is ERROR and a snapshot was captured", async () => {
		const lastError = {
			message: "boom",
			stack: "Error: boom",
			occurred_at: new Date("2026-01-01T00:00:00.000Z"),
		};
		mockedGetLastError.mockReturnValue(lastError);

		await render(<OpenedCreateSupportBottomSheet onSuccess={jest.fn()} />);
		// "ERROR" já é o tipo padrão selecionado no formulário.
		await fillAndSubmit();

		expect(mutate).toHaveBeenCalledTimes(1);
		const [{ body }] = mutate.mock.calls[0];
		expect(body.environment.last_error).toEqual(lastError);
	});

	it("clears the stored last_error only after a successful submit", async () => {
		mockedGetLastError.mockReturnValue({ message: "boom" });

		await render(<OpenedCreateSupportBottomSheet onSuccess={jest.fn()} />);
		await fillAndSubmit();

		const [, callbacks] = mutate.mock.calls[0];
		expect(mockedClearLastError).not.toHaveBeenCalled();

		act(() => {
			callbacks.onSuccess();
		});

		expect(mockedClearLastError).toHaveBeenCalledTimes(1);
	});
});
