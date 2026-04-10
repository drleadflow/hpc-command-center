"use client";

import { useState, useCallback, useRef } from "react";

export function VoiceAvatar() {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Play TTS response
  const speakText = useCallback(async (text: string) => {
    try {
      setIsSpeaking(true);
      setError(null);
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      
      if (!res.ok) {
        setError("TTS failed");
        setIsSpeaking(false);
        return;
      }
      
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      const audio = new Audio(url);
      audioRef.current = audio;
      
      audio.onended = () => {
        setIsSpeaking(false);
      };
      
      audio.onerror = () => {
        setError("Audio playback failed");
        setIsSpeaking(false);
      };
      
      await audio.play();
    } catch (err) {
      setError("TTS error");
      setIsSpeaking(false);
    }
  }, []);

  // Send message to chat API
  const sendToChat = useCallback(async (text: string) => {
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "user", content: text }),
      });
      
      const data = await res.json();
      
      if (data.reply) {
        await speakText(data.reply);
      }
    } catch (err) {
      setError("Chat failed");
      setIsSpeaking(false);
    }
  }, [speakText]);

  // Toggle speech recognition
  const toggleListening = useCallback(() => {
    setError(null);
    
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    if (isSpeaking) {
      audioRef.current?.pause();
      setIsSpeaking(false);
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("Speech not supported - use Chrome");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setIsListening(false);
      sendToChat(transcript);
    };

    recognition.onerror = (e: any) => {
      setError("Mic error: " + e.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening, isSpeaking, sendToChat]);

  const getStateColor = () => {
    if (error) return "#ef4444"; // Red for error
    if (isListening) return "#3b82f6"; // Blue
    if (isSpeaking) return "#10b981"; // Green
    return "#f59e0b"; // Amber
  };

  const color = getStateColor();

  return (
    <button 
      className="fixed bottom-6 right-6 z-50 flex flex-col items-center gap-3 bg-transparent border-none p-0 cursor-pointer touch-manipulation"
      onClick={toggleListening}
      aria-label={isListening ? "Stop listening" : "Start voice input"}
    >
      <div className=" backdrop-blur rounded-full px-4 py-2 text-sm font-medium border themed-border shadow-xl">
        <span style={{ color }}>
          {error || (isListening ? "Listening..." : isSpeaking ? "Speaking..." : "Tap to talk")}
        </span>
      </div>

      <div className="relative w-20 h-20">
        {(isListening || isSpeaking) && (
          <>
            <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ backgroundColor: color }} />
            <div className="absolute -inset-2 rounded-full animate-pulse opacity-10" style={{ backgroundColor: color }} />
          </>
        )}
        
        <div 
          className="absolute inset-0 rounded-full border-2 transition-all duration-500"
          style={{ 
            borderColor: color,
            boxShadow: `0 0 30px ${color}40`,
            transform: isListening || isSpeaking ? "scale(1.1)" : "scale(1)"
          }}
        />

        <div 
          className="absolute inset-2 rounded-full flex items-center justify-center transition-all duration-300"
          style={{ 
            background: `linear-gradient(135deg, ${color}20, ${color}05)`,
            backdropFilter: "blur(10px)"
          }}
        >
          <div 
            className="text-3xl transition-transform duration-300"
            style={{ color, transform: isListening ? "scale(1.2)" : isSpeaking ? "scale(1.1)" : "scale(1)" }}
          >
            {isListening ? "🎤" : isSpeaking ? "🔊" : "⚡"}
          </div>
        </div>

        {(isListening || isSpeaking) && (
          <div className="absolute inset-0 animate-spin" style={{ animationDuration: "3s" }}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
          </div>
        )}
      </div>
    </button>
  );
}
