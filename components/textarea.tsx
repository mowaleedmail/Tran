// components\textarea.tsx
import React, { useEffect, useState, useId, useCallback, useRef, useLayoutEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { X } from "lucide-react";
import { TranslatedTextareaProps } from "@/types/types";

const TranslatedTextarea = React.forwardRef<
  HTMLTextAreaElement,
  TranslatedTextareaProps
>(
  (
    {
      wrapperClassName,
      buttonStyle,
      className,
      value,
      onChange,
      children,
      direction = "auto",
      onSyncHeight,
      dynamicHeight,
      fontSize,
      ...props
    },
    ref
  ) => {
    const id = useId();
    const internalRef = useRef<HTMLTextAreaElement | null>(null);
    const resolvedRef = (ref as React.RefObject<HTMLTextAreaElement>) || internalRef;
    const [text, setText] = useState<string>((value as string) || "");
    const [textDirection, setTextDirection] = useState<"rtl" | "ltr" | "auto">(
      direction
    );
    const [isMdOrLargerLocal, setIsMdOrLargerLocal] = useState<boolean>(false);
    
    // Function to adjust textarea height based on content
    const adjustHeight = useCallback(() => {
      if (!resolvedRef.current) return;
      
      const textarea = resolvedRef.current;
      // Save the current scroll position
      const scrollPos = window.pageYOffset || document.documentElement.scrollTop;
      
      // Reset height to calculate the new height
      textarea.style.height = 'auto';
      
      // Set new height (with some padding to avoid scrollbar flickering)
      const newHeight = Math.max(100, textarea.scrollHeight + 5); 
      textarea.style.height = `${newHeight}px`;
      
      // Restore scroll position
      window.scrollTo(0, scrollPos);
    }, [resolvedRef]);

    const detectTextDirection = useCallback(
      (content: string) => {
        if (direction !== "auto") return direction;
        const arabicPattern =
          /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
        return arabicPattern.test(content) ? "rtl" : "ltr";
      },
      [direction]
    );

    useEffect(() => {
      setText((value as string) || "");
    }, [value]);

    useEffect(() => {
      const currentText = text;
      setTextDirection(detectTextDirection(currentText));
      
      // Calculate content length and send to parent for synchronization
      onSyncHeight?.(text.length);
      
      // Update height on text change for mobile
      if (!isMdOrLargerLocal && resolvedRef.current) {
        adjustHeight();
      }
    }, [text, detectTextDirection, onSyncHeight, isMdOrLargerLocal, adjustHeight, resolvedRef]);

    useEffect(() => {
      const mediaQuery = window.matchMedia('(min-width: 768px)');
      setIsMdOrLargerLocal(mediaQuery.matches);
      const handler = (e: MediaQueryListEvent) => setIsMdOrLargerLocal(e.matches);
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }, []);

    useLayoutEffect(() => {
      // Initial height adjustment when component mounts
      if (!isMdOrLargerLocal && resolvedRef.current) {
        adjustHeight();
      }
    }, [isMdOrLargerLocal, adjustHeight, resolvedRef]);

    // Handle paste events to recalculate height after content is pasted
    useEffect(() => {
      const handlePaste = () => {
        if (!isMdOrLargerLocal && resolvedRef.current) {
          // Schedule height adjustment after paste content is rendered
          setTimeout(adjustHeight, 0);
        }
      };
      
      const textareaEl = resolvedRef.current;
      if (textareaEl) {
        textareaEl.addEventListener('paste', handlePaste);
        return () => textareaEl.removeEventListener('paste', handlePaste);
      }
    }, [isMdOrLargerLocal, adjustHeight, resolvedRef]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      
      setText(newValue);
      onChange?.(e);
      
      // Immediate height adjustment on mobile
      if (!isMdOrLargerLocal) {
        // Run after state update in a microtask to get latest DOM
        queueMicrotask(() => adjustHeight());
      }
    };

    const handleClear = () => {
      setText("");
      onChange?.({
        target: { value: "" },
      } as React.ChangeEvent<HTMLTextAreaElement>);

      // Focus after clearing
      if (ref && "current" in ref && ref.current) {
        ref.current.focus();
      }
    };

    return (
      <div
        className={cn(
          "flex flex-col w-full h-full border-[1px] border-background md:focus-within:border-zinc-950 md:focus-within:border-[1px] relative p-[1px] min-h-[100px]",
          className
        )}
      >
        <div className="w-full flex flex-row relative grow">
          <textarea
            id={id}
            ref={resolvedRef}
            dir={textDirection}
            style={
              isMdOrLargerLocal
                ? (dynamicHeight
                    ? { height: `${dynamicHeight}px`, ...(fontSize && fontSize.includes('px') ? { fontSize: fontSize } : {}) }
                    : undefined)
                : undefined
            }
            className={cn(
              // If fontSize includes 'text-' prefix, use it directly, otherwise use default
              (fontSize && !fontSize.includes('px')) ? fontSize : "text-xl",
              "w-full pt-6 px-6 pb-8 min-h-[100px] resize-none focus:outline-none bg-transparent transition-none",
              !isMdOrLargerLocal ? "overflow-y-hidden" : "overflow-hidden",
              textDirection === "rtl" && "text-right",
              wrapperClassName
            )}
            value={text}
            onChange={handleChange}
            {...props}
          />
          {text && !props.readOnly && (
            <Button
              id="clear-button"
              variant="ghost"
              size="icon"
              className="sticky top-[130px] z-20 hover:bg-red-200 rounded-none h-9 w-9"
              onClick={handleClear}
            >
              <X size={24} strokeWidth={1.5} color="red"/>
            </Button>
          )}
        </div>
        {children && (
          <div
            className={cn(
              "w-full sticky right-0 left-0 bottom-0 flex items-center gap-2 py-2 px-6 bg-white/80 backdrop-blur-md h-14 mt-auto",
              buttonStyle
            )}
          >
            {children}
          </div>
        )}
      </div>
    );
  }
);

TranslatedTextarea.displayName = "TranslatedTextarea";

export default TranslatedTextarea;
