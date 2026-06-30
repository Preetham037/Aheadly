"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, StickyNote, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { LogoIcon } from "@/components/LogoIcon";

type Note = {
  id: string;
  title: string;
  content: string;
  created_at: string;
};

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    let activeToken = localStorage.getItem("token");
    if (!activeToken) {
      activeToken = "demo-token";
    }
    setToken(activeToken);
    fetchNotes(activeToken);
  }, []);

  const fetchNotes = async (authToken: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/v1/notes/`, {
        headers: { "Authorization": `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
      }
    } catch (e) {
      console.error("Failed to fetch notes", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async () => {
    if (!title.trim() || !token) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/v1/notes/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ title, content })
      });
      if (res.ok) {
        const newNote = await res.json();
        setNotes([newNote, ...notes]);
        setTitle("");
        setContent("");
      }
    } catch (e) {
      console.error("Failed to create note", e);
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      await fetch(`${apiUrl}/api/v1/notes/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      setNotes(notes.filter(n => n.id !== id));
    } catch (e) {
      console.error("Failed to delete note", e);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <header className="flex justify-between items-center mb-8 max-w-6xl mx-auto">
        <Link href="/dashboard" className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors">
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </Link>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <LogoIcon />
            <span className="font-bold text-xl">Aheadly Notes</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <StickyNote className="w-5 h-5 text-purple-400" />
                New Note
              </CardTitle>
              <CardDescription className="text-gray-400">Jot down ideas, goals, or context for the AI.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <input 
                type="text"
                placeholder="Note Title"
                className="w-full bg-black/50 border border-gray-800 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
              <textarea 
                placeholder="Write your thoughts here..."
                rows={6}
                className="w-full bg-black/50 border border-gray-800 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
                value={content}
                onChange={e => setContent(e.target.value)}
              />
              <Button 
                onClick={handleCreateNote}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium"
              >
                Save Note
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          {loading ? (
            <div className="flex justify-center p-12 text-gray-400">Loading notes...</div>
          ) : notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-gray-500 border border-dashed border-gray-800 rounded-2xl h-full">
              <StickyNote className="w-12 h-12 mb-4 opacity-50" />
              <p>No notes yet.</p>
              <p className="text-sm">Create your first note to give the AI more context!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {notes.map((note, index) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="bg-gray-900/50 border-gray-800 h-full hover:bg-gray-800/50 transition-colors group">
                    <CardHeader className="flex flex-row justify-between items-start pb-2">
                      <CardTitle className="text-white text-lg">{note.title}</CardTitle>
                      <button 
                        onClick={() => handleDeleteNote(note.id)}
                        className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-400 text-sm whitespace-pre-wrap">{note.content}</p>
                      <p className="text-xs text-gray-600 mt-4">
                        {new Date(note.created_at).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
