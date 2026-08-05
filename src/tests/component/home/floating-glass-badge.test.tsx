import { act, render, screen } from "@testing-library/react-native";
import { RecycleIcon, RepeatIcon, TrendingDownIcon } from "lucide-react-native";
import {
	FloatingGlassBadge,
	type FloatingGlassBadgeItem,
} from "@/components/home/floating-glass-badge";

const ITEMS: FloatingGlassBadgeItem[] = [
	{ icon: RepeatIcon, label: "Reuse" },
	{ icon: TrendingDownIcon, label: "Reduze" },
	{ icon: RecycleIcon, label: "Recicle" },
];

describe("FloatingGlassBadge — componente", () => {
	beforeEach(() => {
		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it("mostra o primeiro item do array ao montar", async () => {
		await render(<FloatingGlassBadge items={ITEMS} intervalMs={500} />);

		expect(screen.getByText("Reuse")).toBeOnTheScreen();
	});

	it("troca para o próximo item do array a cada intervalo", async () => {
		await render(<FloatingGlassBadge items={ITEMS} intervalMs={500} />);

		await act(() => {
			jest.advanceTimersByTime(500);
		});
		expect(screen.getByText("Reduze")).toBeOnTheScreen();

		await act(() => {
			jest.advanceTimersByTime(500);
		});
		expect(screen.getByText("Recicle")).toBeOnTheScreen();
	});

	it("volta para o primeiro item após o último", async () => {
		await render(<FloatingGlassBadge items={ITEMS} intervalMs={500} />);

		await act(() => {
			jest.advanceTimersByTime(500 * ITEMS.length);
		});

		expect(screen.getByText("Reuse")).toBeOnTheScreen();
	});

	it("não tenta trocar quando há apenas um item", async () => {
		await render(<FloatingGlassBadge items={[ITEMS[0]]} intervalMs={500} />);

		await act(() => {
			jest.advanceTimersByTime(2000);
		});

		expect(screen.getByText("Reuse")).toBeOnTheScreen();
	});
});
