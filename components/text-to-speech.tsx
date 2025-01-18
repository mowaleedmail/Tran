"use client";

import { convertTextToSpeech } from "@/app/api/text-to-speech/elevenLabs";
import { StopCircle, Volume2 } from "lucide-react";
import React, { useState } from "react";

const TextToSpeechPlayer: React.FC<{ text: string; voiceId: string }> = ({
  text,
  voiceId,
}) => {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const toggleRecording = async () => {
    if (isRecording) {
      handleStop();
    } else {
      await handlePlay();
    }
  };

  const handlePlay = async () => {
    if (!audioUrl) {
      setIsLoading(true);
      try {
        const audioBlob = await convertTextToSpeech(voiceId, text);
        const newAudioUrl = URL.createObjectURL(audioBlob);
        setAudioUrl(newAudioUrl);

        const newAudio = new Audio(newAudioUrl);
        setAudio(newAudio);

        newAudio.play();
        setIsRecording(true);

        newAudio.onended = () => {
          setIsRecording(false);
        };
      } catch (error) {
        console.error("Error playing text-to-speech:", error);
      } finally {
        setIsLoading(false);
      }
    } else {
      audio?.play();
      setIsRecording(true);
      audio!.onended = () => {
        setIsRecording(false);
      };
    }
  };

  const handleStop = () => {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      setIsRecording(false);
    }
  };

  return (
    <button
      onClick={toggleRecording}
      className="items-center justify-center h-9 w-9 rounded-full flex"
    >
      {isLoading ? (
        <div className="h-5 w-5 rounded-full text-gray-950 animate-spin border-[3px] border-solid border-current border-r-transparent" />
      ) : isRecording ? (
        <StopCircle
          className="text-red-500 bg-transparent"
          strokeWidth={1.5}
          size={22}
        />
      ) : (
        <Volume2
          className="text-gray-500 bg-transparent"
          strokeWidth={1.5}
          size={22}
        />
      )}
    </button>
  );
};

export default TextToSpeechPlayer;
