//hooks\useTranslation.tsx
import { UseTranslationProps } from "@/types/types";
import { useState, useCallback } from "react";

export function useTranslation() {
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const translateText = useCallback(
    async ({ text, sourceLanguage, targetLanguage }: UseTranslationProps) => {
      if (!text.trim()) return "";

      setIsTranslating(true);
      setError(null);

      try {
        const response = await fetch("/api/translate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text,
            sourceLanguage,
            targetLanguage,
          }),
        });

        if (!response.ok) {
          throw new Error("Translation failed");
        }

        const data = await response.json();
        return data.translatedText;
      } catch (err) {
        setError("Error: Unable to translate text.");
        console.error("Translation error:", err);
        return "";
      } finally {
        setIsTranslating(false);
      }
    },
    []
  );

  return {
    translateText,
    isTranslating,
    error,
  };
}
