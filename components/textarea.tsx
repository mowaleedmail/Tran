// components\textarea.tsx
import React, { useEffect, useState, useId, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { X } from "lucide-react";
import { TextSize, TranslatedTextareaProps } from "@/types/types";

const TranslatedTextarea = React.forwardRef<
  HTMLTextAreaElement,
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
    const [dynamicTextSize, setDynamicTextSize] = useState<TextSize>(textSize);
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
      if (currentText.length > 600) {
        setDynamicTextSize("text-base");
      } else if (currentText.length > 350) {
        setDynamicTextSize("text-lg");
      } else {
        setDynamicTextSize("text-2xl");
      }
      setTextDirection(detectTextDirection(currentText));
    }, [text, detectTextDirection]);

    const adjustHeight = (textarea: HTMLTextAreaElement) => {
      textarea.style.height = "auto";
      const newHeight = Math.max(textarea.scrollHeight, 400);
      textarea.style.height = `${newHeight}px`;
      onSyncHeight?.(newHeight);
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setText(newValue);
      adjustHeight(e.target);
      onChange?.(e);
    };

    const handleClear = () => {
      setText("");
      onChange?.({
        target: { value: "" },
      } as React.ChangeEvent<HTMLTextAreaElement>);

      // إضافة التركيز بعد التفريغ
      if (ref && "current" in ref && ref.current) {
        ref.current.focus();
      }
    };

    useEffect(() => {
      const textarea = ref as React.RefObject<HTMLTextAreaElement>;
      if (textarea?.current) {
        adjustHeight(textarea.current);
      }
    }, [ref, text, adjustHeight]);
    return (
      <div
        className={cn(
          "flex flex-col w-full border border-transparent transition-colors duration-200 focus-within:border-zinc-950 focus-within:border relative",
          className
        )}
      >
        <div className="w-full flex flex-row relative">
          <textarea
            id={id}
            ref={ref}
            dir={textDirection}
            className={cn(
              dynamicTextSize,
              "w-full pt-6 px-6 pb-0 resize-none focus:outline-none bg-transparent",
              textDirection === "rtl" && "text-right",
              wrapperClassName
            )}
            value={text}
            onChange={handleChange}
            style={{ minHeight: "400px" }}
            {...props}
          />
          {text && !props.readOnly && (
            <Button
              id="clear-button"
              variant="ghost"
              size="icon"
              className="absolute top-[26px] right-[6px] h-7 w-7"
              onClick={handleClear}
            >
              <X size={20} strokeWidth={1.5} color="black" />
            </Button>
          )}
        </div>
        {children && (
          <div
            className={cn(
              "w-full sticky bottom-0 flex items-center gap-2 py-2 px-6 bg-white/80 backdrop-blur-md",
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
