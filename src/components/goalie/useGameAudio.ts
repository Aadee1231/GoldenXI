"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type AmbientHandle = { stop: () => void };

/**
 * Programmatic Web-Audio sound effects for the Goalkeeper mini-game.
 * No audio files required — all sounds are synthesised on-the-fly.
 *
 * Safety rules:
 *  · AudioContext is created lazily on the first call to `initAudio()`.
 *    Call this inside a click/touch handler so browsers don't block autoplay.
 *  · All sounds respect the `muted` flag via `mutedRef`.
 */
export function useGameAudio() {
  const ctxRef       = useRef<AudioContext | null>(null);
  const ambientRef   = useRef<AmbientHandle | null>(null);
  const mutedRef     = useRef(false);
  const [muted, setMuted] = useState(false);

  // Lazy AudioContext init — must be called from inside a user gesture.
  const initAudio = useCallback(() => {
    if (ctxRef.current) return;
    try {
      const Ctx =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      ctxRef.current = new Ctx();
    } catch {
      /* audio unavailable — silently ignore */
    }
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      mutedRef.current = next;
      // Stop ambient immediately on mute
      if (next && ambientRef.current) {
        ambientRef.current.stop();
        ambientRef.current = null;
      }
      return next;
    });
  }, []);

  /** Returns a live AudioContext or null if muted / unavailable. */
  const getCtx = useCallback((): AudioContext | null => {
    if (mutedRef.current) return null;
    const ctx = ctxRef.current;
    if (!ctx) return null;
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  }, []);

  // ── Helpers ──────────────────────────────────────────────────────────────

  /** Create a short white-noise buffer filled with random samples. */
  function noiseBuffer(ctx: AudioContext, durationSec: number): AudioBuffer {
    const n = Math.floor(ctx.sampleRate * durationSec);
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < n; i++) ch[i] = Math.random() * 2 - 1;
    return buf;
  }

  // ── Stadium ambient ───────────────────────────────────────────────────────

  const startAmbient = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;

    // Stop any running ambient first.
    if (ambientRef.current) { ambientRef.current.stop(); ambientRef.current = null; }

    const src    = ctx.createBufferSource();
    src.buffer   = noiseBuffer(ctx, 2.5);
    src.loop     = true;

    const lpf  = ctx.createBiquadFilter();
    lpf.type   = "lowpass";
    lpf.frequency.value = 520;
    lpf.Q.value = 0.4;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.055, ctx.currentTime + 1.5);

    src.connect(lpf); lpf.connect(gain); gain.connect(ctx.destination);
    src.start();

    ambientRef.current = {
      stop: () => {
        try {
          gain.gain.setTargetAtTime(0, ctx.currentTime, 0.4);
          setTimeout(() => { try { src.stop(); } catch {} }, 800);
        } catch { /* already stopped */ }
      },
    };
  }, [getCtx]);

  const stopAmbient = useCallback(() => {
    if (ambientRef.current) { ambientRef.current.stop(); ambientRef.current = null; }
  }, []);

  // ── Whistle ───────────────────────────────────────────────────────────────

  const playWhistle = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;

    const osc  = ctx.createOscillator();
    osc.type   = "sine";
    osc.frequency.setValueAtTime(2300, t);
    osc.frequency.setValueAtTime(2480, t + 0.04);
    osc.frequency.setValueAtTime(2300, t + 0.10);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0,    t);
    gain.gain.linearRampToValueAtTime(0.16, t + 0.015);
    gain.gain.setValueAtTime(0.16, t + 0.16);
    gain.gain.linearRampToValueAtTime(0,    t + 0.28);

    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.32);
  }, [getCtx]);

  // ── Kick (ball strike) ────────────────────────────────────────────────────

  const playKick = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;

    // Noise burst
    const nSrc  = ctx.createBufferSource();
    nSrc.buffer = noiseBuffer(ctx, 0.1);
    const bpf   = ctx.createBiquadFilter();
    bpf.type    = "bandpass";
    bpf.frequency.value = 220;
    bpf.Q.value = 0.9;
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.45, t);
    nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    nSrc.connect(bpf); bpf.connect(nGain); nGain.connect(ctx.destination);
    nSrc.start(t);

    // Low thump oscillator
    const osc  = ctx.createOscillator();
    osc.type   = "sine";
    osc.frequency.setValueAtTime(85,  t);
    osc.frequency.exponentialRampToValueAtTime(38, t + 0.09);
    const oGain = ctx.createGain();
    oGain.gain.setValueAtTime(0.42, t);
    oGain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    osc.connect(oGain); oGain.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.14);
  }, [getCtx]);

  // ── Save (glove catch) ────────────────────────────────────────────────────

  const playSave = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;

    // Brief glove-thud noise
    const nSrc  = ctx.createBufferSource();
    nSrc.buffer = noiseBuffer(ctx, 0.07);
    const hpf   = ctx.createBiquadFilter();
    hpf.type    = "highpass";
    hpf.frequency.value = 900;
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.18, t);
    nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
    nSrc.connect(hpf); hpf.connect(nGain); nGain.connect(ctx.destination);
    nSrc.start(t);

    // Rising tone — "win" cue
    const osc  = ctx.createOscillator();
    osc.type   = "sine";
    osc.frequency.setValueAtTime(420, t);
    osc.frequency.linearRampToValueAtTime(680, t + 0.18);
    const oGain = ctx.createGain();
    oGain.gain.setValueAtTime(0.13, t);
    oGain.gain.linearRampToValueAtTime(0,    t + 0.26);
    osc.connect(oGain); oGain.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.28);
  }, [getCtx]);

  // ── Goal (net hit) ────────────────────────────────────────────────────────

  const playGoal = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;

    // Net rustle
    const nSrc  = ctx.createBufferSource();
    nSrc.buffer = noiseBuffer(ctx, 0.28);
    const bpf   = ctx.createBiquadFilter();
    bpf.type    = "bandpass";
    bpf.frequency.value = 380;
    bpf.Q.value = 0.35;
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0,    t);
    nGain.gain.linearRampToValueAtTime(0.28, t + 0.02);
    nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
    nSrc.connect(bpf); bpf.connect(nGain); nGain.connect(ctx.destination);
    nSrc.start(t);

    // Deep thud
    const osc  = ctx.createOscillator();
    osc.type   = "sine";
    osc.frequency.setValueAtTime(62,  t);
    osc.frequency.exponentialRampToValueAtTime(28, t + 0.16);
    const oGain = ctx.createGain();
    oGain.gain.setValueAtTime(0.48, t);
    oGain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    osc.connect(oGain); oGain.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.20);
  }, [getCtx]);

  // ── Streak cheer (streak ≥ 3) ─────────────────────────────────────────────

  const playCheer = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;

    const nSrc  = ctx.createBufferSource();
    nSrc.buffer = noiseBuffer(ctx, 0.45);
    const bpf   = ctx.createBiquadFilter();
    bpf.type    = "bandpass";
    bpf.frequency.setValueAtTime(700,  t);
    bpf.frequency.linearRampToValueAtTime(2200, t + 0.3);
    bpf.Q.value = 0.55;
    const gain  = ctx.createGain();
    gain.gain.setValueAtTime(0,    t);
    gain.gain.linearRampToValueAtTime(0.13, t + 0.08);
    gain.gain.linearRampToValueAtTime(0,    t + 0.45);
    nSrc.connect(bpf); bpf.connect(gain); gain.connect(ctx.destination);
    nSrc.start(t);
  }, [getCtx]);

  // ── Cleanup ───────────────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (ambientRef.current) ambientRef.current.stop();
      try { ctxRef.current?.close(); } catch {}
    };
  }, []);

  return {
    muted,
    toggleMute,
    initAudio,
    startAmbient,
    stopAmbient,
    playWhistle,
    playKick,
    playSave,
    playGoal,
    playCheer,
  };
}
