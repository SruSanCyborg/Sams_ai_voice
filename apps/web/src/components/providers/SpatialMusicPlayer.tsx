"use client";

import { useEffect, useRef } from "react";
import { useAudioStore } from "@/store/useAudioStore";
import { getAudioCtx } from "@/audio/SpatialAudioRenderer";

// Am pentatonic drone chord — warm, spatial atmosphere
const CHORD_FREQS = [55, 82.41, 110, 130.81, 164.81, 220, 261.63];

export function SpatialMusicPlayer() {
  const musicEnabled = useAudioStore((s) => s.musicEnabled);
  const musicVolume = useAudioStore((s) => s.musicVolume);
  const masterRef = useRef<GainNode | null>(null);

  useEffect(() => {
    if (!musicEnabled) return;

    const ctx = getAudioCtx();
    const nodes: AudioNode[] = [];

    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    masterRef.current = master;
    nodes.push(master);

    // Warm delay for spatial depth
    const delay = ctx.createDelay(2);
    delay.delayTime.value = 0.45;
    const delayFb = ctx.createGain();
    delayFb.gain.value = 0.28;
    const delayMix = ctx.createGain();
    delayMix.gain.value = 0.35;
    delay.connect(delayFb);
    delayFb.connect(delay);
    delay.connect(delayMix);
    delayMix.connect(master);
    nodes.push(delay, delayFb, delayMix);

    CHORD_FREQS.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = i % 3 === 0 ? "sine" : i % 3 === 1 ? "triangle" : "sine";
      osc.frequency.value = freq;
      osc.detune.value = (Math.random() - 0.5) * 12;

      // Slow LFO tremolo per oscillator
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.08 + i * 0.03;
      lfo.type = "sine";
      const lfoAmt = ctx.createGain();
      lfoAmt.gain.value = 0.04;
      lfo.connect(lfoAmt);

      const oscGain = ctx.createGain();
      oscGain.gain.value = 0.1 / CHORD_FREQS.length;
      lfoAmt.connect(oscGain.gain);

      osc.connect(oscGain);
      oscGain.connect(master);
      oscGain.connect(delay);

      osc.start();
      lfo.start();
      nodes.push(osc, oscGain, lfo, lfoAmt);
    });

    // Fade in over 2 seconds
    master.gain.setTargetAtTime(musicVolume * 0.25, ctx.currentTime, 2);

    return () => {
      masterRef.current = null;
      nodes.forEach((n) => {
        try { (n as OscillatorNode).stop?.(); } catch {}
        try { n.disconnect(); } catch {}
      });
    };
  }, [musicEnabled]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!masterRef.current || !musicEnabled) return;
    const ctx = getAudioCtx();
    masterRef.current.gain.setTargetAtTime(musicVolume * 0.25, ctx.currentTime, 0.3);
  }, [musicVolume, musicEnabled]);

  return null;
}
