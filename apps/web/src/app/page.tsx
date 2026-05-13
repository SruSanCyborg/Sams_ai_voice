"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Globe, Zap, Users, Copy, Check, ArrowRight } from "lucide-react";

export default function LobbyPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [createdRoomId, setCreatedRoomId] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  function generateRoomId() {
    return Math.random().toString(36).slice(2, 8).toUpperCase();
  }

  function handleCreate() {
    if (!name.trim()) return;
    const id = generateRoomId();
    setCreatedRoomId(id);
    setMode("create");
  }

  async function handleEnter() {
    if (!name.trim() || !createdRoomId) return;
    setLoading(true);
    router.push(`/room/${createdRoomId}?name=${encodeURIComponent(name.trim())}`);
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !roomId.trim()) return;
    setLoading(true);
    router.push(`/room/${roomId.trim().toUpperCase()}?name=${encodeURIComponent(name.trim())}`);
  }

  function copyLink() {
    const url = `${window.location.origin}/room/${createdRoomId}?name=Guest`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <main className="min-h-screen bg-space-900 flex flex-col items-center justify-center px-4">
      {/* Background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse-slow [animation-delay:1.5s]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-400 rounded-full animate-pulse" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-white tracking-tight">ECHO-3D</h1>
              <p className="text-xs text-cyan-400 font-medium">Immersive Spatial Voice</p>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {[
              { icon: Zap, label: "<20ms latency" },
              { icon: Users, label: "Multi-party" },
              { icon: Mic, label: "HRTF spatial" },
            ].map(({ icon: Icon, label }) => (
              <span key={label} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300">
                <Icon className="w-3 h-3 text-violet-400" />{label}
              </span>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* ── Step 1: Name + Choose ─────────────────────────────────── */}
          {mode === "choose" && (
            <motion.div key="choose" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="glass rounded-2xl p-6 space-y-5">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Your Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name..."
                  onKeyDown={(e) => e.key === "Enter" && name.trim() && setMode("join")}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition"
                />
              </div>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  onClick={handleCreate}
                  disabled={!name.trim()}
                  className="py-3 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-white font-semibold hover:from-violet-500 hover:to-violet-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.97]"
                >
                  Create Room
                </button>
                <button
                  onClick={() => name.trim() && setMode("join")}
                  disabled={!name.trim()}
                  className="py-3 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/15 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.97]"
                >
                  Join Room
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Step 2a: Created room — share code ────────────────────── */}
          {mode === "create" && (
            <motion.div key="create" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="glass rounded-2xl p-6 space-y-5">
              <div className="text-center">
                <p className="text-sm text-slate-400 mb-3">Your room code</p>
                <div className="text-4xl font-bold tracking-[0.3em] text-white font-mono mb-4">
                  {createdRoomId}
                </div>
                <button
                  onClick={copyLink}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-300 hover:bg-white/10 transition"
                >
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Link copied!" : "Copy invite link"}
                </button>
              </div>

              <p className="text-xs text-center text-slate-500">
                Share this code with friends. You'll be the host.
              </p>

              <button
                onClick={handleEnter}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 text-white font-semibold hover:from-violet-500 hover:to-cyan-500 disabled:opacity-40 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {loading ? "Entering..." : (<>Enter Room <ArrowRight className="w-4 h-4" /></>)}
              </button>

              <button onClick={() => setMode("choose")} className="w-full text-xs text-slate-500 hover:text-slate-400 transition">
                ← Back
              </button>
            </motion.div>
          )}

          {/* ── Step 2b: Join with code ────────────────────────────────── */}
          {mode === "join" && (
            <motion.div key="join" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
              <form onSubmit={handleJoin} className="glass rounded-2xl p-6 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Room Code</label>
                  <input
                    type="text"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                    placeholder="e.g. AB12CD"
                    maxLength={8}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-center text-xl font-mono tracking-widest placeholder-slate-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition uppercase"
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !roomId.trim() || !name.trim()}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 text-white font-semibold hover:from-violet-500 hover:to-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                >
                  {loading ? "Joining..." : "Join Room →"}
                </button>
                <button type="button" onClick={() => setMode("choose")} className="w-full text-xs text-slate-500 hover:text-slate-400 transition">
                  ← Back
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-xs text-slate-600 mt-4">
          Wear headphones for the full 3D spatial audio experience
        </p>
      </div>
    </main>
  );
}
