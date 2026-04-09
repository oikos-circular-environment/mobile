import type { ComplaintCapture } from "../types/complaint";

export type ComplaintCreateDraft = {
  captures: ComplaintCapture[];
};

let complaintCreateDraft: ComplaintCreateDraft | null = null;

export const saveComplaintCreateDraft = (draft: ComplaintCreateDraft) => {
  complaintCreateDraft = draft;
};

export const getComplaintCreateDraft = () => complaintCreateDraft;

export const clearComplaintCreateDraft = () => {
  complaintCreateDraft = null;
};

export const updateComplaintCaptureObservation = (
  captureId: string,
  observation: string,
) => {
  if (!complaintCreateDraft) {
    return;
  }

  complaintCreateDraft = {
    ...complaintCreateDraft,
    captures: complaintCreateDraft.captures.map(capture =>
      capture.id === captureId ? { ...capture, observation } : capture,
    ),
  };
};
