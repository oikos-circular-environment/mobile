import { render, screen, userEvent } from "@testing-library/react-native";
import { AbandonSurveySheet } from "@/components/survey/abandon-survey-sheet";
import { useSurveyExecutionStore } from "@/stores/survey-execution-store";
import { useSurveyStore } from "@/stores/survey-store";

const mockDismissTo = jest.fn();
const mockEnqueueAbandon = jest.fn().mockResolvedValue(undefined);
const mockDrainOutbox = jest.fn().mockResolvedValue(undefined);

jest.mock("expo-router", () => ({
	useRouter: () => ({ dismissTo: mockDismissTo }),
}));

jest.mock("@/libs/survey/queue/outbox", () => ({
	enqueueAbandon: (...args: unknown[]) => mockEnqueueAbandon(...args),
	drainOutbox: (...args: unknown[]) => mockDrainOutbox(...args),
}));

describe("AbandonSurveySheet", () => {
	beforeEach(() => {
		jest.useFakeTimers();
		mockDismissTo.mockClear();
		mockEnqueueAbandon.mockClear();
		mockDrainOutbox.mockClear();
		useSurveyExecutionStore.getState().reset();
		useSurveyStore.getState().reset();
		useSurveyStore.getState().startSession("session-1", "CITIZEN");
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it("o motivo é opcional — abandonar funciona sem escrever nada", async () => {
		const user = userEvent.setup();
		const onClose = jest.fn();
		await render(<AbandonSurveySheet isOpen onClose={onClose} />);

		await user.press(screen.getByText("Sim, abandonar"));

		expect(mockEnqueueAbandon).toHaveBeenCalledWith(
			"session-1",
			expect.objectContaining({ session_id: "session-1", reason: undefined }),
		);
		expect(useSurveyStore.getState().status).toBe("ABANDONED");
		expect(onClose).toHaveBeenCalled();
		expect(mockDismissTo).toHaveBeenCalledWith("/(tabs)/(home)");
	});

	it("envia o motivo quando escrito", async () => {
		const user = userEvent.setup();
		await render(<AbandonSurveySheet isOpen onClose={jest.fn()} />);

		await user.type(
			screen.getByPlaceholderText(
				"Opcional. O que impediu de continuar? Ajuda a melhorar a pesquisa.",
			),
			"Sem tempo agora",
		);
		await user.press(screen.getByText("Sim, abandonar"));

		expect(mockEnqueueAbandon).toHaveBeenCalledWith(
			"session-1",
			expect.objectContaining({ reason: "Sem tempo agora" }),
		);
	});

	it("cancelar não registra abandono", async () => {
		const user = userEvent.setup();
		const onClose = jest.fn();
		await render(<AbandonSurveySheet isOpen onClose={onClose} />);

		await user.press(screen.getByText("Cancelar"));

		expect(mockEnqueueAbandon).not.toHaveBeenCalled();
		expect(onClose).toHaveBeenCalled();
	});
});
