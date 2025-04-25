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
      const responseText = result.response.text().trim();

    // Find a supported language by checking if the response includes its label
    const matched = languages.find((lang) =>
      responseText.toLowerCase().includes(lang.label.toLowerCase())
    );
    // Default to English if no match found
    const languageCode = matched ? matched.value : 'de';
    return NextResponse.json({ languageCode });
  } catch (error) {
    console.error("Language detection error:", error);
    return NextResponse.json(
      { error: "Language detection service error" },
      { status: 500 }
    );
  }
}
