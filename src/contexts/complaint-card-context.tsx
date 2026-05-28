import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	createContext,
	type PropsWithChildren,
	useContext,
	useMemo,
} from "react";
import { Alert, Linking, Platform } from "react-native";
import { toast } from "@/components/toast";
import {
	patchV1ComplaintsByIdCanceled,
	patchV1ComplaintsByIdResolved,
} from "@/libs/oikos-sdk";
import type { ApiComplaint } from "./complaints-context";
import {
	COMPLAINTS_QUERY_KEY,
	DASHBOARD_QUERY_KEY,
} from "./complaints-context";

type ComplaintCardContextValue = {
	complaint: ApiComplaint;
	isResolvingComplaint: boolean;
	isCancelingComplaint: boolean;
	resolveComplaint: () => void;
	cancelComplaint: () => void;
	openInMaps: () => void;
};

const ComplaintCardContext = createContext<ComplaintCardContextValue | null>(
	null,
);

interface ComplaintCardProviderProps extends PropsWithChildren {
	complaint: ApiComplaint;
}

export function ComplaintCardProvider({
	complaint,
	children,
}: ComplaintCardProviderProps) {
	const queryClient = useQueryClient();

	const resolveMutation = useMutation({
		mutationFn: () =>
			patchV1ComplaintsByIdResolved({ path: { id: complaint.id } }),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: COMPLAINTS_QUERY_KEY });
			void queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });
			toast.success("Denúncia resolvida", "Marcada como resolvida.");
		},
		onError: () => {
			toast.error("Erro", "Não foi possível marcar como resolvida.");
		},
	});

	const cancelMutation = useMutation({
		mutationFn: () =>
			patchV1ComplaintsByIdCanceled({ path: { id: complaint.id } }),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: COMPLAINTS_QUERY_KEY });
			void queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });
			toast.success("Denúncia cancelada", "A denúncia foi cancelada.");
		},
		onError: () => {
			toast.error("Erro", "Não foi possível cancelar a denúncia.");
		},
	});

	const value = useMemo<ComplaintCardContextValue>(() => {
		const { latitude, longitude } = complaint.geospatial.location.coords;

		const mapsUrl =
			Platform.OS === "ios"
				? `maps://?ll=${latitude},${longitude}`
				: `geo:${latitude},${longitude}?q=${latitude},${longitude}`;

		const fallbackUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

		const openInMaps = async () => {
			try {
				const canOpen = await Linking.canOpenURL(mapsUrl);
				await Linking.openURL(canOpen ? mapsUrl : fallbackUrl);
			} catch {
				Alert.alert("Maps", "Não foi possível abrir o aplicativo de mapas.");
			}
		};

		return {
			complaint,
			isResolvingComplaint: resolveMutation.isPending,
			isCancelingComplaint: cancelMutation.isPending,
			resolveComplaint: () => resolveMutation.mutate(),
			cancelComplaint: () => cancelMutation.mutate(),
			openInMaps,
		};
	}, [complaint, resolveMutation, cancelMutation]);

	return (
		<ComplaintCardContext.Provider value={value}>
			{children}
		</ComplaintCardContext.Provider>
	);
}

export function useComplaintCardContext() {
	const context = useContext(ComplaintCardContext);
	if (!context) {
		throw new Error(
			"useComplaintCardContext deve ser usado dentro de ComplaintCardProvider.",
		);
	}
	return context;
}
