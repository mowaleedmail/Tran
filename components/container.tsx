"use client";

import { useRef, useState, useEffect, useLayoutEffect, useCallback, useMemo } from "react";
import { ArrowLeftRight, Clipboard, Copy } from "lucide-react";
import LanguageSelection from "./selection";
import { Button } from "./ui/button";
import TranslatedTextarea from "./textarea";
import { useTranslation } from "@/hooks/useTranslation";
import { useTextareaAdjustment } from "@/hooks/useTextareaAdjustment";
import VoiceRecorder from "./voice-recorder";
import TextToSpeechPlayer from "./text-to-speech";
import debounce from "lodash/debounce";
import { LanguagesIcon, LanguagesIconHandle } from "./ui/languages";

export default function TextareasContainer() {
  const textarea1Ref = useRef<HTMLTextAreaElement>(null);
  const textarea2Ref = useRef<HTMLTextAreaElement>(null);
  const languagesIconRef = useRef<LanguagesIconHandle>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [wrapperCenter, setWrapperCenter] = useState(0);

  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [sourceLanguage, setSourceLanguage] = useState("en");
  const [targetLanguage, setTargetLanguage] = useState("ar");
  const voiceId = "FTNCalFNG5bRnkkaP5Ug";

  // Determine if screen is medium (md) or larger to apply responsive min-height
  const [isMdOrLarger, setIsMdOrLarger] = useState<boolean>(false);

  // Use the textarea adjustment hook for dynamic height and font size with responsive minHeight
  const {
    syncedHeight,
    sourceFontSize,
    targetFontSize,
    updateSourceLength,
    updateTargetLength
  } = useTextareaAdjustment({
    minHeight: isMdOrLarger ? 450 : 0,
    fontSizeThreshold: 450
  });

  const { translateText, isTranslating, cancelTranslation } = useTranslation();

  // Track source text length for synchronization
  const handleSourceTextLength = (length: number) => {
    updateSourceLength(length);
  };

  // Track translated text length for synchronization
  const handleTranslatedTextLength = (length: number) => {
    updateTargetLength(length);
  };

  // move detectLanguage above debouncedTranslateAndDetect to fix linter error
  const detectLanguage = useCallback(async (text: string): Promise<string> => {
    try {
      const response = await fetch("/api/detect-language", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await response.json();
      if (response.ok) {
        return data.languageCode;
      } else {
        console.error(data.error);
        return sourceLanguage;
      }
    } catch (error) {
      console.error("Language detection failed:", error);
      return sourceLanguage;
    }
  }, [sourceLanguage]);

  // Debounced translate + detect language to limit API calls when typing
  const debouncedTranslateAndDetect = useMemo(
    () =>
      debounce(async (text: string) => {
        if (!text.trim()) {
          setTranslatedText("");
          return;
        }

        // detect user language
        const detectedLang = await detectLanguage(text);
        const prevSource = sourceLanguage;
        const prevTarget = targetLanguage;
        // swap if matching to avoid duplication
        const newTarget = detectedLang === prevTarget ? prevSource : prevTarget;
        // update pickers
        setSourceLanguage(detectedLang);
        setTargetLanguage(newTarget);
        // perform translation after swap
        const result = await translateText({
          text,
          sourceLanguage: detectedLang,
          targetLanguage: newTarget,
        });
        setTranslatedText(result);
      }, 1000),
    [detectLanguage, translateText, sourceLanguage, targetLanguage]
  );

  // Cancel debounced on unmount
  useEffect(() => {
    return () => {
      debouncedTranslateAndDetect.cancel();
    };
  }, [debouncedTranslateAndDetect]);

  // Start animation when translating begins and stop when it ends
  useEffect(() => {
    if (isTranslating) {
      languagesIconRef.current?.startAnimation();
    } else {
      languagesIconRef.current?.stopAnimation();
    }
  }, [isTranslating]);

  // handle text change: update state and trigger debounced translation
  const handleSourceTextChange = (text: string) => {
    cancelTranslation();
    debouncedTranslateAndDetect.cancel();

    setSourceText(text);

    if (!text.trim()) {
      setTranslatedText("");
    }

    if (text.trim()) {
      debouncedTranslateAndDetect(text);
    }
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

  // Calculate horizontal center of textarea2 wrapper for icon placement
  useLayoutEffect(() => {
    function updateWrapperCenter() {
      if (wrapperRef.current) {
        const rect = wrapperRef.current.getBoundingClientRect();
        setWrapperCenter(rect.left + rect.width / 2);
      }
    }
    updateWrapperCenter();
    window.addEventListener("resize", updateWrapperCenter);
    return () => window.removeEventListener("resize", updateWrapperCenter);
  }, []);

  // Update isMdOrLarger on mount and when viewport changes (client-side only)
  useEffect(() => {
    // useEffect only runs on client, so window is safe
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    // Set initial value
    setIsMdOrLarger(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setIsMdOrLarger(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return (
    <div className="flex flex-col md:min-h-[450px] container rounded-none md:rounded-lg border-none md:border bg-card border-gray-200">
      <div className="sticky top-[70px] z-40 bg-card w-full shadow-sm">
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
            exclude={targetLanguage}
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
            exclude={sourceLanguage}
          />
        </div>
      </div>
      <div className="flex md:flex-row flex-col justify-stretch items-stretch bg-transparent w-full">
        <TranslatedTextarea
          ref={textarea1Ref}
          value={sourceText}
          onChange={(e) => handleSourceTextChange(e.target.value)}
          placeholder="Enter text to translate"
          className="md:focus-within:rounded-bl-lg w-full border-0 md:border-r border-gray-200"
          wrapperClassName="w-full"
          buttonStyle="rounded-bl-lg"
          onSyncHeight={handleSourceTextLength}
          dynamicHeight={syncedHeight}
          fontSize={sourceFontSize}
        >
          <Button variant="custom" size="icon" className="bg-transparent">
            <Clipboard size={21} strokeWidth={1.5} className="text-gray-950" />
          </Button>
          <VoiceRecorder
            onTranscript={(text) => {
              handleSourceTextChange(text);
            }}
          />
        </TranslatedTextarea>

        <div className="relative w-full h-full" ref={wrapperRef}>
          <TranslatedTextarea
            ref={textarea2Ref}
            value={translatedText}
            onChange={() => { }}
            readOnly
            className="md:focus-within:rounded-br-lg relative w-full"
            wrapperClassName="pr-9 relative w-full"
            buttonStyle="rounded-br-lg"
            onSyncHeight={handleTranslatedTextLength}
            dynamicHeight={syncedHeight}
            fontSize={targetFontSize}
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
          </TranslatedTextarea>
          {isTranslating && (
            <>
              {/* Dim only textarea2Ref area */}
              <div className="absolute inset-0 z-50 bg-background/60" />
              {/* Icon fixed at vertical center of viewport, horizontally over textarea2Ref */}
              <div
                className="z-50"
                style={{
                  position: 'fixed',
                  top: '50%',
                  left: `${wrapperCenter}px`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <LanguagesIcon ref={languagesIconRef} size={40} className="text-primary" />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
