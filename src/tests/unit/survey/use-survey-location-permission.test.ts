import { act, renderHook } from "@testing-library/react-native";
import * as Location from "expo-location";
import { useSurveyLocationPermission } from "@/components/survey/hooks/use-survey-location-permission";

jest.mock("expo-location", () => ({
	getForegroundPermissionsAsync: jest.fn(),
	requestForegroundPermissionsAsync: jest.fn(),
}));

describe("useSurveyLocationPermission", () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	it("resolve true sem pedir de novo quando a permissão já foi concedida", async () => {
		jest
			.mocked(Location.getForegroundPermissionsAsync)
			.mockResolvedValue({ status: "granted" } as never);

		const { result } = await renderHook(() => useSurveyLocationPermission());

		let granted: boolean | undefined;
		await act(async () => {
			granted = await result.current.request();
		});

		expect(granted).toBe(true);
		expect(Location.requestForegroundPermissionsAsync).not.toHaveBeenCalled();
	});

	it("pede a permissão e resolve true quando concedida", async () => {
		jest
			.mocked(Location.getForegroundPermissionsAsync)
			.mockResolvedValue({ status: "undetermined" } as never);
		jest
			.mocked(Location.requestForegroundPermissionsAsync)
			.mockResolvedValue({ status: "granted" } as never);

		const { result } = await renderHook(() => useSurveyLocationPermission());

		let granted: boolean | undefined;
		await act(async () => {
			granted = await result.current.request();
		});

		expect(granted).toBe(true);
	});

	it("resolve false e marca status denied quando a permissão é negada", async () => {
		jest
			.mocked(Location.getForegroundPermissionsAsync)
			.mockResolvedValue({ status: "undetermined" } as never);
		jest
			.mocked(Location.requestForegroundPermissionsAsync)
			.mockResolvedValue({ status: "denied" } as never);

		const { result } = await renderHook(() => useSurveyLocationPermission());

		let granted: boolean | undefined;
		await act(async () => {
			granted = await result.current.request();
		});

		expect(granted).toBe(false);
		expect(result.current.status).toBe("denied");
	});
});
