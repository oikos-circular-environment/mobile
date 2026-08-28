import { act, renderHook, waitFor } from "@testing-library/react-native";

jest.mock("@react-native-async-storage/async-storage", () =>
	require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSurveyTourSeen } from "@/components/survey/hooks/use-survey-tour-seen";

const STORAGE_KEY_PREFIX = "@oikos:survey-execution-tour-seen";

describe("useSurveyTourSeen", () => {
	beforeEach(async () => {
		await AsyncStorage.clear();
	});

	it("resolve loaded=true e seen=false quando não há valor salvo para o participante", async () => {
		const { result } = await renderHook(() =>
			useSurveyTourSeen("usuario-1HTQUL"),
		);

		await waitFor(() => expect(result.current.loaded).toBe(true));

		expect(result.current.seen).toBe(false);
	});

	it("resolve seen=true quando o storage já tem o valor marcado para o participante", async () => {
		await AsyncStorage.setItem(`${STORAGE_KEY_PREFIX}:usuario-1HTQUL`, "1");

		const { result } = await renderHook(() =>
			useSurveyTourSeen("usuario-1HTQUL"),
		);

		await waitFor(() => expect(result.current.loaded).toBe(true));

		expect(result.current.seen).toBe(true);
	});

	it("markSeen marca seen=true otimisticamente e persiste no storage sob a chave do participante", async () => {
		const { result } = await renderHook(() =>
			useSurveyTourSeen("usuario-1HTQUL"),
		);

		await waitFor(() => expect(result.current.loaded).toBe(true));

		await act(() => {
			result.current.markSeen();
		});

		expect(result.current.seen).toBe(true);

		await waitFor(async () =>
			expect(
				await AsyncStorage.getItem(`${STORAGE_KEY_PREFIX}:usuario-1HTQUL`),
			).toBe("1"),
		);
	});

	it("trata participantCode ausente como não visto, sem quebrar", async () => {
		const { result } = await renderHook(() => useSurveyTourSeen(null));

		await waitFor(() => expect(result.current.loaded).toBe(true));

		expect(result.current.seen).toBe(false);
	});

	it("participantes diferentes têm o tour visto de forma independente", async () => {
		await AsyncStorage.setItem(`${STORAGE_KEY_PREFIX}:usuario-1HTQUL`, "1");

		const { result } = await renderHook(() =>
			useSurveyTourSeen("usuario-2ABCDE"),
		);

		await waitFor(() => expect(result.current.loaded).toBe(true));

		expect(result.current.seen).toBe(false);
	});
});
