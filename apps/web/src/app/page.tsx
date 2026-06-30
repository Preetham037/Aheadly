"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { CheckCircle2, Sparkles, Calendar, Clock, BrainCircuit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoIcon } from "@/components/LogoIcon";

export default function Home() {
  // Track the whole-page scroll — no tall wrapper needed
  const { scrollYProgress } = useScroll();

  // Text — fades out only (no scale to prevent overlap)
  const textOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const textY       = useTransform(scrollYProgress, [0, 0.15], ["0px", "-30px"]);

  // Mockup — tilted back, rises & rotates flat during first 30% of page scroll
  const mockupY       = useTransform(scrollYProgress, [0, 0.3], ["60px", "0px"]);
  const mockupScale   = useTransform(scrollYProgress, [0, 0.3], [0.82, 1.0]);
  const mockupRotateX = useTransform(scrollYProgress, [0, 0.3], [20, 0]);
  const mockupOpacity = useTransform(scrollYProgress, [0, 0.1, 0.3], [0.3, 1, 1]);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden selection:bg-primary/30">

      {/* Background glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-purple-500/10 blur-[120px]" />
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px]" />
      </div>

      {/* Nav */}
      <header className="fixed top-0 w-full z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LogoIcon className="w-8 h-8" color="#8b3dff" />
            <span className="font-bold text-xl tracking-tight text-white">Aheadly</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="#features" className="text-sm text-gray-400 hover:text-white transition-colors">Features</Link>
            <Link href="/dashboard">
              <Button className="rounded-full bg-white text-black hover:bg-gray-200 font-medium px-6">
                Go to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* ── Hero Section — exactly 100vh, no blank gap ── */}
        <section
          className="relative min-h-screen flex flex-col items-center justify-start pt-32 overflow-hidden"
          style={{ perspective: "1200px" }}
        >
          {/* Text layer */}
          <motion.div
            style={{ opacity: textOpacity, y: textY }}
            className="text-center max-w-4xl mx-auto px-6 z-20 relative"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300 mb-8 backdrop-blur-md">
              <LogoIcon className="w-4 h-4 text-purple-400" />
              <span>Aheadly AI 2.0 is now live</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-8 leading-[1.1]">
              Plan Smarter. <br className="hidden md:block" />
              <span className="text-gradient">Finish Earlier.</span>
            </h1>

            <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
              The AI-powered productivity companion that proactively helps you complete work before deadlines, instead of just reminding you about them.
            </p>

            <div className="flex items-center justify-center gap-4">
              <Link href="/chat">
                <Button size="lg" variant="outline" className="rounded-full h-14 px-8 text-lg font-medium border-white/10 hover:bg-white/5 text-white glass">
                  Talk to AI Assistant
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Dashboard mockup — 3D tilted, rises as you scroll */}
          <motion.div
            style={{
              y: mockupY,
              scale: mockupScale,
              rotateX: mockupRotateX,
              opacity: mockupOpacity,
              transformStyle: "preserve-3d",
            }}
            className="relative w-full max-w-5xl px-6 mt-16 z-10"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/20 to-purple-500/5 blur-3xl -z-10 rounded-full" />
            <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-2xl shadow-2xl overflow-hidden glow-border">
              {/* Traffic lights */}
              <div className="h-12 border-b border-white/10 flex items-center px-4 gap-2 bg-white/5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              {/* Mock content */}
              <div className="p-6 md:p-8 grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-6 w-32 bg-white/20 rounded-md" />
                    <div className="h-8 w-24 bg-white/10 rounded-full" />
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                      <span className="text-sm font-medium text-gray-400 line-through">Finish CS310 Final Project</span>
                    </div>
                    <span className="text-[10px] text-gray-500 font-medium px-2 py-1 bg-white/5 rounded-full border border-white/10">HIGH</span>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full border border-gray-500" />
                      <span className="text-sm font-medium text-white">Review Q3 Financial Report</span>
                    </div>
                    <span className="text-[10px] text-red-400 font-medium px-2 py-1 bg-red-500/10 rounded-full border border-red-500/20">URGENT</span>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full border border-gray-500" />
                      <span className="text-sm font-medium text-white">Book flight tickets for conference</span>
                    </div>
                    <span className="text-[10px] text-blue-400 font-medium px-2 py-1 bg-blue-500/10 rounded-full border border-blue-500/20">MEDIUM</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="p-5 rounded-xl bg-purple-500/5 border border-purple-500/20">
                    <div className="flex items-center gap-2 mb-3">
                      <LogoIcon className="w-4 h-4 text-purple-400" />
                      <span className="text-sm font-semibold text-white">Smart Extract</span>
                    </div>
                    <div className="h-20 w-full bg-black/40 rounded-lg border border-white/10 p-3">
                      <p className="text-xs text-gray-500">Paste an email, note, or syllabus...</p>
                    </div>
                    <div className="h-8 w-full bg-purple-600 rounded-lg mt-3 flex items-center justify-center">
                      <span className="text-xs text-white font-medium">Extract Task</span>
                    </div>
                  </div>
                  <div className="p-5 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-300">Schedule Context</span>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">You have 2 hours free before your next meeting. Good time to tackle Urgent tasks.</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── Rest of page — starts immediately after hero ── */}
        <div className="max-w-7xl mx-auto px-6">

          {/* Trusted By */}
          {/* Features */}
          <motion.div
            id="features"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mt-32"
          >
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Stop managing tasks. <br />Let AI do it.</h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">Aheadly connects to your life and tells you exactly what to work on right now, eliminating decision fatigue.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-white/[0.02]">
                <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6 border border-purple-500/20">
                  <LogoIcon className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Smart Extraction</h3>
                <p className="text-gray-400 leading-relaxed">Paste an email from your professor or a Slack message from your boss. Aheadly instantly creates the task, sets the deadline, and assigns priority.</p>
              </div>

              <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-white/[0.02]">
                <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 border border-blue-500/20">
                  <BrainCircuit className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">AI Intelligence</h3>
                <p className="text-gray-400 leading-relaxed">Chat with your tasks. Ask Aheadly &quot;What should I focus on this afternoon?&quot; and it analyzes your deadlines to give you a personalized schedule.</p>
              </div>

              <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-white/[0.02]">
                <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center mb-6 border border-green-500/20">
                  <Calendar className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Calendar Sync</h3>
                <p className="text-gray-400 leading-relaxed">Automatically finds gaps in your Google Calendar and suggests the perfect time blocks to complete your High Priority work.</p>
              </div>
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="mt-32 mb-20 p-12 md:p-20 rounded-[3rem] bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-white/10 text-center relative overflow-hidden"
          >
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to get ahead?</h2>
              <p className="text-xl text-purple-200/70 mb-10 max-w-xl mx-auto">Join thousands of high-performers who have stopped missing deadlines and started finishing early.</p>
              <Link href="/dashboard">
                <Button size="lg" className="rounded-full bg-white text-black hover:bg-gray-200 h-14 px-10 text-lg font-medium shadow-2xl">
                  Start Using Aheadly Free
                </Button>
              </Link>
            </div>
          </motion.div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-black/50 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <LogoIcon className="w-6 h-6" color="#8b3dff" />
            <span className="font-bold text-lg text-white">Aheadly</span>
          </div>
          <p className="text-sm text-gray-500">Built for VIBE2SHIP Hackathon 2026. All rights reserved.</p>
          <div className="flex gap-6 text-sm text-gray-400">
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
