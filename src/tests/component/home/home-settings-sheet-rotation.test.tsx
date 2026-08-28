import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, userEvent } from "@testing-library/react-native";
import type React from "react";
import { useState } from "react";
import HomeScreen from "@/app/(tabs)/(home)";
import { useSurveyProtocol } from "@/components/survey/hooks/use-survey-protocol";
import { useAuthContext } from "@/contexts/auth-context";
import { useGeospatial } from "@/contexts/geospatial-context";
import { useSurveyStore } from "@/stores/survey-store";

jest.mock("@/components/survey/hooks/use-survey-protocol");

const protocolFixture = {
	key: "oikos-walkthrough",
	version: 1,
	personas: [],
	suites: [],
	tasks: [],
	questions: [],
};

jest.mock("expo-router", () => ({
	useRouter: () => ({ push: jest.fn(), navigate: jest.fn(), back: jest.fn() }),
	Link: ({
		children,
		asChild,
	}: {
		children: React.ReactNode;
		asChild?: boolean;
		href?: unknown;
	}) => {
		const React = require("react");
		const { Pressable } = require("react-native");
		if (asChild) {
			return React.cloneElement(React.Children.only(children));
		}
		return React.createElement(Pressable, null, children);
	},
}));

jest.mock("@/contexts/auth-context");
jest.mock("@/contexts/geospatial-context");

jest.mock("@/components/home/home-hero", () => {
	const { View: V } = require("react-native");
	return {
		HomeHero: () => <V testID="home-hero" />,
	};
});

const mockCloseSpy = jest.fn();

jest.mock("@/components/settings/settings-bottom-sheet", () => {
	const { View: V } = require("react-native");
	const { forwardRef, useImperativeHandle } = require("react");
	return {
		SettingsBottomSheet: forwardRef((_props: unknown, ref: unknown) => {
			useImperativeHandle(ref, () => ({
				close: mockCloseSpy,
				snapToIndex: jest.fn(),
			}));
			return <V testID="settings-bottom-sheet" />;
		}),
	};
});

jest.mock("@/components/auth/profile-completion-modal", () => ({
	ProfileCompletionModal: () => null,
}));

jest.mock("@/components/auth/auth-modal", () => ({
	AuthModal: () => null,
}));

const defaultAuth = {
	user: {} as never,
	isAuthenticated: true,
	isLoading: false,
	needsProfileCompletion: false,
	deletionScheduledAt: null,
	signIn: jest.fn(),
	signUp: jest.fn(),
	signOut: jest.fn(),
	refreshSession: jest.fn(),
	requestDeletion: jest.fn(),
	cancelDeletion: jest.fn(),
	isRequestingDeletion: false,
	account: null,
	changePassword: jest.fn(),
	isChangingPassword: false,
	isCancellingDeletion: false,
	updateUserProfile: jest.fn(),
};

const defaultGeospatial = {
	heading: null,
	location: null,
	addresses: [],
	permissionDenied: false,
	isResolving: false,
	reverseGeocodeError: false,
};

let mockDimensions = { width: 400, height: 800 };

jest.mock("react-native", () => {
	const actual = jest.requireActual("react-native");
	return new Proxy(actual, {
		get(target, prop, receiver) {
			if (prop === "useWindowDimensions") {
				return () => mockDimensions;
			}
			return Reflect.get(target, prop, receiver);
		},
	});
});

function RotationHarness({ queryClient }: { queryClient: QueryClient }) {
	const { Pressable, Text } = require("react-native");
	const [, forceRender] = useState(0);

	return (
		<QueryClientProvider client={queryClient}>
			<Pressable
				testID="rotate-device"
				onPress={() => {
					mockDimensions =
						mockDimensions.width === 400
							? { width: 800, height: 400 }
							: { width: 400, height: 800 };
					forceRender(n => n + 1);
				}}
			>
				<Text>Rotacionar</Text>
			</Pressable>
			<HomeScreen />
		</QueryClientProvider>
	);
}

async function renderHome() {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	});
	return await render(<RotationHarness queryClient={queryClient} />);
}

describe("HomeScreen — mitigação de rotação do settings sheet", () => {
	beforeEach(() => {
		jest.useFakeTimers();
		mockDimensions = { width: 400, height: 800 };
		mockCloseSpy.mockClear();
		jest.mocked(useAuthContext).mockReturnValue(defaultAuth);
		jest.mocked(useGeospatial).mockReturnValue(defaultGeospatial);
		useSurveyStore.getState().reset();
		jest.mocked(useSurveyProtocol).mockReturnValue({
			data: protocolFixture,
		} as never);
	});

	afterEach(() => {
		jest.useRealTimers();
		jest.clearAllMocks();
	});

	it("fecha o sheet só na primeira rotação real pós-mount, não nas seguintes", async () => {
		const user = userEvent.setup();
		await renderHome();

		expect(mockCloseSpy).not.toHaveBeenCalled();

		await user.press(screen.getByTestId("rotate-device"));
		expect(mockCloseSpy).toHaveBeenCalledTimes(1);

		await user.press(screen.getByTestId("rotate-device"));
		expect(mockCloseSpy).toHaveBeenCalledTimes(1);
	});
});
