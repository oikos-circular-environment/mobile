export type ComplaintCaptureMode = "photo" | "video";

export type ComplaintCaptureDraft = {
  id: string;
  uri: string;
  type: ComplaintCaptureMode;
  createdAt: string;
  dayOfWeek: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  latitudeFormatted: string;
  longitudeFormatted: string;
  altitudeFormatted: string;
  headingFormatted: string;
  observation: string;
};

export type ComplaintCreateDraft = {
  captures: ComplaintCaptureDraft[];
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
