import {
	createContext,
	type PropsWithChildren,
	useCallback,
	useContext,
	useState,
} from "react";
import type { ApiComplaint } from "@/stores/complaints-store";
import type { DraftAttachment } from "@/libs/types/complaint";

type ComplaintCreationContextValue = {
	attachments: DraftAttachment[];
	editingComplaint: ApiComplaint | null;
	addAttachment: (attachment: DraftAttachment) => void;
	removeAttachment: (id: string) => void;
	clearDraft: () => void;
	enterEditMode: (complaint: ApiComplaint) => void;
	exitEditMode: () => void;
};

const ComplaintCreationContext =
	createContext<ComplaintCreationContextValue | null>(null);

export function ComplaintCreationProvider({ children }: PropsWithChildren) {
	const [attachments, setAttachments] = useState<DraftAttachment[]>([]);
	const [editingComplaint, setEditingComplaint] = useState<ApiComplaint | null>(null);

	const addAttachment = useCallback((attachment: DraftAttachment) => {
		setAttachments(prev => [...prev, attachment]);
	}, []);

	const removeAttachment = useCallback((id: string) => {
		setAttachments(prev => prev.filter(a => a.id !== id));
	}, []);

	const clearDraft = useCallback(() => {
		setAttachments([]);
	}, []);

	const enterEditMode = useCallback((complaint: ApiComplaint) => {
		setEditingComplaint(complaint);
		setAttachments(
			complaint.attachments.map(a => ({
				id: a.id,
				mediaType: a.type === "VIDEO" ? "video" : "photo",
				source: "api" as const,
				url: a.url,
			})),
		);
	}, []);

	const exitEditMode = useCallback(() => {
		setEditingComplaint(null);
		setAttachments([]);
	}, []);

	return (
		<ComplaintCreationContext.Provider
			value={{
				attachments,
				editingComplaint,
				addAttachment,
				removeAttachment,
				clearDraft,
				enterEditMode,
				exitEditMode,
			}}
		>
			{children}
		</ComplaintCreationContext.Provider>
	);
}

export function useComplaintCreation() {
	const ctx = useContext(ComplaintCreationContext);
	if (!ctx) {
		throw new Error(
			"useComplaintCreation must be used within ComplaintCreationProvider",
		);
	}
	return ctx;
}
