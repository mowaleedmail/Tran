// components\textarea.tsx
import React, { useEffect, useState, useId, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { X } from "lucide-react";
import { TextSize, TranslatedTextareaProps, TextareaRef } from "@/types/types";
import debounce from "lodash/debounce";

const TranslatedTextarea = React.forwardRef<
  TextareaRef,
  TranslatedTextareaProps
>(
  (
    {
      wrapperClassName,
      buttonStyle,
      className,
      textSize = "text-2xl",
      value,
      onChange,
      children,
      direction = "auto",
      onSyncHeight,
      ...props
    },
    ref
  ) => {
    const id = useId();
    const internalRef = useRef<TextareaRef | null>(null);
    const resolvedRef = (ref as React.RefObject<TextareaRef>) || internalRef;
    const [dynamicTextSize, setDynamicTextSize] = useState<TextSize>(textSize);
    const [text, setText] = useState<string>((value as string) || "");
    const [textDirection, setTextDirection] = useState<"rtl" | "ltr" | "auto">(
      direction
    );
    const lastHeightRef = useRef<number>(0);
    const resizeInProgressRef = useRef<boolean>(false);
    
    const detectTextDirection = useCallback(
      (content: string) => {
        if (direction !== "auto") return direction;
        const arabicPattern =
          /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
        return arabicPattern.test(content) ? "rtl" : "ltr";
      },
      [direction]
    );

    // Auto-resize textarea to fit content
    const autoResizeTextarea = useCallback((externalHeight?: number) => {
      const textarea = resolvedRef.current;
      if (!textarea || resizeInProgressRef.current) return;
      
      resizeInProgressRef.current = true;
      
      try {
        // Skip external height enforcement on small screens (mobile)
        if (externalHeight && window.innerWidth >= 768) {
          // If external height is provided and not on mobile, use it directly
          textarea.style.height = `${externalHeight}px`;
          lastHeightRef.current = externalHeight;
        } else {
          // Check if the content actually changed significantly before resizing
          const currentScrollHeight = textarea.scrollHeight;
          const heightDifference = Math.abs(currentScrollHeight - lastHeightRef.current);
          
          // Only resize if there's a significant change in height (more than 10px)
          // or if this is the first resize
          if (lastHeightRef.current === 0 || heightDifference > 10) {
            // Reset height temporarily to get the correct scrollHeight
            textarea.style.height = 'auto';
            
            // Set the height to scrollHeight to fit all content
            textarea.style.height = `${textarea.scrollHeight}px`;
            lastHeightRef.current = textarea.scrollHeight;
          }
        }
        
        // Calculate content length and send to parent for synchronization
        onSyncHeight?.(text.length);
      } finally {
        // Release the lock after a short delay to prevent rapid consecutive resizes
        setTimeout(() => {
          resizeInProgressRef.current = false;
        }, 50);
      }
    }, [resolvedRef, text.length, onSyncHeight]);
    
    // Create a debounced version of autoResizeTextarea to avoid rapid resizing during typing
    const debouncedAutoResize = useCallback(
      debounce((externalHeight?: number) => {
        autoResizeTextarea(externalHeight);
      }, 100),
      [autoResizeTextarea]
    );

    // Expose the autoResize function to parent through ref
    useEffect(() => {
      if (ref && typeof ref === 'object' && (ref as React.RefObject<TextareaRef>).current) {
        // Extend the ref object with our custom method
        const currentRef = (ref as React.RefObject<TextareaRef>).current;
        if (currentRef) {
          // We're exposing the non-debounced version for parent synchronization
          // to ensure immediate height adjustments from parent component
          currentRef.autoResizeTextarea = autoResizeTextarea;
        }
      }
    }, [ref, autoResizeTextarea]);

    useEffect(() => {
      setText((value as string) || "");
    }, [value]);

    useEffect(() => {
      const currentText = text;
      // Update font size based on text length
      if (currentText.length > 600) {
        setDynamicTextSize("text-base");
      } else if (currentText.length > 350) {
        setDynamicTextSize("text-lg");
      } else {
        setDynamicTextSize("text-2xl");
      }
      setTextDirection(detectTextDirection(currentText));
      
      // Use debounced resize when text changes due to typing
      debouncedAutoResize();
    }, [text, detectTextDirection, debouncedAutoResize]);

    // Initial auto-resize on mount and when value changes externally
    useEffect(() => {
      // For external value changes, use immediate resize rather than debounced
      autoResizeTextarea();
      // Add a slight delay to ensure content is rendered
      const timer = setTimeout(autoResizeTextarea, 50);
      return () => clearTimeout(timer);
    }, [value, autoResizeTextarea]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setText(newValue);
      onChange?.(e);
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      // Capture textarea element to avoid React event pooling issues
      const textareaEl = e.currentTarget;
      setTimeout(() => {
        const newValue = textareaEl.value;
        setText(newValue);
        onChange?.({ target: textareaEl } as React.ChangeEvent<HTMLTextAreaElement>);
      }, 0);
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
          "flex flex-col w-full border-[1px] border-background md:focus-within:border-zinc-950 md:focus-within:border-[1px] relative",
          className
        )}
      >
        <div className="w-full flex flex-row relative">
          <textarea
            id={id}
            ref={resolvedRef}
            dir={textDirection}
            className={cn(
              dynamicTextSize,
              "w-full pt-6 px-6 pb-0 resize-none overflow-hidden focus:outline-none bg-transparent md:min-h-[400px]",
              textDirection === "rtl" && "text-right",
              wrapperClassName
            )}
            value={text}
            onChange={handleChange}
            onPaste={handlePaste}
            {...props}
          />
          {text && !props.readOnly && (
            <Button
              id="clear-button"
              variant="ghost"
              size="icon"
              className="absolute right-0 hover:bg-red-200 rounded-none top-0 h-7 w-7 z-0"
              onClick={handleClear}
            >
              <X size={20} strokeWidth={1.5} color="red"/>
            </Button>
          )}
        </div>
        {children && (
          <div
            className={cn(
              "w-full sticky right-0 bottom-0 flex items-center gap-2 py-2 px-6 bg-white/80 backdrop-blur-md",
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
