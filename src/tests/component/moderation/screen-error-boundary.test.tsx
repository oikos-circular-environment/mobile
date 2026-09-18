import { render, screen, userEvent } from "@testing-library/react-native";
import { ScreenErrorBoundary } from "@/components/screen-error-boundary";
import { recordAppError } from "@/libs/moderation/record-app-error";

jest.mock("@/libs/moderation/record-app-error", () => ({
	recordAppError: jest.fn(),
}));

describe("ScreenErrorBoundary", () => {
	beforeEach(() => {
		jest.useFakeTimers();
		jest.mocked(recordAppError).mockClear();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it("shows the fallback and calls recordAppError with the error and current route", async () => {
		const error = new Error("boom");

		await render(<ScreenErrorBoundary error={error} retry={jest.fn()} />);

		expect(screen.getByText("Algo deu errado")).toBeOnTheScreen();
		expect(recordAppError).toHaveBeenCalledWith(error, expect.any(String));
	});

	it("calls retry when the button is pressed", async () => {
		const user = userEvent.setup();
		const retry = jest.fn();

		await render(
			<ScreenErrorBoundary error={new Error("boom")} retry={retry} />,
		);

		await user.press(screen.getByText("Tentar novamente"));

		expect(retry).toHaveBeenCalledTimes(1);
	});
});
