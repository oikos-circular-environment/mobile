import { render, screen, userEvent } from "@testing-library/react-native";
import { DeleteSurveyDataSheet } from "@/components/survey/delete-survey-data-sheet";
import { useSurveyStore } from "@/stores/survey-store";

const mockDismissTo = jest.fn();
const mockDeleteLocalSurveyData = jest.fn().mockResolvedValue(undefined);

jest.mock("expo-router", () => ({
	useRouter: () => ({ dismissTo: mockDismissTo }),
}));

jest.mock("@/libs/survey/delete-local-data", () => ({
	deleteLocalSurveyData: (...args: unknown[]) =>
		mockDeleteLocalSurveyData(...args),
}));

describe("DeleteSurveyDataSheet", () => {
	beforeEach(() => {
		jest.useFakeTimers();
		mockDismissTo.mockClear();
		mockDeleteLocalSurveyData.mockClear();
		useSurveyStore.getState().reset();
		useSurveyStore.getState().startSession("session-1", "CITIZEN");
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it("exibe o código do participante quando informado", async () => {
		await render(
			<DeleteSurveyDataSheet
				isOpen
				onClose={jest.fn()}
				participantCode="PSQ-7X29-QK41"
			/>,
		);

		expect(screen.getByText("PSQ-7X29-QK41")).toBeOnTheScreen();
	});

	it("mostra estado de sincronização quando o código ainda não chegou", async () => {
		await render(
			<DeleteSurveyDataSheet
				isOpen
				onClose={jest.fn()}
				participantCode={null}
			/>,
		);

		expect(screen.getByText("Sincronizando…")).toBeOnTheScreen();
	});

	it("excluir apaga a cópia local, zera os stores e fecha para a home", async () => {
		const user = userEvent.setup();
		const onClose = jest.fn();
		await render(
			<DeleteSurveyDataSheet
				isOpen
				onClose={onClose}
				participantCode="PSQ-7X29-QK41"
			/>,
		);

		await user.press(screen.getByText("Excluir meus dados"));

		expect(mockDeleteLocalSurveyData).toHaveBeenCalledWith("session-1");
		expect(useSurveyStore.getState().sessionId).toBeNull();
		expect(onClose).toHaveBeenCalled();
		expect(mockDismissTo).toHaveBeenCalledWith("/(tabs)/(home)");
	});

	it("cancelar não apaga nada", async () => {
		const user = userEvent.setup();
		const onClose = jest.fn();
		await render(
			<DeleteSurveyDataSheet
				isOpen
				onClose={onClose}
				participantCode="PSQ-7X29-QK41"
			/>,
		);

		await user.press(screen.getByText("Cancelar"));

		expect(mockDeleteLocalSurveyData).not.toHaveBeenCalled();
		expect(onClose).toHaveBeenCalled();
	});
});
