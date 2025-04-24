"use client";

import { useRef, useState, useEffect, useLayoutEffect, useCallback, useMemo } from "react";
import { ArrowLeftRight, Clipboard, Copy } from "lucide-react";
import LanguageSelection from "./selection";
import { Button } from "./ui/button";
import TranslatedTextarea from "./textarea";
import { useTranslation } from "@/hooks/useTranslation";
import VoiceRecorder from "./voice-recorder";
import TextToSpeechPlayer from "./text-to-speech";
import debounce from "lodash/debounce";
import { LanguagesIcon, LanguagesIconHandle } from "./ui/languages";
import { TextareaRef } from "@/types/types";

export default function TextareasContainer() {
  const textarea1Ref = useRef<TextareaRef>(null);
  const textarea2Ref = useRef<TextareaRef>(null);
  const languagesIconRef = useRef<LanguagesIconHandle>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isSynchronizingRef = useRef<boolean>(false);
  const [wrapperCenter, setWrapperCenter] = useState(0);

  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [sourceLanguage, setSourceLanguage] = useState("en");
  const [targetLanguage, setTargetLanguage] = useState("ar");
  const [sourceLength, setSourceLength] = useState(0);
  const [translatedLength, setTranslatedLength] = useState(0);
  const voiceId = "FTNCalFNG5bRnkkaP5Ug";

  const { translateText, isTranslating, cancelTranslation } = useTranslation();

  // Synchronize both textarea heights to be the same
  useEffect(() => {
    // Only run synchronization on medium and larger screens
    if (window.innerWidth < 768) return;

    // Skip rapid synchronization during typing
    if (isSynchronizingRef.current) return;

    // Reset heights when both texts are empty
    if (!sourceText.trim() && !translatedText.trim() && textarea1Ref.current && textarea2Ref.current) {
      const minHeight = '400px';
      textarea1Ref.current.style.height = minHeight;
      textarea2Ref.current.style.height = minHeight;
      textarea1Ref.current.style.minHeight = minHeight;
      textarea2Ref.current.style.minHeight = minHeight;
      return;
    }

    if (textarea1Ref.current && textarea2Ref.current) {
      isSynchronizingRef.current = true;

      // Use a more significant delay to avoid race conditions with typing
      setTimeout(() => {
        // Make sure refs are still valid within the timeout
        if (!textarea1Ref.current || !textarea2Ref.current) {
          isSynchronizingRef.current = false;
          return;
        }

        // Only sync heights if there's a significant difference (more than 20px)
        // to avoid constant small adjustments during typing
        const height1 = textarea1Ref.current.scrollHeight || 0;
        const height2 = textarea2Ref.current.scrollHeight || 0;
        const heightDifference = Math.abs(height1 - height2);

        if (heightDifference > 20) {
          // Use the maximum height for both textareas
          const maxHeight = Math.max(height1, height2, 400); // Ensure minimum height of 400px

          // Apply the same height to both textareas using the enhanced ref method
          if (textarea1Ref.current.autoResizeTextarea) {
            textarea1Ref.current.autoResizeTextarea(maxHeight);
          } else {
            textarea1Ref.current.style.height = `${maxHeight}px`;
          }

          if (textarea2Ref.current.autoResizeTextarea) {
            textarea2Ref.current.autoResizeTextarea(maxHeight);
          } else {
            textarea2Ref.current.style.height = `${maxHeight}px`;
          }
        }

        isSynchronizingRef.current = false;
      }, 300); // Longer delay to ensure content stabilizes first
    }
  }, [sourceText, translatedText]);

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

  // Track source text length for synchronization
  const handleSourceTextLength = (length: number) => {
    setSourceLength(length);
  };

  // Track translated text length for synchronization
  const handleTranslatedTextLength = (length: number) => {
    setTranslatedLength(length);
  };

  // Debounced translate + detect language to limit API calls when typing
  const debouncedTranslateAndDetect = useMemo(
    () =>
      debounce(async (text: string) => {
        if (!text.trim()) {
          setTranslatedText("");
          return;
        }

        // Store current height before translation
        let currentHeight = 0;
        if (textarea2Ref.current && window.innerWidth >= 768) {
          currentHeight = textarea2Ref.current.offsetHeight;
          // Apply min-height to prevent shrinking during translation
          if (currentHeight > 0) {
            textarea2Ref.current.style.minHeight = `${currentHeight}px`;
          }
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

    // Check if this is a significant paste operation (sudden large text increase)
    const isPasteOperation = text.length > sourceText.length + 50;

    setSourceText(text);

    // Don't clear translated text immediately to prevent textarea shrinking
    // Only clear if the source text is empty
    if (!text.trim()) {
      setTranslatedText("");

      // Reset heights when text is cleared
      if (textarea1Ref.current && textarea2Ref.current) {
        // Reset to minimum height
        const minHeight = window.innerWidth >= 768 ? '400px' : 'auto';
        textarea1Ref.current.style.height = minHeight;
        textarea2Ref.current.style.height = minHeight;
        textarea1Ref.current.style.minHeight = minHeight;
        textarea2Ref.current.style.minHeight = minHeight;

        // If the component has autoResizeTextarea method, use it
        if (textarea1Ref.current.autoResizeTextarea) {
          textarea1Ref.current.autoResizeTextarea(400);
        }
        if (textarea2Ref.current.autoResizeTextarea) {
          textarea2Ref.current.autoResizeTextarea(400);
        }
      }
    } else if (isPasteOperation) {
      // Special handling for paste operations
      if (textarea1Ref.current) {
        // Wait a moment for the paste to complete rendering
        setTimeout(() => {
          if (!textarea1Ref.current) return;

          // First reset height to get accurate measurement
          textarea1Ref.current.style.height = 'auto';

          // Get exact content height
          const contentHeight = Math.max(
            textarea1Ref.current.scrollHeight,
            window.innerWidth >= 768 ? 400 : 200
          );

          // Set exact content height without extra space
          textarea1Ref.current.style.height = `${contentHeight}px`;

          // Apply same height to second textarea for consistency
          if (textarea2Ref.current) {
            textarea2Ref.current.style.height = `${contentHeight}px`;
          }
        }, 10);
      }
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

  // Preserve height during translation
  useEffect(() => {
    // Skip on small screens
    if (window.innerWidth < 768) return;

    if (isTranslating && textarea2Ref.current) {
      // Store current height before translation starts
      const currentHeight = textarea2Ref.current.offsetHeight;
      if (currentHeight > 0) {
        // Apply min-height to prevent shrinking
        textarea2Ref.current.style.minHeight = `${currentHeight}px`;
      }
    } else if (!isTranslating && textarea2Ref.current) {
      // Reset min-height when translation is complete to allow normal resizing
      // Keep a small delay to ensure the text is rendered first
      setTimeout(() => {
        if (textarea2Ref.current) {
          // On medium screens, still maintain the minimum height
          const minHeight = window.innerWidth >= 768 ? '400px' : 'auto';
          textarea2Ref.current.style.minHeight = minHeight;

          // After resetting, re-synchronize heights
          if (textarea1Ref.current && textarea2Ref.current && window.innerWidth >= 768) {
            const height1 = textarea1Ref.current.scrollHeight || 0;
            const height2 = textarea2Ref.current.scrollHeight || 0;
            const maxHeight = Math.max(height1, height2, 400);

            textarea1Ref.current.style.height = `${maxHeight}px`;
            textarea2Ref.current.style.height = `${maxHeight}px`;
          }
        }
      }, 150);
    }
  }, [isTranslating]);

  // Add responsive listener to handle window resizing
  useEffect(() => {
    const handleResize = () => {
      // Clear synchronized heights on small screens
      if (window.innerWidth < 768) {
        if (textarea1Ref.current) {
          textarea1Ref.current.style.height = 'auto';
        }
        if (textarea2Ref.current) {
          textarea2Ref.current.style.height = 'auto';
        }
      }
      // Re-synchronize on medium+ screens
      else if (textarea1Ref.current && textarea2Ref.current) {
        const height1 = textarea1Ref.current.scrollHeight || 0;
        const height2 = textarea2Ref.current.scrollHeight || 0;
        const maxHeight = Math.max(height1, height2, 400);

        textarea1Ref.current.style.height = `${maxHeight}px`;
        textarea2Ref.current.style.height = `${maxHeight}px`;
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

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

  return (
    <div className="flex flex-col h-auto md:min-h-[400px] container rounded-none md:rounded-lg border-none md:border bg-card border-gray-200">
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
