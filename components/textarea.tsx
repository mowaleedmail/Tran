// components\textarea.tsx
import React, { useEffect, useState, useId, useCallback, useRef } from "react";
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
    }, [text, detectTextDirection, onSyncHeight]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setText(newValue);
      onChange?.(e);
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
          "flex flex-col w-full h-full border-[1px] border-background md:focus-within:border-zinc-950 md:focus-within:border-[1px] relative",
          className
        )}
      >
        <div className="w-full flex flex-row relative">
          <textarea
            id={id}
            ref={resolvedRef}
            dir={textDirection}
            className={cn(
              "text-2xl",
              "w-full pt-6 px-6 pb-0 resize-none overflow-hidden focus:outline-none bg-transparent md:min-h-[400px]",
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
