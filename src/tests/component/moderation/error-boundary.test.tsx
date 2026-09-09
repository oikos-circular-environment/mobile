import { render, screen } from "@testing-library/react-native";
import { ErrorBoundary } from "@/components/error-boundary";
import {
	clearLastError,
	getLastError,
} from "@/libs/moderation/last-error-store";

jest.mock("@/libs/observe-events", () => ({
	logAppErrorEvent: jest.fn(),
}));

function Bomb(): never {
	throw new Error("kaboom");
}

describe("ErrorBoundary", () => {
	const consoleErrorSpy = jest
		.spyOn(console, "error")
		.mockImplementation(() => {});

	afterEach(() => {
		clearLastError();
		consoleErrorSpy.mockClear();
	});

	afterAll(() => {
		consoleErrorSpy.mockRestore();
	});

	it("renders children when nothing throws", async () => {
		await render(
			<ErrorBoundary>
				<></>
			</ErrorBoundary>,
		);

		expect(screen.queryByText("Algo deu errado")).not.toBeOnTheScreen();
	});

	it("shows the fallback and stores the last_error snapshot when a child throws", async () => {
		await render(
			<ErrorBoundary>
				<Bomb />
			</ErrorBoundary>,
		);

		expect(screen.getByText("Algo deu errado")).toBeOnTheScreen();

		const lastError = getLastError();
		expect(lastError?.message).toBe("kaboom");
		expect(lastError?.stack).toContain("kaboom");
		expect(lastError?.component_stack).toContain("Bomb");
	});
});
