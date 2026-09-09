import { Observe } from "expo-observe";
import { getLastError } from "@/libs/moderation/last-error-store";
import { recordAppError } from "@/libs/moderation/record-app-error";
import { logAppErrorEvent } from "@/libs/observe-events";

jest.mock("@/libs/observe-events", () => ({
	logAppErrorEvent: jest.fn(),
}));

jest.mock("expo-observe", () => ({
	Observe: { reportError: jest.fn() },
}));

describe("recordAppError", () => {
	afterEach(() => {
		jest.mocked(logAppErrorEvent).mockClear();
		jest.mocked(Observe.reportError).mockClear();
	});

	it("defaults to error severity when none is given", () => {
		recordAppError(new Error("boom"), "/market");

		expect(logAppErrorEvent).toHaveBeenCalledWith("boom", "/market", "error");
	});

	it("forwards fatal severity when explicitly requested", () => {
		recordAppError(new Error("boom"), "/market", undefined, "fatal");

		expect(logAppErrorEvent).toHaveBeenCalledWith("boom", "/market", "fatal");
	});

	it("reports the raw error to Observe and stores the last_error snapshot", () => {
		const error = new Error("boom");

		recordAppError(error, "/market", "at Bomb");

		expect(Observe.reportError).toHaveBeenCalledWith(error);

		const lastError = getLastError();
		expect(lastError?.message).toBe("boom");
		expect(lastError?.component_stack).toBe("at Bomb");
	});
});
