import {
	createContext,
	type PropsWithChildren,
	useCallback,
	useContext,
	useState,
} from "react";
import type { DraftAttachment } from "@/libs/types/complaint";

type ComplaintCreationContextValue = {
	attachments: DraftAttachment[];
	addAttachment: (attachment: DraftAttachment) => void;
	removeAttachment: (id: string) => void;
	clearDraft: () => void;
};

const ComplaintCreationContext =
	createContext<ComplaintCreationContextValue | null>(null);

export function ComplaintCreationProvider({ children }: PropsWithChildren) {
	const [attachments, setAttachments] = useState<DraftAttachment[]>([]);

	const addAttachment = useCallback((attachment: DraftAttachment) => {
		setAttachments(prev => [...prev, attachment]);
	}, []);

	const removeAttachment = useCallback((id: string) => {
		setAttachments(prev => prev.filter(a => a.id !== id));
	}, []);

	const clearDraft = useCallback(() => {
		setAttachments([]);
	}, []);

	return (
		<ComplaintCreationContext.Provider
			value={{ attachments, addAttachment, removeAttachment, clearDraft }}
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
