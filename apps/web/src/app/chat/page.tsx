"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, User, ArrowLeft, Mic, MicOff } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogoIcon } from "@/components/LogoIcon";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

// Extend Window type to support SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([{
    id: "1",
    role: "assistant",
    content: "Hi! I'm your Aheadly AI assistant. I've reviewed your schedule and tasks. How can I help you plan your week? You can also use the 🎤 mic button to speak to me!"
  }]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/v1/auth/demo-login", { method: "POST" });
        const data = await res.json();
        setToken(data.access_token);
      } catch (e) {
        console.error("Failed to fetch demo token", e);
      }
    };
    init();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Auto-schedule trigger from dashboard calendar button
  useEffect(() => {
    if (token) {
      const searchParams = new URLSearchParams(window.location.search);
      const scheduleTask = searchParams.get('schedule');
      if (scheduleTask) {
        window.history.replaceState({}, document.title, window.location.pathname);
        const autoPrompt = `Can you find some free time on my calendar today and schedule my task: "${scheduleTask}"?`;
        const userMsg: Message = { id: Date.now().toString(), role: "user", content: autoPrompt };
        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);
        fetch("http://localhost:8000/api/v1/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify({ message: userMsg.content })
        }).then(res => res.json()).then(data => {
          setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", content: data.response }]);
        }).catch(console.error).finally(() => setIsLoading(false));
      }
    }
  }, [token]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || !token) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/v1/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ message: text })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", content: data.response }]);
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(), role: "assistant",
        content: "Sorry, I ran into a network error. Please try again."
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMessage(input);
  };

  // Voice recognition
  const toggleVoice = () => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      alert("Voice recognition is not supported in this browser. Try Chrome.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(r => r[0].transcript)
        .join("");
      setInput(transcript);
    };

    recognition.onend = async () => {
      setIsListening(false);
      // Auto-send after voice input completes
      const finalInput = input;
      if (finalInput.trim()) {
        await sendMessage(finalInput);
      }
    };

    recognition.onerror = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center">
      
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[30%] right-[20%] w-[40%] h-[40%] rounded-full bg-purple-500/5 blur-[120px]" />
      </div>

      <header className="w-full z-10 glass border-b border-white/5 sticky top-0">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back to Dashboard</span>
          </Link>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-purple-300 font-medium">
            <LogoIcon className="w-3.5 h-3.5" color="#8b3dff" />
            Aheadly Intelligence
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto p-4 flex flex-col relative z-10">
        <div className="flex-1 overflow-y-auto space-y-6 pb-32 pt-6 no-scrollbar">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ${
                  msg.role === 'user' ? 'bg-gradient-to-br from-gray-700 to-gray-900 border border-white/10' : 'bg-white/5 border border-purple-500/50'
                }`}>
                  {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <LogoIcon className="w-4 h-4" color="#8b3dff" />}
                </div>
                <div className={`px-5 py-3.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-white/10 text-white border border-white/5 backdrop-blur-md rounded-tr-sm'
                    : 'glass-panel text-gray-200 border-white/5 rounded-tl-sm shadow-[0_4px_24px_-8px_rgba(147,51,234,0.15)]'
                }`}>
                  {msg.content}
                </div>
              </motion.div>
            ))}

            {isLoading && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-4 max-w-[85%]">
                <div className="w-8 h-8 rounded-full bg-white/5 border border-purple-500/50 flex items-center justify-center flex-shrink-0">
                  <LogoIcon className="w-4 h-4 animate-pulse" color="#8b3dff" />
                </div>
                <div className="px-5 py-3.5 rounded-2xl bg-white/5 border border-white/5 text-gray-400 text-sm flex gap-1 items-center rounded-tl-sm backdrop-blur-md">
                  <motion.div className="w-1.5 h-1.5 bg-gray-500 rounded-full" animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} />
                  <motion.div className="w-1.5 h-1.5 bg-gray-500 rounded-full" animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} />
                  <motion.div className="w-1.5 h-1.5 bg-gray-500 rounded-full" animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Input bar with Voice Button */}
        <div className="fixed bottom-0 left-0 w-full bg-gradient-to-t from-background via-background/90 to-transparent pt-10 pb-6 px-4 z-20">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSubmit} className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
              <div className="relative flex items-center bg-black/40 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl focus-within:border-purple-500/50 focus-within:ring-1 focus-within:ring-purple-500/50 transition-all">
                
                {/* Mic button */}
                <button
                  type="button"
                  onClick={toggleVoice}
                  className={`ml-3 w-9 h-9 flex items-center justify-center rounded-xl transition-all ${
                    isListening
                      ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
                      : 'text-gray-500 hover:text-purple-400 hover:bg-purple-500/10'
                  }`}
                  title={isListening ? "Stop listening" : "Speak to Aheadly"}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={isListening ? "Listening... speak now 🎤" : "Ask Aheadly to plan your week..."}
                  className="flex-1 bg-transparent px-4 py-4 text-sm text-white placeholder:text-gray-500 focus:outline-none"
                  disabled={!token || isLoading}
                />
                <div className="pr-2">
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!input.trim() || !token || isLoading}
                    className="w-10 h-10 rounded-xl bg-white text-black hover:bg-gray-200 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </form>
            <p className="text-center text-[10px] text-gray-600 mt-3 font-mono">Aheadly AI can make mistakes. Verify important deadlines.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
