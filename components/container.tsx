//components\container.tsx.
"use client";

import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { ArrowLeftRight, Clipboard, Copy } from "lucide-react";
import LanguageSelection from "./selection";
import { Button } from "./ui/button";
import TranslatedTextarea from "./textarea";
import { useTranslation } from "@/hooks/useTranslation";
import VoiceRecorder from "./voice-recorder";
import TextToSpeechPlayer from "./text-to-speech";
import debounce from "lodash/debounce";
import { LanguagesIcon, LanguagesIconHandle } from "./ui/languages";

export default function TextareasContainer() {
  const textarea1Ref = useRef<HTMLTextAreaElement>(null);
  const textarea2Ref = useRef<HTMLTextAreaElement>(null);
  const languagesIconRef = useRef<LanguagesIconHandle>(null);

  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [sourceLanguage, setSourceLanguage] = useState("en");
  const [targetLanguage, setTargetLanguage] = useState("ar");
  const [sourceLength, setSourceLength] = useState(0);
  const [translatedLength, setTranslatedLength] = useState(0);
  const voiceId = "FTNCalFNG5bRnkkaP5Ug";

  const { translateText, isTranslating, cancelTranslation } = useTranslation();

  // Set the same scroll position for both textareas based on the longer content
  useEffect(() => {
    if (textarea1Ref.current && textarea2Ref.current) {
      // Calculate lines more accurately based on actual newlines and estimated line wrapping
      const countTextLines = (text: string): number => {
        // Estimate wrapped lines (assume 50 chars per line on average)
        const charsPerLine = 50;
        // Split by newlines and calculate wrap for each line
        const lines = text.split('\n');
        let wrappedLineCount = 0;
        
        lines.forEach(line => {
          wrappedLineCount += Math.ceil(line.length / charsPerLine);
        });
        
        // Total lines is the number of wrapped lines (which already accounts for newlines)
        return Math.max(wrappedLineCount, 1); // Ensure at least 1 line
      };
      
      const sourceLines = countTextLines(sourceText);
      const translatedLines = countTextLines(translatedText);
      const maxLines = Math.max(sourceLines, translatedLines);
      
      // Base height plus height per line
      const baseHeight = 400; // Base height in pixels
      const heightPerLine = 30; // pixels per line
      const contentHeight = baseHeight + ((maxLines - 1) * heightPerLine); // Subtract 1 because base height includes first line
      
      // Set both min-height and height to ensure expansion
      textarea1Ref.current.style.height = `${contentHeight}px`;
      textarea2Ref.current.style.height = `${contentHeight}px`;
      textarea1Ref.current.style.minHeight = `${contentHeight}px`;
      textarea2Ref.current.style.minHeight = `${contentHeight}px`;
    }
  }, [sourceText, translatedText]); // Use the actual text rather than just length

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
    setTranslatedText("");

    if (text.trim()) {
      debouncedTranslateAndDetect(text);
    }
  };

  // Track source text length for synchronization
  const handleSourceTextLength = (length: number) => {
    setSourceLength(length);
  };

  // Track translated text length for synchronization
  const handleTranslatedTextLength = (length: number) => {
    setTranslatedLength(length);
  };

  const switchLanguages = () => {
    const tempLang = sourceLanguage;
    setSourceLanguage(targetLanguage);
    setTargetLanguage(tempLang);
    setSourceText(translatedText);
    setTranslatedText(sourceText);

    // Update lengths when switching
    const tempLength = sourceLength;
    setSourceLength(translatedLength);
    setTranslatedLength(tempLength);
  };

  const copyToClipboard = () => {
    if (translatedText.trim()) {
      navigator.clipboard.writeText(translatedText).then();
    }
  };

  return (
    <div className="flex flex-col min-h-[400px] container rounded-none md:rounded-lg border-none md:border bg-card border-gray-200">
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
      <div className="flex md:flex-row flex-col justify-stretch items-stretch bg-transparent w-full max-h-[70vh] overflow-auto">
        <TranslatedTextarea
          ref={textarea1Ref}
          value={sourceText}
          onChange={(e) => handleSourceTextChange(e.target.value)}
          placeholder="Enter text to translate"
          className="md:focus-within:rounded-bl-lg w-full"
          wrapperClassName="w-full"
          buttonStyle="rounded-bl-lg"
          onSyncHeight={handleSourceTextLength}
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

        <div className="relative w-full h-full">
          <TranslatedTextarea
            ref={textarea2Ref}
            value={translatedText}
            onChange={() => {}}
            readOnly
            className="md:focus-within:rounded-br-lg relative w-full"
            wrapperClassName="pr-9 relative w-full"
            buttonStyle="rounded-br-lg"
            onSyncHeight={handleTranslatedTextLength}
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
            <div
              className="absolute left-0 top-0 w-full flex items-center justify-center z-50 pointer-events-none bg-background/60"
              style={{ height: textarea1Ref.current?.offsetHeight + 'px' }}
            >
              <div>
                <LanguagesIcon ref={languagesIconRef} size={40} className="text-primary" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
