/**
 * Radio Static & Carrier Wave Synthesizer Controller
 * Genera una mezcla inmersiva de zumbido de portadora (hum/drone),
 * pulsos rítmicos de rastreo (ping sonar) y ruido analógico suave de éter.
 * Comunica inequívocamente al usuario que el sistema está trabajando y debe esperar.
 */

class RadioStaticController {
  private audioCtx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;

  // Layer 1: Noise & Ether
  private noiseNode: AudioBufferSourceNode | null = null;
  private noiseFilterNode: BiquadFilterNode | null = null;

  // Layer 2: Carrier Hum & Sub-Bass
  private humOsc1: OscillatorNode | null = null;
  private humOsc2Sub: OscillatorNode | null = null;
  private lfoOsc: OscillatorNode | null = null;
  private humFilterNode: BiquadFilterNode | null = null;

  // Layer 3: Rhythmic Pulse / Sonar
  private pulseTimer: any = null;

  // Modulation loop
  private modInterval: any = null;
  private isPlaying: boolean = false;

  /**
   * Inicia la reproducción inmediata de la mezcla de sintonización (Zumbido + Pulso + Éter)
   */
  public async start() {
    if (this.isPlaying) return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      if (!this.audioCtx || this.audioCtx.state === "closed") {
        this.audioCtx = new AudioCtx();
      }

      const ctx = this.audioCtx;
      if (ctx.state === "suspended") {
        await ctx.resume().catch(() => {});
      }

      const now = ctx.currentTime;

      // Master Gain
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.001, now);
      masterGain.gain.exponentialRampToValueAtTime(0.45, now + 0.15);
      
      // AnalyserNode for Diagnostic Mode real-time buffer telemetry
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      masterGain.connect(analyser);
      analyser.connect(ctx.destination);
      
      this.masterGain = masterGain;
      this.analyser = analyser;

      // ==========================================
      // CAPA 1: ZUMBIDO DE PORTADORA Y SUB-GRAVES (HUM & SUB-BASS DRONE)
      // ==========================================
      // Oscilador Principal (118 Hz - Tono cálido de baja frecuencia)
      const humOsc1 = ctx.createOscillator();
      humOsc1.type = "sawtooth";
      humOsc1.frequency.setValueAtTime(118, now);

      // Sub-Bass (55 Hz - Zumbido profundo de transformador/antena)
      const humOsc2Sub = ctx.createOscillator();
      humOsc2Sub.type = "sine";
      humOsc2Sub.frequency.setValueAtTime(55, now);

      // LFO para fluctuación de tono (efecto wub-wub de búsqueda)
      const lfoOsc = ctx.createOscillator();
      lfoOsc.type = "sine";
      lfoOsc.frequency.setValueAtTime(0.35, now); // 0.35 Hz

      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(15, now); // Modulación de +-15 Hz
      lfoOsc.connect(lfoGain);
      lfoGain.connect(humOsc1.frequency);

      // Filtro para el Zumbido (Corta agudos ásperos para dejarlo suave y envolvente)
      const humFilter = ctx.createBiquadFilter();
      humFilter.type = "lowpass";
      humFilter.frequency.setValueAtTime(320, now);
      humFilter.Q.setValueAtTime(2.5, now);
      this.humFilterNode = humFilter;

      const humGain = ctx.createGain();
      humGain.gain.setValueAtTime(0.25, now);

      humOsc1.connect(humFilter);
      humOsc2Sub.connect(humFilter);
      humFilter.connect(humGain);
      humGain.connect(masterGain);

      humOsc1.start(now);
      humOsc2Sub.start(now);
      lfoOsc.start(now);

      this.humOsc1 = humOsc1;
      this.humOsc2Sub = humOsc2Sub;
      this.lfoOsc = lfoOsc;

      // ==========================================
      // CAPA 2: RUIDO DE ÉTER Y CÁMARA ANALÓGICA (SMOOTH ETHER & ATMOSPHERE)
      // ==========================================
      const bufferSize = ctx.sampleRate * 2;
      const staticBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const staticData = staticBuffer.getChannelData(0);

      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        // Mezcla de ruido rosa suave
        staticData[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.2) * 0.05;
        b6 = white * 0.115926;
      }

      const noiseNode = ctx.createBufferSource();
      noiseNode.buffer = staticBuffer;
      noiseNode.loop = true;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = "bandpass";
      noiseFilter.frequency.setValueAtTime(1200, now);
      noiseFilter.Q.setValueAtTime(1.2, now);
      this.noiseFilterNode = noiseFilter;

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.18, now);

      noiseNode.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(masterGain);

      noiseNode.start(now);
      this.noiseNode = noiseNode;

      // ==========================================
      // CAPA 3: PULSO RÍTMICO DE RASTREO / SONAR ("BIP... BIP... ESPERA")
      // ==========================================
      const triggerPulse = () => {
        if (!this.isPlaying || !this.audioCtx || this.audioCtx.state !== "running") return;
        try {
          const pNow = this.audioCtx.currentTime;
          const pulseOsc = this.audioCtx.createOscillator();
          const pulseGain = this.audioCtx.createGain();

          // Alternar frecuencias de pulso para simular barrido de búsqueda (432Hz - 528Hz)
          const pulseFreq = Math.random() > 0.5 ? 432 : 528;
          pulseOsc.type = "sine";
          pulseOsc.frequency.setValueAtTime(pulseFreq, pNow);

          // Envolvente de volumen rápida (Ping de búsqueda)
          pulseGain.gain.setValueAtTime(0.001, pNow);
          pulseGain.gain.linearRampToValueAtTime(0.12, pNow + 0.02);
          pulseGain.gain.exponentialRampToValueAtTime(0.0001, pNow + 0.18);

          pulseOsc.connect(pulseGain);
          if (this.masterGain) {
            pulseGain.connect(this.masterGain);
          } else {
            pulseGain.connect(this.audioCtx.destination);
          }

          pulseOsc.start(pNow);
          pulseOsc.stop(pNow + 0.2);
        } catch (e) {}
      };

      // Disparar primer pulso de inmediato y luego cada 650 ms
      triggerPulse();
      this.pulseTimer = setInterval(triggerPulse, 650);

      // ==========================================
      // BARRIDO DINÁMICO DE FILTRO Y VOLUMEN
      // ==========================================
      this.modInterval = setInterval(() => {
        if (!this.audioCtx || !this.noiseFilterNode || !this.humFilterNode || !this.isPlaying) return;
        const mNow = this.audioCtx.currentTime;
        const sweepFreq = 600 + Math.random() * 1800;
        this.noiseFilterNode.frequency.setTargetAtTime(sweepFreq, mNow, 0.08);

        // Ligera variación de filtro de zumbido
        const humSweep = 280 + Math.random() * 150;
        this.humFilterNode.frequency.setTargetAtTime(humSweep, mNow, 0.1);
      }, 90);

      this.isPlaying = true;
    } catch (e) {
      console.warn("[RadioStatic] No se pudo iniciar el generador de zumbido de sintonización:", e);
    }
  }

  /**
   * Genera un chasquido o micro-interferencia anómala de radio (200ms - 350ms)
   * Sin interrumpir la voz ni apagar la portadora principal.
   */
  public triggerAnomalousGlitch() {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const tempCtx = this.audioCtx && this.audioCtx.state === "running" ? this.audioCtx : new AudioCtx();
      const now = tempCtx.currentTime;

      // Oscilador de chasquido de frecuencia o barrido de banda
      const osc = tempCtx.createOscillator();
      const gain = tempCtx.createGain();
      const filter = tempCtx.createBiquadFilter();

      // Barrido de frecuencia rápido y anómalo (ej: 2100Hz -> 380Hz)
      osc.type = Math.random() > 0.5 ? "sawtooth" : "square";
      const startFreq = 1200 + Math.random() * 1800;
      const endFreq = 220 + Math.random() * 450;
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.22);

      filter.type = "bandpass";
      filter.frequency.setValueAtTime(1400, now);
      filter.Q.setValueAtTime(3.5, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.06, now + 0.02); // Volumen sutil para no tapar la voz
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(tempCtx.destination);

      osc.start(now);
      osc.stop(now + 0.27);
    } catch (e) {
      // Ignorar suavemente si el contexto de audio no estuvo disponible
    }
  }

  /**
   * Detiene el zumbido y ruido de sintonización suavemente
   */
  public stop() {
    if (!this.isPlaying) return;
    this.isPlaying = false;

    if (this.pulseTimer) {
      clearInterval(this.pulseTimer);
      this.pulseTimer = null;
    }

    if (this.modInterval) {
      clearInterval(this.modInterval);
      this.modInterval = null;
    }

    try {
      if (this.masterGain && this.audioCtx) {
        const now = this.audioCtx.currentTime;
        this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
        this.masterGain.gain.linearRampToValueAtTime(0.0001, now + 0.2);
      }

      setTimeout(() => {
        if (this.humOsc1) {
          try { this.humOsc1.stop(); this.humOsc1.disconnect(); } catch (e) {}
          this.humOsc1 = null;
        }
        if (this.humOsc2Sub) {
          try { this.humOsc2Sub.stop(); this.humOsc2Sub.disconnect(); } catch (e) {}
          this.humOsc2Sub = null;
        }
        if (this.lfoOsc) {
          try { this.lfoOsc.stop(); this.lfoOsc.disconnect(); } catch (e) {}
          this.lfoOsc = null;
        }
        if (this.noiseNode) {
          try { this.noiseNode.stop(); this.noiseNode.disconnect(); } catch (e) {}
          this.noiseNode = null;
        }
        if (this.audioCtx && this.audioCtx.state !== "closed") {
          try { this.audioCtx.close(); } catch (e) {}
          this.audioCtx = null;
        }
        this.analyser = null;
        this.masterGain = null;
      }, 230);
    } catch (e) {
      console.warn("[RadioStatic] Error al apagar el sonido de sintonización:", e);
      this.analyser = null;
      this.masterGain = null;
    }
  }

  /**
   * Obtiene el nodo AnalyserNode activo para telemetría y Modo Diagnóstico
   */
  public getAnalyser(): AnalyserNode | null {
    if (this.audioCtx && this.audioCtx.state === "running") {
      return this.analyser;
    }
    return null;
  }

  /**
   * Obtiene el contexto de audio activo de radioStatic
   */
  public getAudioContext(): AudioContext | null {
    return this.audioCtx;
  }

  /**
   * Cambia el tamaño del buffer FFT en tiempo real (ej: 64, 128, 256, 512, 1024)
   */
  public setFftSize(size: number) {
    if (this.analyser) {
      try {
        this.analyser.fftSize = size;
      } catch (e) {
        console.warn("[RadioStatic] Error al establecer fftSize:", e);
      }
    }
  }
}

export const radioStatic = new RadioStaticController();
