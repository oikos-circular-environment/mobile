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

	it("chains the previous global handler and stores the error snapshot", () => {
		const originalHandler = jest.fn();
		const fakeErrorUtils = installFakeErrorUtils(originalHandler);

		require("@/libs/moderation/global-error-handler");
		const { getLastError } = require("@/libs/moderation/last-error-store");

		const registeredHandler = fakeErrorUtils.setGlobalHandler.mock.calls[0][0];
		const error = new Error("boom");

		registeredHandler(error, true);

		expect(originalHandler).toHaveBeenCalledWith(error, true);
		expect(getLastError()).toMatchObject({
			message: "boom",
			stack: error.stack,
		});
	});

	it("stringifies non-Error values instead of leaving message empty", () => {
		const originalHandler = jest.fn();
		const fakeErrorUtils = installFakeErrorUtils(originalHandler);

		require("@/libs/moderation/global-error-handler");
		const { getLastError } = require("@/libs/moderation/last-error-store");

		const registeredHandler = fakeErrorUtils.setGlobalHandler.mock.calls[0][0];

		registeredHandler("plain string error", false);

		expect(originalHandler).toHaveBeenCalledWith("plain string error", false);
		expect(getLastError()).toMatchObject({
			message: "plain string error",
			stack: undefined,
		});
	});
});
