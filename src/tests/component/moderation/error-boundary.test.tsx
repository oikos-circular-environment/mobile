import { render, screen } from "@testing-library/react-native";
import { ErrorBoundary } from "@/components/error-boundary";
import { recordAppError } from "@/libs/moderation/record-app-error";

jest.mock("@/libs/moderation/record-app-error", () => ({
	recordAppError: jest.fn(),
}));

function Bomb(): never {
	throw new Error("kaboom");
}

describe("ErrorBoundary", () => {
	const consoleErrorSpy = jest
		.spyOn(console, "error")
		.mockImplementation(() => {});

	afterEach(() => {
		consoleErrorSpy.mockClear();
		jest.mocked(recordAppError).mockClear();
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

	it("shows the fallback when a child throws", async () => {
		await render(
			<ErrorBoundary>
				<Bomb />
			</ErrorBoundary>,
		);

		expect(screen.getByText("Algo deu errado")).toBeOnTheScreen();
	});

	it("records the error as fatal, since it takes down the whole app", async () => {
		await render(
			<ErrorBoundary>
				<Bomb />
			</ErrorBoundary>,
		);

		expect(recordAppError).toHaveBeenCalledWith(
			expect.objectContaining({ message: "kaboom" }),
			expect.any(String),
			expect.any(String),
			"fatal",
		);
	});
});
