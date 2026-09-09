import {
	clearLastError,
	getLastError,
	setLastError,
} from "@/libs/moderation/last-error-store";

describe("last-error-store", () => {
	afterEach(() => {
		clearLastError();
	});

	it("returns null when no error was captured", () => {
		expect(getLastError()).toBeNull();
	});

	it("stores message/stack/component_stack and stamps occurred_at", () => {
		const before = Date.now();

		setLastError({
			message: "boom",
			stack: "Error: boom\n  at foo",
			component_stack: "in Foo",
		});

		const stored = getLastError();
		expect(stored).not.toBeNull();
		expect(stored?.message).toBe("boom");
		expect(stored?.stack).toBe("Error: boom\n  at foo");
		expect(stored?.component_stack).toBe("in Foo");
		expect(stored?.occurred_at).toBeInstanceOf(Date);
		expect(stored?.occurred_at.getTime()).toBeGreaterThanOrEqual(before);
	});

	it("overwrites a previously stored error", () => {
		setLastError({ message: "first" });
		setLastError({ message: "second" });

		expect(getLastError()?.message).toBe("second");
	});

	it("clears the stored error", () => {
		setLastError({ message: "boom" });
		clearLastError();

		expect(getLastError()).toBeNull();
	});
});
