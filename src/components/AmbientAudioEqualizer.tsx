import React, { useState, useEffect, useRef } from "react";
import { radioStatic } from "../radioStatic";
import {
  Volume2,
  VolumeX,
  Sliders,
  Sparkles,
  Radio,
  Play,
  Square,
  Activity,
  Zap,
  Music,
} from "lucide-react";

interface AmbientAudioEqualizerProps {
  frequencyValue: number;
  frequencyUnit: string;
  antennaType: string;
  dimension: string;
  isTuned?: boolean;
}

export default function AmbientAudioEqualizer({
  frequencyValue,
  frequencyUnit,
  antennaType,
  dimension,
  isTuned = false,
}: AmbientAudioEqualizerProps) {
  // Audio state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isStaticPlaying, setIsStaticPlaying] = useState(false);
  const [volume, setVolume] = useState(75); // 0 to 100
  const [bassGain, setBassGain] = useState(4); // -12 to +12 dB
  const [midGain, setMidGain] = useState(1); // -12 to +12 dB
  const [trebleGain, setTrebleGain] = useState(5); // -12 to +12 dB
  const [eqPreset, setEqPreset] = useState<string>("anunnaki");
  const [atmosphereMode, setAtmosphereMode] = useState<
    "drone" | "schumann" | "solfeggio" | "pulsar"
  >("drone");

  // Web Audio Refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const bassFilterRef = useRef<BiquadFilterNode | null>(null);
  const midFilterRef = useRef<BiquadFilterNode | null>(null);
  const trebleFilterRef = useRef<BiquadFilterNode | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Sound generator nodes
  const osc1Ref = useRef<OscillatorNode | null>(null);
  const osc2Ref = useRef<OscillatorNode | null>(null);
  const osc3Ref = useRef<OscillatorNode | null>(null);
  const lfoRef = useRef<OscillatorNode | null>(null);

  // Canvas visualizer ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Apply EQ Presets
  const applyPreset = (presetKey: string) => {
    setEqPreset(presetKey);
    switch (presetKey) {
      case "anunnaki":
        setBassGain(8);
        setMidGain(2);
        setTrebleGain(-2);
        break;
      case "quantum":
        setBassGain(5);
        setMidGain(-3);
        setTrebleGain(8);
        break;
      case "orion":
        setBassGain(0);
        setMidGain(6);
        setTrebleGain(4);
        break;
      case "crystal":
        setBassGain(-6);
        setMidGain(3);
        setTrebleGain(10);
        break;
      case "flat":
        setBassGain(0);
        setMidGain(0);
        setTrebleGain(0);
        break;
      default:
        break;
    }
  };

  // Start synth ambient audio
  const startAudio = () => {
    try {
      if (isPlaying) return;

      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      // Master Gain
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(volume / 100, ctx.currentTime);
      masterGainRef.current = masterGain;

      // Equalizer Biquad Filters
      const bassFilter = ctx.createBiquadFilter();
      bassFilter.type = "lowshelf";
      bassFilter.frequency.setValueAtTime(160, ctx.currentTime);
      bassFilter.gain.setValueAtTime(bassGain, ctx.currentTime);
      bassFilterRef.current = bassFilter;

      const midFilter = ctx.createBiquadFilter();
      midFilter.type = "peaking";
      midFilter.frequency.setValueAtTime(1000, ctx.currentTime);
      midFilter.Q.setValueAtTime(1.2, ctx.currentTime);
      midFilter.gain.setValueAtTime(midGain, ctx.currentTime);
      midFilterRef.current = midFilter;

      const trebleFilter = ctx.createBiquadFilter();
      trebleFilter.type = "highshelf";
      trebleFilter.frequency.setValueAtTime(4500, ctx.currentTime);
      trebleFilter.gain.setValueAtTime(trebleGain, ctx.currentTime);
      trebleFilterRef.current = trebleFilter;

      // Analyser for real-time visual equalizer
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.82;
      analyserRef.current = analyser;

      // Connect EQ chain: Synths -> Bass -> Mid -> Treble -> MasterGain -> Analyser -> Destination
      bassFilter.connect(midFilter);
      midFilter.connect(trebleFilter);
      trebleFilter.connect(masterGain);
      masterGain.connect(analyser);
      analyser.connect(ctx.destination);

      // Base Frequency calculation from tuned value
      let baseFreq = 108; // default cosmic hum
      if (atmosphereMode === "schumann") baseFreq = 7.83 * 8; // 62.6 Hz
      else if (atmosphereMode === "solfeggio") baseFreq = 132; // 528 / 4
      else if (atmosphereMode === "pulsar") baseFreq = 88;
      else {
        // Map tuned frequencyValue to a pleasant musical audio range (55Hz - 440Hz)
        baseFreq = 55 + (frequencyValue % 300);
      }

      // Oscillator 1 (Deep Sub Bass Drone)
      const osc1 = ctx.createOscillator();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(baseFreq * 0.5, ctx.currentTime);

      const osc1Gain = ctx.createGain();
      osc1Gain.gain.setValueAtTime(0.35, ctx.currentTime);
      osc1.connect(osc1Gain);
      osc1Gain.connect(bassFilter);
      osc1.start();
      osc1Ref.current = osc1;

      // Oscillator 2 (Warm Mid Harmonic)
      const osc2 = ctx.createOscillator();
      osc2.type = atmosphereMode === "pulsar" ? "sawtooth" : "triangle";
      osc2.frequency.setValueAtTime(baseFreq, ctx.currentTime);

      const osc2Gain = ctx.createGain();
      osc2Gain.gain.setValueAtTime(0.2, ctx.currentTime);
      osc2.connect(osc2Gain);
      osc2Gain.connect(bassFilter);
      osc2.start();
      osc2Ref.current = osc2;

      // Oscillator 3 (High Crystal Sparkle)
      const osc3 = ctx.createOscillator();
      osc3.type = "sine";
      osc3.frequency.setValueAtTime(baseFreq * 3.01, ctx.currentTime);

      const osc3Gain = ctx.createGain();
      osc3Gain.gain.setValueAtTime(0.08, ctx.currentTime);
      osc3.connect(osc3Gain);
      osc3Gain.connect(bassFilter);
      osc3.start();
      osc3Ref.current = osc3;

      // LFO Tremolo for cosmic pulsation
      const lfo = ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.25, ctx.currentTime); // 0.25 Hz slow pulse
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(0.05, ctx.currentTime);
      lfo.connect(masterGain.gain);
      lfo.start();
      lfoRef.current = lfo;

      setIsPlaying(true);
    } catch (err) {
      console.error("Error al iniciar sintetizador ambiental:", err);
    }
  };

  // Stop audio
  const stopAudio = () => {
    try {
      if (osc1Ref.current) {
        osc1Ref.current.stop();
        osc1Ref.current.disconnect();
      }
      if (osc2Ref.current) {
        osc2Ref.current.stop();
        osc2Ref.current.disconnect();
      }
      if (osc3Ref.current) {
        osc3Ref.current.stop();
        osc3Ref.current.disconnect();
      }
      if (lfoRef.current) {
        lfoRef.current.stop();
        lfoRef.current.disconnect();
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close();
      }
    } catch (e) {
      console.warn("Cierre de audio context:", e);
    } finally {
      audioCtxRef.current = null;
      setIsPlaying(false);
    }
  };

  // Update volume in real-time
  useEffect(() => {
    if (masterGainRef.current && audioCtxRef.current) {
      masterGainRef.current.gain.setTargetAtTime(
        volume / 100,
        audioCtxRef.current.currentTime,
        0.05
      );
    }
  }, [volume]);

  // Update Biquad Filters when EQ sliders change
  useEffect(() => {
    if (audioCtxRef.current) {
      const now = audioCtxRef.current.currentTime;
      if (bassFilterRef.current) {
        bassFilterRef.current.gain.setTargetAtTime(bassGain, now, 0.05);
      }
      if (midFilterRef.current) {
        midFilterRef.current.gain.setTargetAtTime(midGain, now, 0.05);
      }
      if (trebleFilterRef.current) {
        trebleFilterRef.current.gain.setTargetAtTime(trebleGain, now, 0.05);
      }
    }
  }, [bassGain, midGain, trebleGain]);

  // Restart audio if atmosphere mode or frequency changes while playing
  useEffect(() => {
    if (isPlaying) {
      stopAudio();
      setTimeout(() => startAudio(), 100);
    }
  }, [atmosphereMode, frequencyValue]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopAudio();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Visual Equalizer Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let offset = 0;

    const renderSpectrum = () => {
      animFrameRef.current = requestAnimationFrame(renderSpectrum);

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Background subtle grid
      ctx.fillStyle = "rgba(10, 15, 29, 0.8)";
      ctx.fillRect(0, 0, width, height);

      const barCount = 24;
      const barWidth = (width - barCount * 3) / barCount;

      let bufferLength = 64;
      const dataArray = new Uint8Array(bufferLength);

      if (analyserRef.current && isPlaying) {
        analyserRef.current.getByteFrequencyData(dataArray);
      }

      offset += 0.05;

      for (let i = 0; i < barCount; i++) {
        let val = 0;

        if (isPlaying && analyserRef.current) {
          // Map bin index to EQ regions
          const binIdx = Math.floor((i / barCount) * (dataArray.length / 2));
          val = dataArray[binIdx] || 0;

          // Apply visual scale based on Bass/Mid/Treble gain sliders
          if (i < 8) {
            // Bass region
            const bassMultiplier = Math.pow(10, bassGain / 20);
            val = Math.min(255, val * bassMultiplier);
          } else if (i < 16) {
            // Mid region
            const midMultiplier = Math.pow(10, midGain / 20);
            val = Math.min(255, val * midMultiplier);
          } else {
            // Treble region
            const trebleMultiplier = Math.pow(10, trebleGain / 20);
            val = Math.min(255, val * trebleMultiplier);
          }
        } else {
          // Idle ambient wave visualizer
          const bassWeight = (12 + bassGain) / 24;
          const trebleWeight = (12 + trebleGain) / 24;
          const wave1 = Math.sin(offset + i * 0.3) * 20;
          const wave2 = Math.cos(offset * 1.5 + i * 0.5) * 15;
          const region = i < 8 ? bassWeight : i > 16 ? trebleWeight : 0.5;
          val = Math.max(10, (25 + wave1 + wave2) * region * 1.5);
        }

        const barHeight = Math.max(4, (val / 255) * (height - 12));
        const x = i * (barWidth + 3) + 2;
        const y = height - barHeight - 4;

        // Dynamic Color Gradients for Bass (Green), Mid (Cyan/Indigo), Treble (Amber/Gold)
        let gradient: CanvasGradient;
        if (i < 8) {
          // BASS (Verde Esmeralda)
          gradient = ctx.createLinearGradient(0, height, 0, 0);
          gradient.addColorStop(0, "rgba(16, 185, 129, 0.9)");
          gradient.addColorStop(1, "rgba(52, 211, 153, 1)");
        } else if (i < 16) {
          // MID (Cian e Índigo)
          gradient = ctx.createLinearGradient(0, height, 0, 0);
          gradient.addColorStop(0, "rgba(6, 182, 212, 0.9)");
          gradient.addColorStop(1, "rgba(99, 102, 241, 1)");
        } else {
          // TREBLE (Ámbar / Oro)
          gradient = ctx.createLinearGradient(0, height, 0, 0);
          gradient.addColorStop(0, "rgba(245, 158, 11, 0.9)");
          gradient.addColorStop(1, "rgba(252, 211, 77, 1)");
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, [2, 2, 0, 0]);
        ctx.fill();

        // Top peak light dot
        if (barHeight > 10) {
          ctx.fillStyle = i < 8 ? "#6ee7b7" : i < 16 ? "#a5f3fc" : "#fde68a";
          ctx.fillRect(x, Math.max(2, y - 3), barWidth, 2);
        }
      }

      // Draw frequency zone indicator lines (Bass | Mid | Treble)
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.setLineDash([2, 2]);
      const xBassDiv = 8 * (barWidth + 3);
      const xMidDiv = 16 * (barWidth + 3);

      ctx.beginPath();
      ctx.moveTo(xBassDiv, 0);
      ctx.lineTo(xBassDiv, height);
      ctx.moveTo(xMidDiv, 0);
      ctx.lineTo(xMidDiv, height);
      ctx.stroke();
      ctx.setLineDash([]);
    };

    renderSpectrum();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, bassGain, midGain, trebleGain]);

  return (
    <div
      id="quantum-ambient-audio-panel"
      className="p-4 rounded-2xl bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-2 border-emerald-500/40 shadow-[0_0_25px_rgba(16,185,129,0.12)] space-y-4 relative overflow-hidden"
    >
      {/* Encabezado Principal */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="space-y-0.5">
          <h3 className="text-xs font-black text-emerald-300 font-mono tracking-widest uppercase flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
            AUDIO AMBIENTAL Y ECUALIZADOR GALÁCTICO
          </h3>
          <p className="text-[10px] text-slate-400 font-sans font-medium">
            Sintonizador de ruido cósmico y modulador de graves/agudos en vivo
          </p>
        </div>

        <button
          type="button"
          onClick={isPlaying ? stopAudio : startAudio}
          className={`px-3.5 py-2 rounded-xl text-xs font-black font-mono tracking-wider uppercase transition-all duration-300 cursor-pointer flex items-center gap-2 shadow-md ${
            isPlaying
              ? "bg-rose-500/20 text-rose-300 border border-rose-500/50 hover:bg-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.3)] animate-pulse"
              : "bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 hover:bg-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
          }`}
        >
          {isPlaying ? (
            <>
              <Square className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
              <span>APAGAR ZUMBIDO</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
              <span>ESCUCHAR ZUMBIDO</span>
            </>
          )}
        </button>
      </div>

      {/* Pantalla de Ecualizador Visual / Espectrómetro Análitico */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-[10px] font-mono px-1">
          <span className="text-slate-400 flex items-center gap-1">
            <Radio className="w-3 h-3 text-emerald-400 animate-spin" />
            ESPECTRO DE FRECUENCIA GALÁCTICA
          </span>
          <div className="flex items-center gap-3 text-[9px]">
            <span className="text-emerald-400 font-bold">● GRAVES</span>
            <span className="text-cyan-400 font-bold">● MEDIOS</span>
            <span className="text-amber-400 font-bold">● AGUDOS</span>
          </div>
        </div>

        <div className="relative rounded-xl border border-emerald-500/30 overflow-hidden bg-slate-950 p-1 shadow-inner">
          <canvas
            ref={canvasRef}
            width={340}
            height={64}
            className="w-full h-16 block rounded-lg cursor-crosshair"
          />

          {!isPlaying && (
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
              <span className="text-[10px] font-mono text-emerald-300/90 font-bold bg-slate-900/90 px-3 py-1 rounded-full border border-emerald-500/40 shadow-lg flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                Haz clic en "ESCUCHAR ZUMBIDO" para activar el audio
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Modos de Atmósfera Cósmica */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block px-1">
          Portadora de Resonancia Cósmica:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          <button
            type="button"
            onClick={() => setAtmosphereMode("drone")}
            className={`px-2 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer border ${
              atmosphereMode === "drone"
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
            }`}
          >
            🛸 Vacío 108Hz
          </button>
          <button
            type="button"
            onClick={() => setAtmosphereMode("schumann")}
            className={`px-2 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer border ${
              atmosphereMode === "schumann"
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
            }`}
          >
            🌍 Schumann 7.83Hz
          </button>
          <button
            type="button"
            onClick={() => setAtmosphereMode("solfeggio")}
            className={`px-2 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer border ${
              atmosphereMode === "solfeggio"
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
            }`}
          >
            ✨ Solfeggio 528Hz
          </button>
          <button
            type="button"
            onClick={() => setAtmosphereMode("pulsar")}
            className={`px-2 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer border ${
              atmosphereMode === "pulsar"
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
            }`}
          >
            ⚡ Pulsar Anunnaki
          </button>
        </div>
      </div>

      {/* Controles del Ecualizador de 3 Bandas (Graves, Medios, Agudos) */}
      <div className="space-y-3 pt-2 border-t border-slate-800">
        <div className="flex justify-between items-center">
          <label className="text-[10px] font-mono text-emerald-300 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
            CONTROLES DE ECUALIZACIÓN (dB)
          </label>
          <span className="text-[9px] font-mono text-slate-400">
            Respuesta activa
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
          {/* BANDA 1: GRAVES (BASS) */}
          <div className="space-y-2 text-center">
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[10px] font-mono text-emerald-400 font-extrabold uppercase">
                GRAVES
              </span>
              <span className="text-[9px] font-mono text-slate-400">
                160 Hz
              </span>
            </div>

            <div className="h-28 flex items-center justify-center py-1">
              <input
                type="range"
                min="-12"
                max="12"
                value={bassGain}
                onChange={(e) => {
                  setBassGain(parseInt(e.target.value));
                  setEqPreset("custom");
                }}
                className="h-24 w-2 accent-emerald-400 cursor-pointer [writing-mode:vertical-lr] [direction:rtl]"
              />
            </div>

            <div className="px-1 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-[10px] font-mono text-emerald-300 font-bold">
              {bassGain > 0 ? `+${bassGain}` : bassGain} dB
            </div>
          </div>

          {/* BANDA 2: MEDIOS (MIDS) */}
          <div className="space-y-2 text-center border-x border-slate-850 px-1">
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[10px] font-mono text-cyan-400 font-extrabold uppercase">
                MEDIOS
              </span>
              <span className="text-[9px] font-mono text-slate-400">
                1000 Hz
              </span>
            </div>

            <div className="h-28 flex items-center justify-center py-1">
              <input
                type="range"
                min="-12"
                max="12"
                value={midGain}
                onChange={(e) => {
                  setMidGain(parseInt(e.target.value));
                  setEqPreset("custom");
                }}
                className="h-24 w-2 accent-cyan-400 cursor-pointer [writing-mode:vertical-lr] [direction:rtl]"
              />
            </div>

            <div className="px-1 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-[10px] font-mono text-cyan-300 font-bold">
              {midGain > 0 ? `+${midGain}` : midGain} dB
            </div>
          </div>

          {/* BANDA 3: AGUDOS (TREBLE) */}
          <div className="space-y-2 text-center">
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[10px] font-mono text-amber-400 font-extrabold uppercase">
                AGUDOS
              </span>
              <span className="text-[9px] font-mono text-slate-400">
                4500 Hz
              </span>
            </div>

            <div className="h-28 flex items-center justify-center py-1">
              <input
                type="range"
                min="-12"
                max="12"
                value={trebleGain}
                onChange={(e) => {
                  setTrebleGain(parseInt(e.target.value));
                  setEqPreset("custom");
                }}
                className="h-24 w-2 accent-amber-400 cursor-pointer [writing-mode:vertical-lr] [direction:rtl]"
              />
            </div>

            <div className="px-1 py-0.5 rounded bg-amber-950/60 border border-amber-500/30 text-[10px] font-mono text-amber-300 font-bold">
              {trebleGain > 0 ? `+${trebleGain}` : trebleGain} dB
            </div>
          </div>
        </div>
      </div>

      {/* Presets de EQ Rápido y Ruido de Radio */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">
            Presets de Ecualización Galáctica:
          </span>
          <button
            type="button"
            onClick={() => {
              if (isStaticPlaying) {
                radioStatic.stop();
                setIsStaticPlaying(false);
              } else {
                radioStatic.start();
                setIsStaticPlaying(true);
              }
            }}
            className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase transition-all cursor-pointer border flex items-center gap-1 ${
              isStaticPlaying
                ? "bg-amber-500/20 text-amber-300 border-amber-400 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                : "bg-slate-900 text-amber-400/90 border-amber-500/30 hover:border-amber-400"
            }`}
          >
            <Radio className="w-3 h-3 text-amber-400 animate-pulse" />
            <span>{isStaticPlaying ? "🛑 DETENER FRITURA" : "📻 PROBAR RUIDO DE FRITURA"}</span>
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: "anunnaki", label: "👑 Monolito Anunnaki" },
            { id: "quantum", label: "🌌 Matriz Cuántica" },
            { id: "orion", label: "🔮 Voz de Orión" },
            { id: "crystal", label: "✨ Armónico Cristal" },
            { id: "flat", label: "🎚️ Plano Neutro" },
          ].map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset.id)}
              className={`px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold transition-all cursor-pointer border ${
                eqPreset === preset.id
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.25)]"
                  : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Control Deslizable de Volumen Maestro */}
      <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
        <div className="flex items-center gap-2">
          {volume === 0 ? (
            <VolumeX className="w-4 h-4 text-slate-500" />
          ) : (
            <Volume2 className="w-4 h-4 text-emerald-400" />
          )}
          <span className="text-[10px] font-mono text-slate-300 font-bold">
            Volumen Maestro
          </span>
        </div>

        <div className="flex items-center gap-2 flex-1 max-w-[180px]">
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => setVolume(parseInt(e.target.value))}
            className="w-full accent-emerald-400 cursor-pointer"
          />
          <span className="text-[10px] font-mono text-emerald-400 font-bold w-8 text-right">
            {volume}%
          </span>
        </div>
      </div>
    </div>
  );
}
