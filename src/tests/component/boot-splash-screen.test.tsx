import { render, screen } from "@testing-library/react-native";
import * as Font from "expo-font";
import * as Updates from "expo-updates";
import {
	BootSplashScreen,
	DevBootDiagnostics,
	OtaBootSplash,
} from "@/components/boot-splash-screen";

jest.mock("expo-updates", () => ({
	checkForUpdateAsync: jest.fn(),
	fetchUpdateAsync: jest.fn(),
	reloadAsync: jest.fn(),
	useUpdates: jest.fn(() => ({ downloadProgress: 0 })),
	isEmbeddedLaunch: true,
	channel: "production",
	runtimeVersion: "abc123",
}));

jest.mock("expo-font", () => ({
	isLoaded: jest.fn(() => false),
	getLoadedFonts: jest.fn(() => []),
}));

describe("boot-splash-screen", () => {
	beforeEach(() => {
		jest.useFakeTimers();
		jest.mocked(Updates.checkForUpdateAsync).mockReset();
		jest.mocked(Updates.fetchUpdateAsync).mockReset();
		jest.mocked(Updates.reloadAsync).mockReset();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	test("renders the wordmark and the checking status from the first frame, before any update check resolves", async () => {
		jest
			.mocked(Updates.checkForUpdateAsync)
			.mockReturnValue(new Promise(() => {}));
		await render(<OtaBootSplash onReady={jest.fn()} />);

		expect(screen.getByText("Oikos")).toBeOnTheScreen();
		expect(
			screen.getByText("Verificando se há atualizações"),
		).toBeOnTheScreen();
		expect(screen.queryByText("Baixando melhorias")).not.toBeOnTheScreen();
	});

	test("walks through downloading, installing and ready, then reloads instead of calling onReady when the fetched update is new", async () => {
		jest.mocked(Updates.checkForUpdateAsync).mockResolvedValue({
			isAvailable: true,
		} as Awaited<ReturnType<typeof Updates.checkForUpdateAsync>>);
		jest
			.mocked(Updates.fetchUpdateAsync)
			.mockImplementation(
				() =>
					new Promise(resolve =>
						setTimeout(() => resolve({ isNew: true }), 200),
					) as ReturnType<typeof Updates.fetchUpdateAsync>,
			);
		jest.mocked(Updates.reloadAsync).mockReturnValue(new Promise(() => {}));
		const onReady = jest.fn();
		await render(<OtaBootSplash onReady={onReady} />);

		await jest.advanceTimersByTimeAsync(0);
		expect(screen.getByText("Baixando melhorias")).toBeOnTheScreen();

		await jest.advanceTimersByTimeAsync(200);
		await jest.advanceTimersByTimeAsync(0);
		expect(screen.getByText("Instalando melhorias")).toBeOnTheScreen();

		await jest.advanceTimersByTimeAsync(450);
		await jest.advanceTimersByTimeAsync(0);
		expect(screen.getByText("Tudo pronto")).toBeOnTheScreen();

		await jest.advanceTimersByTimeAsync(350);
		await jest.advanceTimersByTimeAsync(0);
		expect(Updates.reloadAsync).toHaveBeenCalledTimes(1);
		expect(onReady).not.toHaveBeenCalled();
	});

	test("calls onReady without reloading when the fetched update isn't new", async () => {
		jest.mocked(Updates.checkForUpdateAsync).mockResolvedValue({
			isAvailable: true,
		} as Awaited<ReturnType<typeof Updates.checkForUpdateAsync>>);
		jest.mocked(Updates.fetchUpdateAsync).mockResolvedValue({
			isNew: false,
		} as Awaited<ReturnType<typeof Updates.fetchUpdateAsync>>);
		const onReady = jest.fn();
		await render(<OtaBootSplash onReady={onReady} />);

		await jest.advanceTimersByTimeAsync(0);
		await jest.advanceTimersByTimeAsync(450);
		await jest.advanceTimersByTimeAsync(350);
		await jest.advanceTimersByTimeAsync(0);
		expect(Updates.reloadAsync).not.toHaveBeenCalled();
		expect(onReady).toHaveBeenCalledTimes(1);
	});

	test("calls onReady without ever showing downloading when no update is available", async () => {
		jest.mocked(Updates.checkForUpdateAsync).mockResolvedValue({
			isAvailable: false,
		} as Awaited<ReturnType<typeof Updates.checkForUpdateAsync>>);
		const onReady = jest.fn();
		await render(<OtaBootSplash onReady={onReady} />);

		await jest.advanceTimersByTimeAsync(0);
		expect(onReady).toHaveBeenCalledTimes(1);
		expect(screen.queryByText("Baixando melhorias")).not.toBeOnTheScreen();
	});

	test("falls back to ready and calls onReady if checkForUpdateAsync never resolves", async () => {
		jest
			.mocked(Updates.checkForUpdateAsync)
			.mockReturnValue(new Promise(() => {}));
		const onReady = jest.fn();
		await render(<OtaBootSplash onReady={onReady} />);

		expect(onReady).not.toHaveBeenCalled();
		await jest.advanceTimersByTimeAsync(1200);
		await jest.advanceTimersByTimeAsync(0);
		expect(screen.getByText("Tudo pronto")).toBeOnTheScreen();
		expect(onReady).not.toHaveBeenCalled();

		await jest.advanceTimersByTimeAsync(350);
		expect(onReady).toHaveBeenCalledTimes(1);
	});

	test("falls back to ready and calls onReady if fetchUpdateAsync never resolves", async () => {
		jest.mocked(Updates.checkForUpdateAsync).mockResolvedValue({
			isAvailable: true,
		} as Awaited<ReturnType<typeof Updates.checkForUpdateAsync>>);
		jest
			.mocked(Updates.fetchUpdateAsync)
			.mockReturnValue(new Promise(() => {}));
		const onReady = jest.fn();
		await render(<OtaBootSplash onReady={onReady} />);

		await jest.advanceTimersByTimeAsync(0);
		expect(screen.getByText("Baixando melhorias")).toBeOnTheScreen();

		await jest.advanceTimersByTimeAsync(8000);
		await jest.advanceTimersByTimeAsync(0);
		expect(screen.getByText("Tudo pronto")).toBeOnTheScreen();
		expect(onReady).not.toHaveBeenCalled();

		await jest.advanceTimersByTimeAsync(350);
		expect(onReady).toHaveBeenCalledTimes(1);
	});

	test("shows the ready state before calling onReady when checkForUpdateAsync rejects", async () => {
		jest
			.mocked(Updates.checkForUpdateAsync)
			.mockRejectedValue(new Error("network down"));
		const onReady = jest.fn();
		await render(<OtaBootSplash onReady={onReady} />);

		await jest.advanceTimersByTimeAsync(0);
		await jest.advanceTimersByTimeAsync(0);
		expect(screen.getByText("Tudo pronto")).toBeOnTheScreen();
		expect(onReady).not.toHaveBeenCalled();

		await jest.advanceTimersByTimeAsync(350);
		expect(onReady).toHaveBeenCalledTimes(1);
	});

	test("dev diagnostics shows env/update info alongside the mocked sequence", async () => {
		await render(<DevBootDiagnostics onReady={jest.fn()} />);

		expect(screen.getByText("Reem Kufi")).toBeOnTheScreen();
		expect(screen.getByText("Embedded launch")).toBeOnTheScreen();
		expect(screen.getByText("true")).toBeOnTheScreen();
		expect(screen.getByText("production")).toBeOnTheScreen();
		expect(screen.getByText("abc123")).toBeOnTheScreen();
	});

	test("dev diagnostics walks through the mocked phases before calling onReady", async () => {
		const onReady = jest.fn();
		await render(<DevBootDiagnostics onReady={onReady} />);

		expect(screen.getByText("Oikos")).toBeOnTheScreen();
		expect(
			screen.getByText("Verificando se há atualizações"),
		).toBeOnTheScreen();
		expect(screen.queryByText("Baixando melhorias")).not.toBeOnTheScreen();

		await jest.advanceTimersByTimeAsync(300);
		await jest.advanceTimersByTimeAsync(0);
		expect(screen.getByText("Baixando melhorias")).toBeOnTheScreen();

		await jest.advanceTimersByTimeAsync(450);
		await jest.advanceTimersByTimeAsync(0);
		expect(screen.getByText("Baixando melhorias")).toBeOnTheScreen();

		await jest.advanceTimersByTimeAsync(400);
		await jest.advanceTimersByTimeAsync(0);
		expect(screen.getByText("Instalando melhorias")).toBeOnTheScreen();

		await jest.advanceTimersByTimeAsync(450);
		await jest.advanceTimersByTimeAsync(0);
		expect(screen.getByText("Tudo pronto")).toBeOnTheScreen();
		expect(onReady).not.toHaveBeenCalled();

		await jest.advanceTimersByTimeAsync(700);
		expect(onReady).toHaveBeenCalledTimes(1);
	});

	test("recovers and calls onReady if the boot screen throws while rendering", async () => {
		jest.mocked(Font.isLoaded).mockImplementation(() => {
			throw new Error("boom");
		});
		jest.spyOn(console, "error").mockImplementation(() => {});
		jest.spyOn(console, "warn").mockImplementation(() => {});
		const onReady = jest.fn();

		await render(<BootSplashScreen onReady={onReady} />);

		expect(onReady).not.toHaveBeenCalled();
		await jest.advanceTimersByTimeAsync(800);
		expect(onReady).toHaveBeenCalledTimes(1);

		jest.mocked(Font.isLoaded).mockReturnValue(false);
		jest.mocked(console.error).mockRestore();
		jest.mocked(console.warn).mockRestore();
	});
});
