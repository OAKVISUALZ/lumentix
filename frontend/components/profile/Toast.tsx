"use client";

import { useEffect } from "react";

interface ToastProps {
  message: string;
  variant?: "success" | "error";
  onDismiss: () => void;
  durationMs?: number;
}

export default function Toast({
  message,
  variant = "success",
  onDismiss,
  durationMs = 4000,
}: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, durationMs);
    return () => clearTimeout(timer);
  }, [message, durationMs, onDismiss]);

  const styles =
    variant === "success"
      ? "bg-emerald-600/90 border-emerald-400/40 text-white"
      : "bg-red-600/90 border-red-400/40 text-white";

  return (
    <div
      role="status"
      className={`fixed bottom-6 right-6 z-[100] max-w-sm px-5 py-3 rounded-xl border shadow-2xl text-sm font-medium backdrop-blur-sm ${styles}`}
    >
      {message}
    </div>
  );
}
