import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "@/components/toast";
import { useAuthContext } from "@/contexts/auth-context";
import {
	deleteV1ComplaintsByIdVotes,
	getV1ComplaintsMap,
	postV1ComplaintsByIdVotes,
} from "@/libs/oikos-sdk";
import type { ComplaintStatus } from "@/libs/types/complaint";
import { useComplaintsStore } from "@/stores/complaints-store";

export type { MapComplaint } from "@/libs/types/complaint";

type VoteType = "RESOLVED" | "NOT_RESOLVED";

type HazardLevel = "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";

type Params = {
	userLocation: { lat: number; lon: number } | null;
	status: "OPEN" | "RESOLVED" | null;
	wasteCategoryId: string | null;
	hazardLevel: HazardLevel | null;
	radius: number;
};

export function useComplaintsMap({
	userLocation,
	status,
	wasteCategoryId,
	hazardLevel,
	radius,
}: Params) {
	const { isAuthenticated } = useAuthContext();
	const userVotes = useComplaintsStore(s => s.userVotes);
	const setVote = useComplaintsStore(s => s.setVote);
	const removeVote = useComplaintsStore(s => s.removeVote);
	const selectedMapComplaint = useComplaintsStore(s => s.selectedMapComplaint);
	const setSelectedMapComplaint = useComplaintsStore(
		s => s.setSelectedMapComplaint,
	);
	const patchSelectedMapComplaintVoteCounts = useComplaintsStore(
		s => s.patchSelectedMapComplaintVoteCounts,
	);

	const { data: mapData, isLoading: isLoadingMap } = useQuery({
		queryKey: [
			"complaints",
			"map",
			userLocation?.lat ?? 0,
			userLocation?.lon ?? 0,
			status,
			wasteCategoryId,
			hazardLevel,
			radius,
		],
		queryFn: async () => {
			const res = await getV1ComplaintsMap({
				query: {
					lat: userLocation?.lat ?? 0,
					lon: userLocation?.lon ?? 0,
					radius,
					...(status ? { status } : {}),
					...(wasteCategoryId ? { waste_category_id: wasteCategoryId } : {}),
					...(hazardLevel ? { hazard_level: hazardLevel } : {}),
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
			patchSelectedMapComplaintVoteCounts({
				previousVote,
				nextVote: voteType,
			});
		},
		onError: () => toast.error("Erro", "Não foi possível registrar seu voto."),
	});

	const handleVote = (voteType: VoteType) => {
		if (!isAuthenticated) {
			toast.info("Login necessário", "Entre para votar em denúncias.");
			return;
		}
		if (!selectedMapComplaint) return;

		const previous = userVotes[selectedMapComplaint.id] ?? null;
		const next = previous === voteType ? null : voteType;

		voteMutation.mutate({
			complaintId: selectedMapComplaint.id,
			voteType: next,
			previousVote: previous,
		});
	};

	return {
		complaints,
		isLoadingMap,
		selectedMapComplaint,
		setSelectedMapComplaint,
		handleVote,
		isPendingVote: voteMutation.isPending,
	};
}

export type { ComplaintStatus };
