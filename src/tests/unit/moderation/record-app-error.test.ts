import { Observe } from "expo-observe";
import { insertAppError } from "@/libs/moderation/app-errors-store";
import { recordAppError } from "@/libs/moderation/record-app-error";
import { logAppErrorEvent } from "@/libs/observe-events";

jest.mock("@/libs/observe-events", () => ({
	logAppErrorEvent: jest.fn(),
}));

jest.mock("expo-observe", () => ({
	Observe: { reportError: jest.fn() },
}));

jest.mock("@/libs/moderation/app-errors-store", () => ({
	insertAppError: jest.fn().mockResolvedValue(undefined),
}));

describe("recordAppError", () => {
	afterEach(() => {
		jest.mocked(logAppErrorEvent).mockClear();
		jest.mocked(Observe.reportError).mockClear();
		jest.mocked(insertAppError).mockClear();
	});

	it("defaults to error severity when none is given", () => {
		recordAppError(new Error("boom"), "/market");

		expect(logAppErrorEvent).toHaveBeenCalledWith("boom", "/market", "error");
	});

	it("forwards fatal severity when explicitly requested", () => {
		recordAppError(new Error("boom"), "/market", undefined, "fatal");

		expect(logAppErrorEvent).toHaveBeenCalledWith("boom", "/market", "fatal");
	});

	it("reports the raw error to Observe and persists it locally", () => {
		const error = new Error("boom");

		recordAppError(error, "/market", "at Bomb");

		expect(Observe.reportError).toHaveBeenCalledWith(error);
		expect(insertAppError).toHaveBeenCalledWith({
			message: "boom",
			stack: error.stack,
			componentStack: "at Bomb",
			route: "/market",
			severity: "error",
		});
	});
});
