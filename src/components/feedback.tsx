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
      className={`mb-[15px] border-l-4 bg-card px-[15px] py-2 text-sm ${
        isError ? "border-danger text-danger" : "border-blue bg-blue-soft text-navy"
      }`}
    >
      {feedback.message}
    </p>
  );
}
