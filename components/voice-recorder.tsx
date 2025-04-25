"use client";

import React, { useState, useRef, useEffect } from "react";
import { Mic, StopCircle } from "lucide-react";

const VoiceRecorder: React.FC<{ onTranscript: (text: string) => void }> = ({
  onTranscript,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Detect iOS platform
  useEffect(() => {
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(iOS);
  }, []);

  const toggleRecording = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      await startRecording();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Use different MIME types based on platform
      const mimeType = isIOS ? 'audio/mp4' : 'audio/webm';
      
      // Check if the browser supports the selected MIME type
      const options: MediaRecorderOptions = {};
      if (MediaRecorder.isTypeSupported(mimeType)) {
        options.mimeType = mimeType;
      } else if (MediaRecorder.isTypeSupported('audio/aac')) {
        options.mimeType = 'audio/aac';
      } else if (MediaRecorder.isTypeSupported('audio/wav')) {
        options.mimeType = 'audio/wav';
      }
      
      const mediaRecorder = new MediaRecorder(stream, options);

      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        // Use the same MIME type that was used for recording
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType || 'audio/mp4'
        });
        audioChunksRef.current = [];
        await handleTranscription(audioBlob);
        stopStream();
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Error accessing microphone. Please check permissions and try again.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    } else {
      console.error("MediaRecorder not initialized.");
    }
  };

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const handleTranscription = async (audioBlob: Blob) => {
    try {
      setIsLoading(true);

      // Use the detected file type from the Blob
      const fileExtension = audioBlob.type.includes('mp4') ? 'mp4' : 
                          audioBlob.type.includes('aac') ? 'aac' : 
                          audioBlob.type.includes('wav') ? 'wav' : 'webm';
      
      const file = new File([audioBlob], `recording.${fileExtension}`, {
        type: audioBlob.type
      });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("model", "whisper-1");

      const response = await fetch(
        "https://api.openai.com/v1/audio/transcriptions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (data.text) {
        onTranscript(data.text);
      } else {
        console.error("Transcription error:", data);
      }
    } catch (error) {
      console.error("Error uploading or transcribing audio:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
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
          <Mic
            className="text-gray-500 bg-transparent"
            strokeWidth={1.5}
            size={22}
          />
        )}
      </button>
    </div>
  );
};

export default VoiceRecorder;
