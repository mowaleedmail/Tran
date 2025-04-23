// components\selection.tsx
"use client";

import { languages, LanguageSelectionProps } from "@/types/types";
import { useId, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronDown } from "lucide-react";

export default function LanguageSelection({
  value,
  onChange,
  exclude,
}: LanguageSelectionProps) {
  const id = useId();
  const [open, setOpen] = useState<boolean>(false);

  return (
    <div className="w-full">
      <div className="space-y-0">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              id={id}
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="justify-center items-center gap-1 border-none shadow-none bg-white outline-offset-0 h-8 w-full"
            >
              <span
                className={cn(
                  "truncate",
                  "text-foreground text-base font-medium font-roboto leading-normal"
                )}
              >
                {value
                  ? languages.find((language) => language.value === value)
                    ?.label
                  : "Detect language"}
              </span>
              <ChevronDown
                size={20}
                strokeWidth={2}
                className="shrink-0 text-muted-foreground/80"
                aria-hidden="true"
              />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-full mt-0 p-0 rounded-md shadow-sm"
            align="center"
          >
            <Command>
              <CommandInput placeholder="Search language..." />
              <CommandList>
                <CommandEmpty>No language found.</CommandEmpty>
                <CommandGroup>
                  {languages
                    .filter((language) => language.value !== exclude)
                    .map((language) => (
                      <CommandItem
                        key={language.value}
                        value={language.value}
                        onSelect={(currentValue) => {
                          onChange(currentValue);
                          setOpen(false);
                        }}
                      >
                        {language.label}
                        {value === language.value && (
                          <Check size={16} strokeWidth={2} className="ml-auto" />
                        )}
                      </CommandItem>
                    ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}