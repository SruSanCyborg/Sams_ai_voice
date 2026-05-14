"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, ArrowRight, Moon, Sun } from "lucide-react";

// ── Theme toggle ─────────────────────────────────────────────────────────────
function useTheme() {
  const [dark, setDark] = useState(true);
  useEffect(() => {
    const stored = localStorage.getItem("echo-theme");
    const isDark = stored !== "light";
    setDark(isDark);
    document.documentElement.classList.toggle("light", !isDark);
  }, []);
  function toggle() {
    setDark((d) => {
      const next = !d;
      document.documentElement.classList.toggle("light", !next);
      localStorage.setItem("echo-theme", next ? "dark" : "light");
      return next;
    });
  }
  return { dark, toggle };
}

// ── SVG Doodles ───────────────────────────────────────────────────────────────

// Spatial audio sonar rings
function SonarDoodle() {
  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      {/* Sonar rings */}
      <span className="absolute inset-0 rounded-full border-2 border-violet-400/40 animate-sonar" />
      <span className="absolute inset-0 rounded-full border-2 border-violet-400/30 animate-sonar-d1" />
      <span className="absolute inset-0 rounded-full border-2 border-violet-400/20 animate-sonar-d2" />
      {/* Center orb */}
      <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
          <line x1="12" y1="19" x2="12" y2="23"/>
          <line x1="8" y1="23" x2="16" y2="23"/>
        </svg>
      </div>
    </div>
  );
}

// Waveform SVG doodle (animated draw)
function WaveformDoodle({ className }: { className?: string }) {
  return (
    <svg className={className} width="180" height="48" viewBox="0 0 180 48" fill="none">
      {[
        "M0 24 Q 22 8, 45 24 Q 68 40, 90 24 Q 112 8, 135 24 Q 158 40, 180 24",
        "M0 24 Q 22 14, 45 24 Q 68 34, 90 24 Q 112 14, 135 24 Q 158 34, 180 24",
        "M0 24 Q 22 4, 45 24 Q 68 44, 90 24 Q 112 4, 135 24 Q 158 44, 180 24",
      ].map((d, i) => (
        <motion.path
          key={i}
          d={d}
          stroke="currentColor"
          strokeWidth={2 - i * 0.4}
          strokeLinecap="round"
          fill="none"
          opacity={0.8 - i * 0.25}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2 + i * 0.2, ease: "easeOut", delay: 0.3 + i * 0.15 }}
        />
      ))}
    </svg>
  );
}

// Connection nodes doodle (people connected in space)
function ConnectionDoodle({ className }: { className?: string }) {
  const nodes = [
    { x: 20, y: 20 }, { x: 80, y: 10 }, { x: 140, y: 25 },
    { x: 50, y: 60 }, { x: 110, y: 55 }, { x: 30, y: 90 }, { x: 160, y: 80 },
  ];
  const edges = [[0,1],[1,2],[0,3],[1,4],[2,4],[3,5],[4,6],[2,6]];

  return (
    <svg className={className} width="180" height="110" viewBox="0 0 180 110" fill="none">
      {edges.map(([a, b], i) => (
        <motion.line
          key={i}
          x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y}
          stroke="currentColor" strokeWidth="1" opacity={0.25}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.25 }}
          transition={{ duration: 0.5, delay: 0.5 + i * 0.08 }}
        />
      ))}
      {nodes.map((n, i) => (
        <motion.circle
          key={i}
          cx={n.x} cy={n.y} r={i === 0 ? 5 : 3.5}
          fill="currentColor"
          opacity={i === 0 ? 0.9 : 0.5}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: i === 0 ? 0.9 : 0.5 }}
          transition={{ type: "spring", stiffness: 300, delay: 0.2 + i * 0.07 }}
        />
      ))}
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function LobbyPage() {
  const router = useRouter();
  const { dark, toggle } = useTheme();
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [createdRoomId, setCreatedRoomId] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.body.classList.add("lobby");
    return () => document.body.classList.remove("lobby");
  }, []);

  function generateRoomId() {
    return Math.random().toString(36).slice(2, 8).toUpperCase();
  }

  function handleCreate() {
    if (!name.trim()) return;
    setCreatedRoomId(generateRoomId());
    setMode("create");
  }

  function handleEnter() {
    if (!name.trim() || !createdRoomId) return;
    setLoading(true);
    router.push(`/room/${createdRoomId}?name=${encodeURIComponent(name.trim())}`);
  }

  function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !roomId.trim()) return;
    setLoading(true);
    router.push(`/room/${roomId.trim().toUpperCase()}?name=${encodeURIComponent(name.trim())}`);
  }

  function copyLink() {
    navigator.clipboard.writeText(`${window.location.origin}/room/${createdRoomId}?name=Guest`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const spring = { type: "spring" as const, stiffness: 320, damping: 28 };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{ background: "var(--bg)" }}>

      {/* Animated background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[15%] left-[10%] w-[500px] h-[500px] rounded-full opacity-[0.07] animate-pulse-slow"
          style={{ background: "radial-gradient(circle, #7c3aed, transparent 70%)" }} />
        <div className="absolute bottom-[10%] right-[8%] w-[400px] h-[400px] rounded-full opacity-[0.06] animate-pulse-slow [animation-delay:1.5s]"
          style={{ background: "radial-gradient(circle, #06b6d4, transparent 70%)" }} />
        <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.03]"
          style={{ background: "radial-gradient(circle, #7c3aed, #06b6d4, transparent 70%)" }} />
      </div>

      {/* Theme toggle */}
      <motion.button
        onClick={toggle}
        className="fixed top-5 right-5 z-50 p-2.5 rounded-xl transition-all"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        title={dark ? "Switch to light mode" : "Switch to dark mode"}
      >
        <AnimatePresence mode="wait">
          {dark
            ? <motion.div key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}><Sun className="w-4 h-4" /></motion.div>
            : <motion.div key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}><Moon className="w-4 h-4" /></motion.div>
          }
        </AnimatePresence>
      </motion.button>

      <div className="relative z-10 w-full max-w-[420px]">

        {/* Hero */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Sonar + title */}
          <div className="flex items-center justify-center gap-6 mb-5">
            <div className="animate-float">
              <SonarDoodle />
            </div>
            <div className="text-left">
              <h1 className="text-4xl font-extrabold tracking-tight leading-none shimmer-text">
                ECHO‑3D
              </h1>
              <p className="text-sm font-medium mt-1" style={{ color: "var(--text-muted)" }}>
                Immersive Spatial Voice
              </p>
            </div>
          </div>

          {/* Waveform */}
          <div className="flex justify-center mb-4" style={{ color: "var(--accent)" }}>
            <WaveformDoodle />
          </div>

          {/* Feature chips */}
          <motion.div
            className="flex flex-wrap justify-center gap-2"
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.5 } } }}
          >
            {[
              { emoji: "🎧", label: "HRTF binaural" },
              { emoji: "⚡", label: "<20ms latency" },
              { emoji: "🧠", label: "AI moderator" },
              { emoji: "🎤", label: "Voice FX" },
            ].map(({ emoji, label }) => (
              <motion.span
                key={label}
                variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
              >
                {emoji} {label}
              </motion.span>
            ))}
          </motion.div>
        </motion.div>

        {/* Card */}
        <AnimatePresence mode="wait">

          {/* ── Choose ── */}
          {mode === "choose" && (
            <motion.div
              key="choose"
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.97 }}
              transition={spring}
              className="card rounded-2xl p-7 space-y-5"
            >
              <div>
                <label className="block text-xs font-semibold mb-2 tracking-wide uppercase"
                  style={{ color: "var(--text-muted)" }}>Your Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && name.trim() && setMode("join")}
                  placeholder="How should we call you?"
                  className="input-field"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  onClick={handleCreate}
                  disabled={!name.trim()}
                  className="gradient-btn py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  whileHover={name.trim() ? { scale: 1.02 } : {}}
                  whileTap={name.trim() ? { scale: 0.97 } : {}}
                >
                  Create Room
                </motion.button>
                <motion.button
                  onClick={() => name.trim() && setMode("join")}
                  disabled={!name.trim()}
                  className="py-3 rounded-xl font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  style={{ background: "var(--surface-hover)", border: "1px solid var(--border)", color: "var(--text)" }}
                  whileHover={name.trim() ? { scale: 1.02 } : {}}
                  whileTap={name.trim() ? { scale: 0.97 } : {}}
                >
                  Join Room
                </motion.button>
              </div>

              {/* Connection doodle */}
              <div className="flex justify-center pt-1 opacity-40" style={{ color: "var(--text)" }}>
                <ConnectionDoodle />
              </div>
            </motion.div>
          )}

          {/* ── Created ── */}
          {mode === "create" && (
            <motion.div
              key="create"
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.97 }}
              transition={spring}
              className="card rounded-2xl p-7 space-y-5"
            >
              <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
                  Your Room Code
                </p>
                <motion.div
                  className="text-5xl font-extrabold tracking-[0.25em] font-mono mb-4"
                  style={{ color: "var(--text)" }}
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 280, damping: 20, delay: 0.1 }}
                >
                  {createdRoomId}
                </motion.div>
                <motion.button
                  onClick={copyLink}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                  style={{ background: "var(--surface-hover)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                >
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied!" : "Copy invite link"}
                </motion.button>
              </div>

              <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
                Share this code with friends — you&apos;ll be the host 👑
              </p>

              <motion.button
                onClick={handleEnter}
                disabled={loading}
                className="gradient-btn w-full py-3 rounded-xl text-white font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Entering...
                  </span>
                ) : (
                  <>Enter Room <ArrowRight className="w-4 h-4" /></>
                )}
              </motion.button>

              <button onClick={() => setMode("choose")}
                className="w-full text-xs transition-all" style={{ color: "var(--text-muted)" }}>
                ← Back
              </button>
            </motion.div>
          )}

          {/* ── Join ── */}
          {mode === "join" && (
            <motion.div
              key="join"
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.97 }}
              transition={spring}
            >
              <form onSubmit={handleJoin} className="card rounded-2xl p-7 space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-2"
                    style={{ color: "var(--text-muted)" }}>Room Code</label>
                  <input
                    type="text"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                    placeholder="e.g. AB12CD"
                    maxLength={8}
                    className="input-field text-center text-2xl font-mono tracking-[0.3em] uppercase"
                    autoFocus
                  />
                </div>
                <motion.button
                  type="submit"
                  disabled={loading || !roomId.trim() || !name.trim()}
                  className="gradient-btn w-full py-3 rounded-xl text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                  whileHover={!loading && roomId.trim() ? { scale: 1.02 } : {}}
                  whileTap={!loading && roomId.trim() ? { scale: 0.97 } : {}}
                >
                  {loading ? "Joining..." : "Join Room →"}
                </motion.button>
                <button type="button" onClick={() => setMode("choose")}
                  className="w-full text-xs transition-all" style={{ color: "var(--text-muted)" }}>
                  ← Back
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <motion.p
          className="text-center text-xs mt-5 flex items-center justify-center gap-1.5"
          style={{ color: "var(--text-faint)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          🎧 Wear headphones for the full binaural 3D experience
        </motion.p>
      </div>
    </main>
  );
}
