"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mic, Globe, Zap, Users } from "lucide-react";

export default function LobbyPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    const id = roomId.trim() || crypto.randomUUID().slice(0, 8);
    router.push(`/room/${id}?name=${encodeURIComponent(name.trim())}`);
  }

  return (
    <main className="min-h-screen bg-space-900 flex flex-col items-center justify-center px-4">
      {/* Animated background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse-slow [animation-delay:1.5s]" />
        <div className="absolute top-3/4 left-1/3 w-64 h-64 bg-violet-500/5 rounded-full blur-2xl animate-spin-slow" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="inline-flex items-center gap-3 mb-4"
          >
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
          </motion.div>
          <p className="text-slate-400 text-sm max-w-xs mx-auto">
            AI-powered binaural voice calls where each voice lives in real 3D space
          </p>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {[
            { icon: Zap, label: "<20ms latency" },
            { icon: Users, label: "Multi-party" },
            { icon: Mic, label: "Noise-free AI" },
          ].map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300"
            >
              <Icon className="w-3 h-3 text-violet-400" />
              {label}
            </span>
          ))}
        </div>

        {/* Join form */}
        <form onSubmit={handleJoin} className="glass rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Your Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name..."
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Room ID{" "}
              <span className="text-slate-600">(leave blank to create new)</span>
            </label>
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="e.g. abc12345"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 text-white font-semibold hover:from-violet-500 hover:to-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98]"
          >
            {loading ? "Joining..." : "Enter Spatial Room →"}
          </button>
        </form>

        <p className="text-center text-xs text-slate-600 mt-4">
          Wear headphones for the full 3D spatial audio experience
        </p>
      </motion.div>
    </main>
  );
}
