// app/api/detect-language/route.ts
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { languages } from "@/types/types";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text } = body;

    if (!text) {
      return NextResponse.json(
        { error: "Missing required 'text' field" },
        { status: 400 }
      );
    }

    const prompt = `Identify the language of this text: ${text}`;
    const result = await model.generateContent(prompt);
    const response = result.response;
    let detectedLanguageLabel = response.text().trim();

    // استخدام تعبير منتظم لاستخراج اسم اللغة من النص
    const languageMatch = detectedLanguageLabel.match(
      /(Arabic|English|French|Spanish|German)/i
    );
    if (languageMatch) {
      detectedLanguageLabel = languageMatch[0];
    } else {
      return NextResponse.json(
        { error: "Could not extract language name", detectedLanguageLabel },
        { status: 400 }
      );
    }

    // البحث في قائمة اللغات عن اللغة المطابقة
    const matchedLanguage = languages.find(
      (lang) => lang.label.toLowerCase() === detectedLanguageLabel.toLowerCase()
    );

    if (!matchedLanguage) {
      return NextResponse.json(
        { error: "Language not supported", detectedLanguageLabel },
        { status: 400 }
      );
    }

    // إرجاع رمز اللغة فقط
    return NextResponse.json({ languageCode: matchedLanguage.value });
  } catch (error) {
    console.error("Language detection error:", error);
    return NextResponse.json(
      { error: "Language detection service error" },
      { status: 500 }
    );
  }
}
