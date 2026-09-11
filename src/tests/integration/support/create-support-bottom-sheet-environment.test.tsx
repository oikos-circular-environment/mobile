import type BottomSheet from "@gorhom/bottom-sheet";
import { render, screen, userEvent } from "@testing-library/react-native";
import { useEffect, useRef } from "react";
import { CreateSupportBottomSheet } from "@/components/support/create-support-bottom-sheet";
import { useCreateSupportRequest } from "@/components/support/hooks/use-create-support-request";
import { getRecentAppErrors } from "@/libs/moderation/app-errors-store";

jest.mock("@/components/support/hooks/use-create-support-request", () => ({
	useCreateSupportRequest: jest.fn(),
}));

jest.mock("@/contexts/auth-context", () => ({
	useAuthContext: () => ({ account: { email: "user@test.com" } }),
}));

jest.mock("@/hooks/use-pick-image", () => ({
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

jest.mock("@/libs/moderation/app-errors-store", () => ({
	getRecentAppErrors: jest.fn(),
}));

const mockedGetRecentAppErrors = getRecentAppErrors as jest.Mock;
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
		mockedGetRecentAppErrors.mockReset().mockResolvedValue([]);
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

	it("attaches last_error (most recent) and last_errors (up to 10) without the local bookkeeping id", async () => {
		mockedGetRecentAppErrors.mockResolvedValue([
			{
				id: "row-2",
				message: "boom 2",
				stack: "Error: boom 2",
				occurred_at: new Date("2026-01-02T00:00:00.000Z"),
			},
			{
				id: "row-1",
				message: "boom 1",
				stack: "Error: boom 1",
				occurred_at: new Date("2026-01-01T00:00:00.000Z"),
			},
		]);

		await render(<OpenedCreateSupportBottomSheet onSuccess={jest.fn()} />);
		// "ERROR" já é o tipo padrão selecionado no formulário.
		await fillAndSubmit();

		expect(mutate).toHaveBeenCalledTimes(1);
		const [{ body }] = mutate.mock.calls[0];
		expect(body.environment.last_error).toEqual({
			message: "boom 2",
			stack: "Error: boom 2",
			component_stack: undefined,
			occurred_at: new Date("2026-01-02T00:00:00.000Z"),
		});
		expect(body.environment.last_errors).toEqual([
			{
				message: "boom 2",
				stack: "Error: boom 2",
				component_stack: undefined,
				occurred_at: new Date("2026-01-02T00:00:00.000Z"),
			},
			{
				message: "boom 1",
				stack: "Error: boom 1",
				component_stack: undefined,
				occurred_at: new Date("2026-01-01T00:00:00.000Z"),
			},
		]);
	});
});
