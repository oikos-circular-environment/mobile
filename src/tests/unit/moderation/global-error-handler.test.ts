jest.mock("@/libs/moderation/record-app-error", () => ({
	recordAppError: jest.fn(),
}));

type FakeErrorUtils = {
	getGlobalHandler: jest.Mock;
	setGlobalHandler: jest.Mock;
};

function installFakeErrorUtils(originalHandler: jest.Mock): FakeErrorUtils {
	const fake: FakeErrorUtils = {
		getGlobalHandler: jest.fn(() => originalHandler),
		setGlobalHandler: jest.fn(),
	};
	(global as unknown as { ErrorUtils: FakeErrorUtils }).ErrorUtils = fake;
	return fake;
}

describe("global-error-handler", () => {
	const originalErrorUtils = (global as unknown as { ErrorUtils: unknown })
		.ErrorUtils;

	afterEach(() => {
		(global as unknown as { ErrorUtils: unknown }).ErrorUtils =
			originalErrorUtils;
		jest.resetModules();
	});

	it("chains the previous global handler and records the error as fatal", () => {
		const originalHandler = jest.fn();
		const fakeErrorUtils = installFakeErrorUtils(originalHandler);

		require("@/libs/moderation/global-error-handler");
		const { recordAppError } = require("@/libs/moderation/record-app-error");

		const registeredHandler = fakeErrorUtils.setGlobalHandler.mock.calls[0][0];
		const error = new Error("boom");

		registeredHandler(error, true);

		expect(originalHandler).toHaveBeenCalledWith(error, true);
		expect(recordAppError).toHaveBeenCalledWith(
			error,
			undefined,
			undefined,
			"fatal",
		);
	});

	it("stringifies non-Error values and records with error severity when not fatal", () => {
		const originalHandler = jest.fn();
		const fakeErrorUtils = installFakeErrorUtils(originalHandler);

		require("@/libs/moderation/global-error-handler");
		const { recordAppError } = require("@/libs/moderation/record-app-error");

		const registeredHandler = fakeErrorUtils.setGlobalHandler.mock.calls[0][0];

		registeredHandler("plain string error", false);

		expect(originalHandler).toHaveBeenCalledWith("plain string error", false);
		expect(recordAppError).toHaveBeenCalledWith(
			expect.objectContaining({ message: "plain string error" }),
			undefined,
			undefined,
			"error",
		);
	});
});
