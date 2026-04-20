"use client";

import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ComplaintCapture } from "@/libs/types/complaint";

type ComplaintCreateContextValue = {
  captures: ComplaintCapture[];
  selectedCapture: ComplaintCapture | null;
  selectedCaptureId: string;
  setSelectedCaptureId: (captureId: string) => void;
  addCapture: (capture: ComplaintCapture) => void;
  updateCapture: (
    captureId: string,
    payload: Partial<Pick<ComplaintCapture, "observation" | "type">>,
  ) => void;
  deleteCapture: (captureId: string) => void;
  clearDraft: () => void;
};

const ComplaintCreateContext =
  createContext<ComplaintCreateContextValue | null>(null);

export function ComplaintCreateProvider({ children }: PropsWithChildren) {
  const [captures, setCaptures] = useState<ComplaintCapture[]>([]);
  const [selectedCaptureId, setSelectedCaptureId] = useState("");

  useEffect(() => {
    if (captures.length === 0) {
      if (selectedCaptureId) {
        setSelectedCaptureId("");
      }
      return;
    }

    const selectedExists = captures.some(
      capture => capture.id === selectedCaptureId,
    );

    if (!selectedExists) {
      setSelectedCaptureId(captures[0]?.id ?? "");
    }
  }, [captures, selectedCaptureId]);

  const selectedCapture = useMemo(() => {
    if (captures.length === 0) {
      return null;
    }

    return (
      captures.find(capture => capture.id === selectedCaptureId) ??
      captures[0] ??
      null
    );
  }, [captures, selectedCaptureId]);

  const addCapture = useCallback((capture: ComplaintCapture) => {
    setCaptures(current => [capture, ...current]);
    setSelectedCaptureId(capture.id);
  }, []);

  const updateCapture = useCallback(
    (
      captureId: string,
      payload: Partial<Pick<ComplaintCapture, "observation" | "type">>,
    ) => {
      const updatedAt = new Date().toISOString();

      setCaptures(current =>
        current.map(capture =>
          capture.id === captureId
            ? {
                ...capture,
                ...payload,
                updated_at: updatedAt,
              }
            : capture,
        ),
      );
    },
    [],
  );

  const deleteCapture = useCallback((captureId: string) => {
    setCaptures(current => {
      const updatedCaptures = current.filter(
        capture => capture.id !== captureId,
      );

      setSelectedCaptureId(currentSelectedId =>
        currentSelectedId === captureId
          ? (updatedCaptures[0]?.id ?? "")
          : currentSelectedId,
      );

      return updatedCaptures;
    });
  }, []);

  const clearDraft = useCallback(() => {
    setCaptures([]);
    setSelectedCaptureId("");
  }, []);

  const value = useMemo<ComplaintCreateContextValue>(
    () => ({
      captures,
      selectedCapture,
      selectedCaptureId,
      setSelectedCaptureId,
      addCapture,
      updateCapture,
      deleteCapture,
      clearDraft,
    }),
    [
      captures,
      selectedCapture,
      selectedCaptureId,
      addCapture,
      updateCapture,
      deleteCapture,
      clearDraft,
    ],
  );

  return (
    <ComplaintCreateContext.Provider value={value}>
      {children}
    </ComplaintCreateContext.Provider>
  );
}

export function useComplaintCreateContext() {
  const context = useContext(ComplaintCreateContext);

  if (!context) {
    throw new Error(
      "useComplaintCreateContext deve ser usado dentro de ComplaintCreateProvider.",
    );
  }

  return context;
}
