import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	type PropsWithChildren,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from "react";
import { AuthModal } from "@/components/auth/auth-modal";
import { ProfileCompletionModal } from "@/components/auth/profile-completion-modal";
import { toast } from "@/components/toast";
import { useAuthContext } from "@/contexts/auth-context";
import { logComplaintEvent } from "@/libs/observe-events";
import {
	deleteV1ComplaintsByIdVotes,
	getV1ComplaintsByIdVotes,
	postV1ComplaintsByIdVotes,
} from "@/libs/oikos-sdk";
import { useComplaintsStore } from "@/stores/complaints-store";
import { ComplaintVoteButtonContext } from "./context";

type ComplaintVoteProps = PropsWithChildren<{
	complaintId: string;
	disabled?: boolean;
}>;

export function ComplaintVote({
	complaintId,
	disabled = false,
	children,
}: ComplaintVoteProps) {
	const { isAuthenticated, needsProfileCompletion } = useAuthContext();
	const queryClient = useQueryClient();

	const complaint = useComplaintsStore(s => s.selectedMapComplaint);
	const patchVoteCounts = useComplaintsStore(
		s => s.patchSelectedMapComplaintVoteCounts,
	);

	const [showAuthModal, setShowAuthModal] = useState(false);
	const [showProfileModal, setShowProfileModal] = useState(false);

	const [voteCounts, setVoteCounts] = useState({
		resolved: complaint?.vote_counts.resolved ?? 0,
		not_resolved: complaint?.vote_counts.not_resolved ?? 0,
	});

	useEffect(() => {
		if (!complaint) return;
		setVoteCounts({
			resolved: complaint.vote_counts.resolved,
			not_resolved: complaint.vote_counts.not_resolved,
		});
	}, [complaint]);

	const { data: voteData } = useQuery({
		queryKey: ["complaint", "vote", complaintId],
		queryFn: async () => {
			const res = await getV1ComplaintsByIdVotes({
				path: { id: complaintId },
			});
			return res.data;
		},
		enabled: !!complaintId && isAuthenticated,
	});

	const currentVote = voteData?.vote?.vote_type ?? null;

	const voteMutation = useMutation({
		mutationFn: async ({
			voteType,
		}: {
			voteType: "RESOLVED" | "NOT_RESOLVED" | null;
			previousVote: "RESOLVED" | "NOT_RESOLVED" | null;
		}) => {
			if (!complaintId) return;
			if (voteType === null) {
				await deleteV1ComplaintsByIdVotes({ path: { id: complaintId } });
			} else {
				await postV1ComplaintsByIdVotes({
					path: { id: complaintId },
					body: { vote_type: voteType },
				});
			}
		},
		onSuccess: (_, { voteType, previousVote }) => {
			setVoteCounts(prev => {
				const counts = { ...prev };
				if (previousVote === "RESOLVED")
					counts.resolved = Math.max(0, counts.resolved - 1);
				if (previousVote === "NOT_RESOLVED")
					counts.not_resolved = Math.max(0, counts.not_resolved - 1);
				if (voteType === "RESOLVED") counts.resolved += 1;
				if (voteType === "NOT_RESOLVED") counts.not_resolved += 1;
				return counts;
			});

			patchVoteCounts({ previousVote, nextVote: voteType });

			queryClient.invalidateQueries({
				queryKey: ["complaint", "vote", complaintId],
			});

			logComplaintEvent("complaint.voted", {
				success: true,
				voteType: voteType ?? "removed",
			});
		},
		onError: (_, { voteType }) => {
			logComplaintEvent("complaint.voted", {
				success: false,
				voteType: voteType ?? "removed",
			});
			toast.error("Erro", "Não foi possível registrar seu voto.");
		},
	});

	const handleVote = useCallback(
		(vote: "RESOLVED" | "NOT_RESOLVED") => {
			if (!isAuthenticated) {
				setShowAuthModal(true);
				return;
			}
			if (needsProfileCompletion) {
				setShowProfileModal(true);
				return;
			}
			const previous = currentVote;
			const next = previous === vote ? null : vote;
			voteMutation.mutate({ voteType: next, previousVote: previous });
		},
		[isAuthenticated, needsProfileCompletion, currentVote, voteMutation],
	);

	const contextValue = useMemo(
		() => ({
			resolvedVotes: voteCounts.resolved,
			notResolvedVotes: voteCounts.not_resolved,
			currentVote,
			isPending: voteMutation.isPending,
			disabled,
			onVote: handleVote,
		}),
		[
			voteCounts.resolved,
			voteCounts.not_resolved,
			currentVote,
			voteMutation.isPending,
			disabled,
			handleVote,
		],
	);

	return (
		<ComplaintVoteButtonContext.Provider value={contextValue}>
			{children}

			<AuthModal
				isOpen={showAuthModal}
				onClose={() => setShowAuthModal(false)}
				description="Para interagir com denúncias você precisa ter uma conta. Cadastre-se gratuitamente e ajude a proteger o meio ambiente."
			/>
			<ProfileCompletionModal
				isOpen={showProfileModal}
				onClose={() => setShowProfileModal(false)}
				description="Para interagir com denúncias você precisa finalizar o seu cadastro."
			/>
		</ComplaintVoteButtonContext.Provider>
	);
}
