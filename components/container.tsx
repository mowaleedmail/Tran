//components\container.tsx.
"use client";

import { useRef, useState, useEffect } from "react";
import { ArrowLeftRight, Clipboard, Copy } from "lucide-react";
import LanguageSelection from "./selection";
import { Button } from "./ui/button";
import TranslatedTextarea from "./textarea";
import { useTranslation } from "@/hooks/useTranslation";
import VoiceRecorder from "./voice-recorder";
import TextToSpeechPlayer from "./text-to-speech";

export default function TextareasContainer() {
  const textarea1Ref = useRef<HTMLTextAreaElement>(null);
  const textarea2Ref = useRef<HTMLTextAreaElement>(null);

  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [sourceLanguage, setSourceLanguage] = useState("en");
  const [targetLanguage, setTargetLanguage] = useState("ar");
  const voiceId = "FTNCalFNG5bRnkkaP5Ug";

  const { translateText, isTranslating } = useTranslation();
  const [translationTimer, setTranslationTimer] =
    useState<NodeJS.Timeout | null>(null);

  const syncHeights = (height: number) => {
    if (textarea1Ref.current) textarea1Ref.current.style.height = `${height}px`;
    if (textarea2Ref.current) textarea2Ref.current.style.height = `${height}px`;
  };

  const detectLanguage = async (text: string) => {
    try {
      const response = await fetch("/api/detect-language", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();
      if (response.ok) {
        setSourceLanguage(data.languageCode);
      } else {
        console.error(data.error);
      }
    } catch (error) {
      console.error("Language detection failed:", error);
    }
  };

  const handleSourceTextChange = async (text: string) => {
    setSourceText(text);

    if (translationTimer) {
      clearTimeout(translationTimer);
    }

    const timer = setTimeout(async () => {
      if (text.trim()) {
        await detectLanguage(text);

        const result = await translateText({
          text,
          sourceLanguage,
          targetLanguage,
        });
        setTranslatedText(result);
      } else {
        setTranslatedText("");
      }
    }, 850);

    setTranslationTimer(timer);
  };

  const switchLanguages = () => {
    const tempLang = sourceLanguage;
    setSourceLanguage(targetLanguage);
    setTargetLanguage(tempLang);
    setSourceText(translatedText);
    setTranslatedText(sourceText);
  };

  const copyToClipboard = () => {
    if (translatedText.trim()) {
      navigator.clipboard.writeText(translatedText).then();
    }
  };

  useEffect(() => {
    return () => {
      if (translationTimer) {
        clearTimeout(translationTimer);
      }
    };
  }, [translationTimer]);

  return (
    <div className="flex flex-col min-h-[400px] container rounded-lg border bg-card border-gray-200">
      <div className="flex flex-row gap-1 items-center justify-stretch border-b border-zinc-200 px-3 py-3">
        <LanguageSelection
          value={sourceLanguage}
          onChange={(newLanguage) => {
            setSourceLanguage(newLanguage);
            if (sourceText.trim()) {
              translateText({
                text: sourceText,
                sourceLanguage: newLanguage,
                targetLanguage,
              }).then((result) => {
                setTranslatedText(result);
              });
            }
          }}
        />
        <Button variant="custom" size="icon" onClick={switchLanguages}>
          <ArrowLeftRight
            size={22}
            strokeWidth={1.5}
            className="text-gray-950"
          />
        </Button>
        <LanguageSelection
          value={targetLanguage}
          onChange={(newLanguage) => {
            setTargetLanguage(newLanguage);
            // استدعاء الترجمة عند تغيير اللغة
            if (sourceText.trim()) {
              translateText({
                text: sourceText,
                sourceLanguage,
                targetLanguage: newLanguage,
              }).then((result) => {
                setTranslatedText(result);
              });
            }
          }}
        />
      </div>
      <div className="flex flex-row justify-stretch items-start bg-transparent">
        <TranslatedTextarea
          ref={textarea1Ref}
          value={sourceText}
          onChange={(e) => handleSourceTextChange(e.target.value)}
          placeholder="Enter text to translate"
          className="focus-within:rounded-bl-lg"
          wrapperClassName="pr-9 border-r border-zinc-200"
          buttonStyle="border-r border-zinc-200 rounded-bl-lg"
          onSyncHeight={syncHeights}
        >
          <Button variant="custom" size="icon" className="bg-transparent">
            <Clipboard size={21} strokeWidth={1.5} className="text-gray-950" />
          </Button>
          <VoiceRecorder
            onTranscript={(text) => {
              handleSourceTextChange(text); // استدعاء الوظيفة مع النص الأصلي
            }}
          />
        </TranslatedTextarea>

        <TranslatedTextarea
          ref={textarea2Ref}
          value={translatedText}
          onChange={() => {}}
          readOnly
          className="focus-within:rounded-br-lg"
          wrapperClassName="pr-9"
          buttonStyle="rounded-br-lg"
          onSyncHeight={syncHeights}
        >
          <Button
            variant="custom"
            size="icon"
            onClick={copyToClipboard}
            className="bg-transparent"
          >
            <Copy
              size={21}
              strokeWidth={1.5}
              className="text-gray-950 bg-transparent"
            />
          </Button>
          <TextToSpeechPlayer text={translatedText} voiceId={voiceId} />
          {isTranslating && (
            <span className="text-sm text-gray-500 mr-2">جاري الترجمة...</span>
          )}
        </TranslatedTextarea>
      </div>
    </div>
  );
}
