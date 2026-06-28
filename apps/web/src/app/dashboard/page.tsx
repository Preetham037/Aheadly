"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles, Calendar, Plus, CheckCircle2, Circle, Clock, Flame, Trash2 } from "lucide-react";
import Link from "next/link";
import { LogoIcon } from "@/components/LogoIcon";

type Task = {
  id: string;
  title: string;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  priority: string;
  deadline?: string;
};

type ParsedTaskPreview = {
  title: string;
  deadline: string;
  estimated_duration_minutes: number;
  difficulty: string;
  priority: string;
  risk_score: number;
};

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [streakDays, setStreakDays] = useState(0);
  const [userName, setUserName] = useState("User");
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);

  // AI Parse State
  const [parseText, setParseText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [parsedPreview, setParsedPreview] = useState<ParsedTaskPreview | null>(null);

  // Enforce login and fetch tasks on mount
  useEffect(() => {
    const init = async () => {
      // 1. Check for token in URL (from Google redirect)
      const urlToken = new URLSearchParams(window.location.search).get("token");
      let activeToken = urlToken;
      
      if (activeToken) {
         localStorage.setItem("token", activeToken);
         // Clean up URL but keep google_connected for the UI check below
         const newUrl = window.location.pathname + "?google_connected=true";
         window.history.replaceState({}, document.title, newUrl);
      } else {
         activeToken = localStorage.getItem("token");
      }
      
      if (!activeToken) {
         window.location.href = "/login";
         return;
      }
      
      try {
        setToken(activeToken);
        fetchTasks(activeToken);
        fetchStats(activeToken);
        fetchUser(activeToken);

        // Check if redirected from Google OAuth
        const connected = new URLSearchParams(window.location.search).get("google_connected");
        if (connected === "true") {
          setIsGoogleConnected(true);
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } catch (e) {
        console.error("Failed to fetch user data", e);
        setLoading(false);
      }
    };
    init();
  }, []);

  const fetchTasks = async (authToken: string) => {
    try {
      const res = await fetch("http://localhost:8000/api/v1/tasks/", {
        headers: { "Authorization": `Bearer ${authToken}` }
      });
      const data = await res.json();
      setTasks(data);
    } catch (e) {
      console.error("Failed to fetch tasks", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (authToken: string) => {
    try {
      const res = await fetch("http://localhost:8000/api/v1/tasks/stats/me", {
        headers: { "Authorization": `Bearer ${authToken}` }
      });
      const data = await res.json();
      setStreakDays(data.streak_days ?? 0);
    } catch (e) {
      console.error("Failed to fetch stats", e);
    }
  };

  const fetchUser = async (authToken: string) => {
    try {
      const res = await fetch("http://localhost:8000/api/v1/auth/me", {
        headers: { "Authorization": `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (data.full_name) {
        setUserName(data.full_name);
      }
    } catch (e) {
      console.error("Failed to fetch user", e);
    }
  };

  const handleCreateTask = async (title: string, priority: string = "MEDIUM") => {
    if (!title.trim() || !token) return;
    try {
      const res = await fetch("http://localhost:8000/api/v1/tasks/", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ title, priority })
      });
      const data = await res.json();
      setTasks([...tasks, data]);
      setNewTaskTitle("");
      setParsedPreview(null);
      setParseText("");
    } catch (e) {
      console.error("Failed to create task", e);
    }
  };

  const handleParseText = async () => {
    if (!parseText.trim() || !token) return;
    setIsParsing(true);
    try {
      const res = await fetch("http://localhost:8000/api/v1/ai/parse-task", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ user_input: parseText })
      });
      const data = await res.json();
      setParsedPreview(data);
    } catch (e) {
      console.error("Failed to parse text", e);
    } finally {
      setIsParsing(false);
    }
  };

  const toggleTaskComplete = async (task: Task) => {
    if (!token) return;
    const newStatus = task.status === "DONE" ? "TODO" : "DONE";
    setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    try {
      await fetch(`http://localhost:8000/api/v1/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      // Refresh streak after toggling
      fetchStats(token);
    } catch (e) {
      console.error("Failed to update task", e);
      setTasks(tasks.map(t => t.id === task.id ? { ...t, status: task.status } : t));
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!token) return;
    setTasks(tasks.filter(t => t.id !== taskId));
    try {
      await fetch(`http://localhost:8000/api/v1/tasks/${taskId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      fetchStats(token);
    } catch (e) {
      console.error("Failed to delete task", e);
      fetchTasks(token); // refetch if failed
    }
  };

  const completedCount = tasks.filter(t => t.status === "DONE").length;
  const pendingCount = tasks.length - completedCount;
  const score = tasks.length === 0 ? 0 : Math.round((completedCount / tasks.length) * 100);

  // Also refresh streak whenever a task is toggled
  const refreshStats = async () => {
    if (token) await fetchStats(token);
  };

  // Framer Motion variants
  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
          <LogoIcon className="w-8 h-8 text-primary" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 relative">
      {/* Background Mesh */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[10%] left-[20%] w-[30%] h-[30%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute top-[50%] right-[10%] w-[40%] h-[40%] rounded-full bg-accent/5 blur-[120px]" />
      </div>

      <header className="sticky top-0 w-full z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <LogoIcon className="w-8 h-8" color="#8b3dff" />
            <span className="font-bold text-xl tracking-tight text-white">Aheadly</span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="px-3 py-1 rounded-full bg-white/10 text-xs font-medium border border-white/10 flex items-center gap-2">
              <Flame className="w-3 h-3 text-orange-400" />
              <span>Streak: {streakDays} {streakDays === 1 ? 'Day' : 'Days'}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-white">{userName}</span>
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 border-2 border-background flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-purple-500/20">
                {userName.charAt(0)}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 p-6 md:p-10 max-w-7xl mx-auto space-y-8">
        
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Welcome back.</h1>
            <p className="text-gray-400 text-lg">Here's your productivity overview for today.</p>
          </div>
          <Link href="/chat">
             <Button className="bg-white text-black hover:bg-gray-200 rounded-full h-12 px-6 shadow-lg shadow-white/10 font-medium group">
               <LogoIcon className="w-4 h-4 mr-2 text-purple-600 group-hover:scale-110 transition-transform" />
               Talk to AI Assistant
             </Button>
          </Link>
        </motion.div>

        <motion.div variants={container} initial="hidden" animate="show" className="grid gap-6 md:grid-cols-3">
          
          {/* Metrics Row */}
          <motion.div variants={item} className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Card className="glass-panel border-white/5 bg-white/[0.01]">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-400 mb-1">Productivity Score</p>
                    <div className="text-4xl font-bold text-white flex items-baseline gap-2">
                      {score}<span className="text-xl text-gray-500">%</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
                    <CheckCircle2 className="w-6 h-6 text-green-400" />
                  </div>
                </div>
                <div className="mt-4 w-full bg-white/5 rounded-full h-2 overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-green-400 to-emerald-500" 
                    initial={{ width: 0 }} 
                    animate={{ width: `${score}%` }} 
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="glass-panel border-white/5 bg-white/[0.01]">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-400 mb-1">Active Tasks</p>
                    <div className="text-4xl font-bold text-white">{pendingCount}</div>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                    <Clock className="w-6 h-6 text-blue-400" />
                  </div>
                </div>
                <p className="mt-4 text-sm text-gray-400"><span className="text-white font-medium">{completedCount}</span> completed today</p>
              </CardContent>
            </Card>

            {/* Smart Add Bento Box */}
            <Card className="glass-panel border-purple-500/20 bg-purple-500/[0.02] relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardContent className="p-6 relative z-10 h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <LogoIcon className="w-5 h-5 text-purple-400" />
                    <h3 className="font-semibold text-white">Smart Extract</h3>
                  </div>
                  <p className="text-sm text-purple-200/60 leading-relaxed mb-4">Paste an email, note, or syllabus. We'll automatically build the task and deadline.</p>
                </div>
                <div className="relative">
                  <textarea 
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all resize-none h-[80px]"
                    placeholder="e.g. Call mom tomorrow at 5pm..."
                    value={parseText}
                    onChange={(e) => setParseText(e.target.value)}
                  />
                  <Button 
                    size="sm"
                    className="absolute bottom-2 right-2 rounded-lg bg-white text-black hover:bg-gray-200"
                    onClick={handleParseText}
                    disabled={isParsing || !parseText.trim()}
                  >
                    {isParsing ? "Extracting..." : "Parse"}
                  </Button>
                </div>

                {parsedPreview && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-3 bg-white/5 border border-white/10 rounded-xl space-y-2 text-sm backdrop-blur-md">
                    <div className="flex items-start justify-between gap-2">
                       <p className="font-medium text-white line-clamp-2">{parsedPreview.title}</p>
                       <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                         parsedPreview.priority === 'HIGH' || parsedPreview.priority === 'URGENT' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                       }`}>{parsedPreview.priority}</span>
                    </div>
                    {parsedPreview.deadline && (
                       <p className="text-gray-400 text-xs flex items-center gap-1"><Calendar className="w-3 h-3"/> {parsedPreview.deadline}</p>
                    )}
                    <Button size="sm" className="w-full mt-2 bg-purple-600 hover:bg-purple-700 text-white border-none" onClick={() => handleCreateTask(parsedPreview.title, parsedPreview.priority)}>
                      Confirm & Save
                    </Button>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Task List Section */}
          <motion.div variants={item} className="md:col-span-2">
            <Card className="glass-panel border-white/5 bg-white/[0.01] h-full">
              <CardHeader className="border-b border-white/5 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">Your Tasks</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-4 border-b border-white/5 bg-black/20">
                  <div className="flex gap-3">
                    <input 
                      type="text" 
                      placeholder="Add a new task manually..." 
                      className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-white/20 transition-colors"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateTask(newTaskTitle)}
                    />
                    <Button onClick={() => handleCreateTask(newTaskTitle)} className="rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/5">
                      <Plus className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                <div className="max-h-[500px] overflow-y-auto p-2">
                  {tasks.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                      <p>You're all caught up! Enjoy your free time.</p>
                    </div>
                  )}
                  {tasks.map((task, idx) => (
                    <motion.div 
                      key={task.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group flex items-center justify-between p-3 my-1 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all cursor-pointer"
                      onClick={() => toggleTaskComplete(task)}
                    >
                      <div className="flex items-center gap-4">
                        <button className="flex-shrink-0 text-gray-500 hover:text-green-400 transition-colors focus:outline-none">
                          {task.status === "DONE" ? (
                            <CheckCircle2 className="w-5 h-5 text-green-400" />
                          ) : (
                            <Circle className="w-5 h-5" />
                          )}
                        </button>
                        <span className={`text-sm ${task.status === "DONE" ? 'line-through text-gray-500' : 'font-medium text-gray-200'}`}>
                          {task.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full border ${
                          task.priority === 'HIGH' || task.priority === 'URGENT' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-white/5 text-gray-400 border-white/10'
                        }`}>
                          {task.priority}
                        </span>
                        <Link href={`/chat?schedule=${encodeURIComponent(task.title)}`} onClick={(e) => e.stopPropagation()}>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-gray-400 hover:text-white hover:bg-purple-500/20 rounded-full">
                            <Calendar className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-gray-400 hover:text-red-400 hover:bg-red-500/20 rounded-full" onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Contextual Side Panel */}
          <motion.div variants={item} className="md:col-span-1 space-y-6">
            <Card className="glass-panel border-white/5 bg-white/[0.01]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-400">
                  <Calendar className="w-4 h-4" /> Schedule Context
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                   <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-sm">
                     <div className="flex items-center gap-2 mb-2">
                       <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" alt="Google Calendar" className="w-5 h-5" />
                       <p className="text-purple-200 font-medium">Google Calendar</p>
                     </div>
                     <p className="text-purple-200/70 text-xs mb-3">Sync your calendar to let the AI agent schedule tasks automatically.</p>
                     
                     {isGoogleConnected ? (
                       <div className="w-full py-2 bg-green-500/20 border border-green-500/30 rounded-md flex items-center justify-center gap-2 text-green-400 font-medium">
                         <CheckCircle2 className="w-4 h-4" />
                         Connected
                       </div>
                     ) : (
                       <Button 
                         size="sm"
                         className="w-full bg-purple-600 hover:bg-purple-700 text-white" 
                         onClick={async () => {
                           if (!token) return;
                           try {
                             const res = await fetch("http://localhost:8000/api/v1/auth/google/login", {
                               headers: { "Authorization": `Bearer ${token}` }
                             });
                             const data = await res.json();
                             if (data.authorization_url) {
                               window.location.href = data.authorization_url;
                             }
                           } catch (e) {
                             console.error("Failed to initiate Google Login", e);
                           }
                         }}
                       >
                         Connect Calendar
                       </Button>
                     )}
                   </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

        </motion.div>
      </main>
    </div>
  )
}
