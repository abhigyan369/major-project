"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}

interface ToastContextType {
  toast: (options: { type?: ToastType; title: string; description?: string }) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ type = "info", title, description }: { type?: ToastType; title: string; description?: string }) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev.slice(-4), { id, type, title, description }]);

      // Auto dismiss after 4 seconds
      setTimeout(() => {
        removeToast(id);
      }, 4000);
    },
    [removeToast]
  );

  const success = useCallback((title: string, description?: string) => addToast({ type: "success", title, description }), [addToast]);
  const error = useCallback((title: string, description?: string) => addToast({ type: "error", title, description }), [addToast]);
  const warning = useCallback((title: string, description?: string) => addToast({ type: "warning", title, description }), [addToast]);
  const info = useCallback((title: string, description?: string) => addToast({ type: "info", title, description }), [addToast]);

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error, warning, info }}>
      {children}
      {/* Toast Notification Container */}
      <div
        aria-live="assertive"
        className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full px-4 sm:px-0"
      >
        {toasts.map((item) => (
          <div
            key={item.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-lg transition-all duration-300 transform translate-y-0 ${
              item.type === "success"
                ? "bg-slate-900 border-emerald-500/30 text-white"
                : item.type === "error"
                ? "bg-slate-900 border-rose-500/30 text-white"
                : item.type === "warning"
                ? "bg-slate-900 border-amber-500/30 text-white"
                : "bg-slate-900 border-slate-700 text-white"
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {item.type === "success" && <CheckCircle2 className="h-5 w-5 text-emerald-400" />}
              {item.type === "error" && <XCircle className="h-5 w-5 text-rose-400" />}
              {item.type === "warning" && <AlertTriangle className="h-5 w-5 text-amber-400" />}
              {item.type === "info" && <Info className="h-5 w-5 text-blue-400" />}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-semibold leading-snug">{item.title}</h4>
              {item.description && (
                <p className="mt-0.5 text-[11px] text-slate-300 leading-normal line-clamp-2">
                  {item.description}
                </p>
              )}
            </div>

            <button
              onClick={() => removeToast(item.id)}
              className="shrink-0 text-slate-400 hover:text-white transition-colors"
              aria-label="Close notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
