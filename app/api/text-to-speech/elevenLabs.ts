import { ElevenLabsClient } from "elevenlabs"; // التحقق من وجود OutputFormat

const client = new ElevenLabsClient({
  apiKey: process.env.NEXT_PUBLIC_ELEVEN_LABS_API_KEY!,
});

export const convertTextToSpeech = async (
  voiceId: string,
  text: string,
  modelId: string = "eleven_multilingual_v2"
): Promise<Blob> => {
  try {
    const response = await client.textToSpeech.convert(voiceId, {
      output_format: "mp3_44100_128",
      text,
      model_id: modelId,
    });

    // تحويل الاستجابة إلى Blob
    const chunks: Uint8Array[] = [];
    for await (const chunk of response as unknown as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }
    const audioBlob = new Blob(chunks, { type: "audio/mpeg" });
    return audioBlob;
  } catch (error) {
    console.error("Error in text-to-speech conversion:", error);
    throw new Error("Failed to convert text to speech.");
  }
};
