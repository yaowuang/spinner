/**
 * Toast - Lightweight notification component for feedback messages
 * Used for success/error messages when user actions occur
 */

import { Component, createEffect, createSignal } from 'solid-js';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}

interface ToastProps {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

export const Toast: Component<ToastProps> = (props) => {
  return (
    <div class="fixed top-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
      {props.toasts.map((toast) => {
        const bgColor = {
          success: 'bg-green-500',
          error: 'bg-red-500',
          info: 'bg-blue-500'
        }[toast.type];

        const icon = {
          success: '✓',
          error: '✕',
          info: 'ℹ'
        }[toast.type];

        createEffect(() => {
          if (toast.duration !== Infinity) {
            const timer = setTimeout(
              () => props.removeToast(toast.id),
              toast.duration || 3000
            );
            return () => clearTimeout(timer);
          }
        });

        return (
          <div
            class={`${bgColor} text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slideIn pointer-events-auto`}
            role="status"
            aria-live="polite"
          >
            <span class="font-bold text-lg">{icon}</span>
            <span class="font-medium">{toast.message}</span>
            <button
              onClick={() => props.removeToast(toast.id)}
              class="ml-2 hover:opacity-80 transition-opacity"
              aria-label="Dismiss notification"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
};
