"use client";

import { RefreshMessage } from "./types";

interface RefreshToastProps {
  message: RefreshMessage | null;
}

export function RefreshToast({ message }: RefreshToastProps) {
  if (!message) {
    return null;
  }

  return (
    <div
      className={`fixed top-20 right-4 z-50 p-4 rounded-lg shadow-lg animate-in slide-in-from-top-5 ${
        message.type === "success"
          ? "bg-green-50 text-green-900 border border-green-200 dark:bg-green-950 dark:text-green-100"
          : "bg-red-50 text-red-900 border border-red-200 dark:bg-red-950 dark:text-red-100"
      }`}
    >
      <div className="flex items-center gap-2">
        {message.type === "success" ? "?" : "?"}
        <span className="font-medium">{message.text}</span>
      </div>
    </div>
  );
}
