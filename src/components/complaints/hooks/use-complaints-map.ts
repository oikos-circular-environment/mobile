import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "@/components/toast";
import { useAuthContext } from "@/contexts/auth-context";
import {
	deleteV1ComplaintsByIdVotes,
	type GetV1ComplaintsMapResponses,
	getV1ComplaintsMap,
	postV1ComplaintsByIdVotes,
} from "@/libs/oikos-sdk";
import type { ComplaintStatus, ComplaintType } from "@/libs/types/complaint";
import { useComplaintsStore } from "@/stores/complaints-store";

export type MapComplaint =
	GetV1ComplaintsMapResponses[200]["complaints"][number];

type VoteType = "RESOLVED" | "NOT_RESOLVED";

type Params = {
	userLocation: { lat: number; lon: number } | null;
	activeTypeFilter: ComplaintType | null;
	activeStatusFilter: ComplaintStatus | null;
};

export function useComplaintsMap({
	userLocation,
	activeTypeFilter,
	activeStatusFilter,
}: Params) {
	const { isAuthenticated } = useAuthContext();
	const userVotes = useComplaintsStore(s => s.userVotes);
	const setVote = useComplaintsStore(s => s.setVote);
	const removeVote = useComplaintsStore(s => s.removeVote);

	const [selectedComplaint, setSelectedComplaint] =
		useState<MapComplaint | null>(null);

	const { data: mapData, isLoading: isLoadingMap } = useQuery({
		queryKey: [
			"complaints",
			"map",
			userLocation?.lat ?? 0,
			userLocation?.lon ?? 0,
			activeTypeFilter,
			activeStatusFilter,
		],
		queryFn: async () => {
			const res = await getV1ComplaintsMap({
				query: {
					lat: userLocation?.lat ?? 0,
					lon: userLocation?.lon ?? 0,
					radius: 10000,
					...(activeTypeFilter ? { type: activeTypeFilter } : {}),
					...(activeStatusFilter ? { status: activeStatusFilter } : {}),
				},
			});
			return res.data;
		},
		enabled: !!userLocation,
	});

	const complaints = mapData?.complaints ?? [];

	const voteMutation = useMutation({
		mutationFn: async ({
			complaintId,
			voteType,
		}: {
			complaintId: string;
			voteType: VoteType | null;
			previousVote: VoteType | null;
		}) => {
			if (voteType === null) {
				await deleteV1ComplaintsByIdVotes({ path: { id: complaintId } });
			} else {
				await postV1ComplaintsByIdVotes({
					path: { id: complaintId },
					body: { vote_type: voteType },
				});
			}
		},
		onSuccess: (_, { complaintId, voteType, previousVote }) => {
			if (voteType === null) {
				removeVote(complaintId);
			} else {
				setVote(complaintId, voteType);
			}

			setSelectedComplaint(prev => {
				if (!prev || prev.id !== complaintId) return prev;
				const counts = { ...prev.vote_counts };
				if (previousVote === "RESOLVED") counts.resolved = Math.max(0, counts.resolved - 1);
				if (previousVote === "NOT_RESOLVED") counts.not_resolved = Math.max(0, counts.not_resolved - 1);
				if (voteType === "RESOLVED") counts.resolved += 1;
				if (voteType === "NOT_RESOLVED") counts.not_resolved += 1;
				return { ...prev, vote_counts: counts };
			});
		},
		onError: () => toast.error("Erro", "Não foi possível registrar seu voto."),
	});

	const handleVote = (voteType: VoteType) => {
		if (!isAuthenticated) {
			toast.info("Login necessário", "Entre para votar em denúncias.");
			return;
		}
		if (!selectedComplaint) return;

		const previous = userVotes[selectedComplaint.id] ?? null;
		const next = previous === voteType ? null : voteType;

		voteMutation.mutate({
			complaintId: selectedComplaint.id,
			voteType: next,
			previousVote: previous,
		});
	};

	const currentVote = selectedComplaint
		? userVotes[selectedComplaint.id]
		: undefined;

	return {
		complaints,
		isLoadingMap,
		selectedComplaint,
		setSelectedComplaint,
		currentVote,
		handleVote,
		isPendingVote: voteMutation.isPending,
	};
}
