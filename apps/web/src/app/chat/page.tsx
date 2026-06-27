"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, User, ArrowLeft, Mic, X, Check, Pencil } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogoIcon } from "@/components/LogoIcon";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type VoiceState = "idle" | "listening" | "preview";

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

// ── Frequency Bar Visualizer ──────────────────────────────────────────────────
function FrequencyVisualizer({ analyserNode }: { analyserNode: AnalyserNode | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyserNode) return;

    const ctx = canvas.getContext("2d")!;
    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const NUM_BARS = 28;
    const GAP = 3;

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      analyserNode.getByteFrequencyData(dataArray);

      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      const barWidth = (W - GAP * (NUM_BARS - 1)) / NUM_BARS;
      const step = Math.floor(bufferLength / NUM_BARS);

      for (let i = 0; i < NUM_BARS; i++) {
        const value = dataArray[i * step] / 255;
        const barH = Math.max(4, value * H);
        const x = i * (barWidth + GAP);
        const y = (H - barH) / 2;

        // Electric purple → cyan gradient per bar
        const gradient = ctx.createLinearGradient(x, y, x, y + barH);
        gradient.addColorStop(0, `rgba(139, 61, 255, ${0.4 + value * 0.6})`);
        gradient.addColorStop(0.5, `rgba(168, 85, 247, ${0.6 + value * 0.4})`);
        gradient.addColorStop(1, `rgba(99, 179, 237, ${0.4 + value * 0.6})`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barH, barWidth / 2);
        ctx.fill();
      }
    };

    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [analyserNode]);

  // idle animation when no analyser yet
  if (!analyserNode) {
    return (
      <div className="flex items-center justify-center gap-1 h-12">
        {Array.from({ length: 28 }).map((_, i) => (
          <motion.div
            key={i}
            className="w-1 rounded-full bg-purple-500/40"
            animate={{ height: ["4px", `${8 + Math.random() * 12}px`, "4px"] }}
            transition={{ repeat: Infinity, duration: 0.8 + Math.random() * 0.6, delay: i * 0.04 }}
          />
        ))}
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      width={320}
      height={48}
      className="w-full max-w-xs"
    />
  );
}
// ─────────────────────────────────────────────────────────────────────────────

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([{
    id: "1",
    role: "assistant",
    content: "Hi! I'm your Aheadly AI assistant. I've reviewed your schedule and tasks. How can I help you plan your week? Tap the mic to speak to me!"
  }]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  // Voice state machine
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const editRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/v1/auth/demo-login", { method: "POST" });
        const data = await res.json();
        setToken(data.access_token);
      } catch (e) { console.error(e); }
    };
    init();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Auto-schedule from dashboard
  useEffect(() => {
    if (!token) return;
    const scheduleTask = new URLSearchParams(window.location.search).get("schedule");
    if (!scheduleTask) return;
    window.history.replaceState({}, document.title, window.location.pathname);
    const msg = `Can you find some free time on my calendar today and schedule my task: "${scheduleTask}"?`;
    sendMessage(msg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        body: JSON.stringify({ query: text })
      });
      if (!res.ok) {
        throw new Error("Failed to communicate with AI");
      }
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

  // Stop microphone stream + audio context
  const stopAudio = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    audioContextRef.current?.close();
    streamRef.current = null;
    audioContextRef.current = null;
    setAnalyserNode(null);
  };

  // Start voice recording
  const startVoice = async () => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      alert("Voice recognition requires Chrome or Edge.");
      return;
    }

    try {
      // Set up Web Audio API visualizer
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const audioCtx = new AudioContext();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      audioCtx.createMediaStreamSource(stream).connect(analyser);
      setAnalyserNode(analyser);

      // Set up Speech Recognition
      const recognition = new SpeechRecognitionAPI();
      recognition.lang = "en-US";
      recognition.interimResults = true;
      recognition.continuous = false;
      recognitionRef.current = recognition;

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results).map(r => r[0].transcript).join("");
        setVoiceTranscript(transcript);
      };

      recognition.onend = () => {
        stopAudio();
        setVoiceState("preview");
        setIsEditing(false);
      };

      recognition.onerror = () => {
        stopAudio();
        setVoiceState("idle");
      };

      setVoiceTranscript("");
      setVoiceState("listening");
      recognition.start();
    } catch {
      alert("Microphone access was denied.");
    }
  };

  const cancelVoice = () => {
    recognitionRef.current?.stop();
    stopAudio();
    setVoiceTranscript("");
    setVoiceState("idle");
    setIsEditing(false);
  };

  const confirmVoice = async () => {
    const text = voiceTranscript.trim();
    setVoiceState("idle");
    setVoiceTranscript("");
    setIsEditing(false);
    if (text) await sendMessage(text);
  };

  useEffect(() => {
    if (isEditing && editRef.current) {
      editRef.current.focus();
      editRef.current.setSelectionRange(voiceTranscript.length, voiceTranscript.length);
    }
  }, [isEditing, voiceTranscript]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center">

      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[30%] right-[20%] w-[40%] h-[40%] rounded-full bg-purple-500/5 blur-[120px]" />
      </div>

      {/* Header */}
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

      {/* Messages */}
      <main className="flex-1 w-full max-w-4xl mx-auto p-4 flex flex-col relative z-10">
        <div className="flex-1 overflow-y-auto space-y-6 pb-40 pt-6 no-scrollbar">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex gap-4 max-w-[85%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : ""}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ${
                  msg.role === "user"
                    ? "bg-gradient-to-br from-gray-700 to-gray-900 border border-white/10"
                    : "bg-white/5 border border-purple-500/50"
                }`}>
                  {msg.role === "user" ? <User className="w-4 h-4 text-white" /> : <LogoIcon className="w-4 h-4" color="#8b3dff" />}
                </div>
                <div className={`px-5 py-3.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-white/10 text-white border border-white/5 backdrop-blur-md rounded-tr-sm"
                    : "glass-panel text-gray-200 border-white/5 rounded-tl-sm shadow-[0_4px_24px_-8px_rgba(147,51,234,0.15)]"
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

        {/* ── Input Zone ── */}
        <div className="fixed bottom-0 left-0 w-full bg-gradient-to-t from-background via-background/95 to-transparent pt-10 pb-6 px-4 z-20">
          <div className="max-w-4xl mx-auto">

            {/* ── VOICE LISTENING STATE ── */}
            <AnimatePresence>
              {voiceState === "listening" && (
                <motion.div
                  key="listening"
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="mb-4 relative rounded-3xl overflow-hidden border border-purple-500/30 bg-black/60 backdrop-blur-2xl shadow-[0_0_40px_-10px_rgba(139,61,255,0.4)]"
                >
                  {/* Animated top glow strip */}
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-80" />

                  <div className="px-6 pt-5 pb-4 flex flex-col items-center gap-4">
                    {/* Pulsing mic icon */}
                    <motion.div
                      animate={{ scale: [1, 1.12, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                      className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-[0_0_24px_rgba(139,61,255,0.6)]"
                    >
                      <Mic className="w-5 h-5 text-white" />
                    </motion.div>

                    <p className="text-xs font-semibold tracking-widest uppercase text-purple-400">Listening…</p>

                    {/* Real-time frequency visualizer */}
                    <div className="w-full flex justify-center py-1">
                      <FrequencyVisualizer analyserNode={analyserNode} />
                    </div>

                    {/* Live interim transcript */}
                    {voiceTranscript && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-sm text-gray-300 text-center max-w-xs leading-relaxed"
                      >
                        &ldquo;{voiceTranscript}&rdquo;
                      </motion.p>
                    )}

                    {/* Cancel button */}
                    <button
                      onClick={cancelVoice}
                      className="mt-1 flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-400 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" /> Cancel
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── VOICE PREVIEW / EDIT STATE ── */}
              {voiceState === "preview" && (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="mb-4 relative rounded-3xl overflow-hidden border border-white/10 bg-black/60 backdrop-blur-2xl shadow-xl"
                >
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400/60 to-transparent" />

                  <div className="px-5 pt-4 pb-4 space-y-3">
                    {/* Label row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.8)]" />
                        <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Voice Captured</span>
                      </div>
                      {/* Edit toggle button */}
                      <button
                        onClick={() => setIsEditing(!isEditing)}
                        className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border transition-all ${
                          isEditing
                            ? "border-purple-500/50 bg-purple-500/10 text-purple-300"
                            : "border-white/10 bg-white/5 text-gray-400 hover:text-white hover:border-white/20"
                        }`}
                      >
                        <Pencil className="w-3 h-3" />
                        {isEditing ? "Editing" : "Edit"}
                      </button>
                    </div>

                    {/* Text display / editor */}
                    {isEditing ? (
                      <textarea
                        ref={editRef}
                        value={voiceTranscript}
                        onChange={e => setVoiceTranscript(e.target.value)}
                        rows={3}
                        className="w-full bg-white/5 border border-purple-500/30 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/40 resize-none transition-all leading-relaxed"
                      />
                    ) : (
                      <p className="text-sm text-white leading-relaxed px-1">
                        &ldquo;{voiceTranscript}&rdquo;
                      </p>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2 justify-end pt-1">
                      <button
                        onClick={cancelVoice}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white hover:bg-white/5 border border-white/5 transition-all"
                      >
                        <X className="w-3.5 h-3.5" /> Discard
                      </button>
                      <button
                        onClick={confirmVoice}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-[0_0_20px_rgba(139,61,255,0.3)] transition-all"
                      >
                        <Check className="w-3.5 h-3.5" /> Send
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── NORMAL TEXT INPUT (only when not in voice mode) ── */}
            {voiceState === "idle" && (
              <form onSubmit={handleSubmit} className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
                <div className="relative flex items-center bg-black/40 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl focus-within:border-purple-500/50 focus-within:ring-1 focus-within:ring-purple-500/50 transition-all">
                  <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Ask Aheadly to plan your week..."
                    className="flex-1 bg-transparent px-6 py-4 text-sm text-white placeholder:text-gray-500 focus:outline-none"
                    disabled={!token || isLoading}
                  />
                  <div className="flex items-center gap-2 pr-3">
                    {/* Mic button — right side */}
                    <motion.button
                      type="button"
                      onClick={startVoice}
                      whileTap={{ scale: 0.9 }}
                      className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 border border-transparent hover:border-purple-500/20 transition-all"
                      title="Speak to Aheadly"
                    >
                      <Mic className="w-4 h-4" />
                    </motion.button>
                    {/* Send button */}
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
            )}

            <p className="text-center text-[10px] text-gray-600 mt-3 font-mono">
              Aheadly AI can make mistakes. Verify important deadlines.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
