import {
	selectSelectedCapture,
	useComplaintsStore,
} from "@/stores/complaints-store";

export function useComplaintCreate() {
	const draftCaptures = useComplaintsStore(s => s.draftCaptures);
	const selectedCaptureId = useComplaintsStore(s => s.selectedCaptureId);
	const selectedCapture = useComplaintsStore(selectSelectedCapture);
	const addCapture = useComplaintsStore(s => s.addCapture);
	const updateCapture = useComplaintsStore(s => s.updateCapture);
	const deleteCapture = useComplaintsStore(s => s.deleteCapture);
	const clearDraft = useComplaintsStore(s => s.clearDraft);
	const setSelectedCaptureId = useComplaintsStore(s => s.setSelectedCaptureId);

	return {
		captures: draftCaptures,
		selectedCapture,
		selectedCaptureId,
		setSelectedCaptureId,
		addCapture,
		updateCapture,
		deleteCapture,
		clearDraft,
	};
}
