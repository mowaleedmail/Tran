//types\types.ts
export interface Language {
  value: string;
  label: string;
}

export interface TranslationRequest {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
}

export interface TranslationResponse {
  translatedText: string;
}

export interface UseTranslationProps {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
}

export const languages = [
  {
    value: "en",
    label: "English",
  },
  {
    value: "ar",
    label: "Arabic",
  },
  {
    value: "fr",
    label: "French",
  },
  {
    value: "es",
    label: "Spanish",
  },
  {
    value: "de",
    label: "German",
  },
];

export interface LanguageSelectionProps {
  value: string;
  onChange: (value: string) => void;
  exclude?: string;
}

export interface TranslatedTextareaProps
  extends React.ComponentProps<"textarea"> {
  children?: React.ReactNode;
  direction?: "rtl" | "ltr" | "auto";
  wrapperClassName?: string;
  buttonStyle?: string;
  onSyncHeight?: (height: number) => void;
}
