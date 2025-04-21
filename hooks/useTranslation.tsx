//hooks\useTranslation.tsx
import { UseTranslationProps } from "@/types/types";
import { useState, useCallback, useRef } from "react";

export function useTranslation() {
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Ref to track current translation request for cancellation
  const abortControllerRef = useRef<AbortController | null>(null);

  const translateText = useCallback(
    async ({ text, sourceLanguage, targetLanguage }: UseTranslationProps) => {
      if (!text.trim()) return "";

      // Cancel any ongoing translation
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;
      setIsTranslating(true);
      setError(null);

      try {
        const response = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, sourceLanguage, targetLanguage }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Translation failed");
        }

        const data = await response.json();
        return data.translatedText;
      } catch (err: unknown) {
        // Handle abort specifically
        if (err instanceof DOMException && err.name === 'AbortError') {
          // Translation was canceled
          return "";
        }
        setError("Error: Unable to translate text.");
        // Log the error appropriately
        if (err instanceof Error) {
          console.error("Translation error:", err);
        } else {
          console.error("Translation error:", String(err));
        }
        return "";
      } finally {
        setIsTranslating(false);
        // Clear controller after done
        abortControllerRef.current = null;
      }
    },
    []
  );

  // Function to manually cancel any in-flight translation
  const cancelTranslation = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  return {
    translateText,
    isTranslating,
    error,
    cancelTranslation,
  };
}
