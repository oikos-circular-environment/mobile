import { render, screen } from "@testing-library/react-native";
import type React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { HomeHero } from "@/components/home/home-hero";
import { useAuthContext } from "@/contexts/auth-context";

jest.mock("expo-image", () => ({
	Image: () => null,
}));

jest.mock("@/contexts/auth-context");

jest.mocked(useAuthContext).mockReturnValue({
	user: {
		profile: { display_name: "Maria", address: null, profile_image: null },
	},
} as never);

async function renderHero(
	props: Partial<React.ComponentProps<typeof HomeHero>> = {},
) {
	return await render(
		<SafeAreaProvider
			initialMetrics={{
				frame: { x: 0, y: 0, width: 375, height: 812 },
				insets: { top: 47, left: 0, right: 0, bottom: 34 },
			}}
		>
			<HomeHero
				isAuthenticated={false}
				isLoading={false}
				onOpenSettings={jest.fn()}
				onPressLogin={jest.fn()}
				{...props}
			/>
		</SafeAreaProvider>,
	);
}

describe("HomeHero — componente", () => {
	it("mostra o botão de iniciar sessão quando não autenticado", async () => {
		await renderHero({ isAuthenticated: false });

		expect(screen.getByText("Iniciar sessão")).toBeOnTheScreen();
	});

	it("não mostra o botão de iniciar sessão quando autenticado", async () => {
		await renderHero({ isAuthenticated: true });

		expect(screen.queryByText("Iniciar sessão")).not.toBeOnTheScreen();
	});

	it("não mostra o botão de iniciar sessão enquanto carrega", async () => {
		await renderHero({ isAuthenticated: false, isLoading: true });

		expect(screen.queryByText("Iniciar sessão")).not.toBeOnTheScreen();
	});

	it("mostra o selo flutuante Reduzir", async () => {
		await renderHero();

		expect(screen.getByText("Reduzir")).toBeOnTheScreen();
	});
});
