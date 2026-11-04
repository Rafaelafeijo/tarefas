"use client";

import { useEffect } from "react";

export type FeedbackState = { kind: "success" | "error"; message: string } | null;

type FeedbackProps = {
  feedback: FeedbackState;
  // Pass the state setter directly: it is stable, so re-renders don't restart the timer.
  onDismiss: (value: null) => void;
};

export function Feedback({ feedback, onDismiss }: FeedbackProps) {
  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => onDismiss(null), 4000);
    return () => clearTimeout(timer);
  }, [feedback, onDismiss]);

  if (!feedback) return null;

  const isError = feedback.kind === "error";

  return (
    <p
      // Screen readers announce errors immediately and success when idle.
      role={isError ? "alert" : "status"}
      // A floating toast, so showing it doesn't push the list down.
      className={`fixed bottom-5 left-1/2 z-50 w-max max-w-[calc(100vw-32px)] -translate-x-1/2 rounded-lg px-4 py-2.5 text-[13px] font-medium text-white shadow-lg ${
        isError ? "bg-danger" : "bg-ink"
      }`}
    >
      {feedback.message}
    </p>
  );
}
