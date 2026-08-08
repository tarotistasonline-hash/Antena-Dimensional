export interface DimensionPreset {
  id: string;
  name: string;
  coordinates: string;
  frequency: string;
  description: string;
  dangerLevel: "Mínimo" | "Moderado" | "Elevado" | "Crítico" | "Desconocido";
  entityType: string;
  color: string;
}

export interface AntennaConfig {
  frequencyValue: number;
  frequencyUnit: "Hz" | "kHz" | "MHz" | "GHz" | "THz" | "QHz"; // QHz = Quantum Hertz
  dimension: string;
  intensity: number;
  antennaType: string;
}

export interface SignalResponse {
  status: "success" | "noise" | "anomaly" | "whisper";
  entity: string;
  resonance: number;
  message: string;
  spectralAnalysis: string;
  proceduralBypass?: boolean;
  oracleCard?: string;
  astralGlyphs?: string[];
  guidance?: string;
  erraticCoordinates?: string;
  ancientSongFragment?: string;
  dimensionalGlyphs?: string[];
}

export interface TransmitResponse {
  sentStatus: "transmitted" | "refracted" | "absorbed" | "intercepted";
  reaction: string;
  resonance: number;
  spectralAnalysis: string;
  proceduralBypass?: boolean;
  oracleCard?: string;
  astralGlyphs?: string[];
  guidance?: string;
  erraticCoordinates?: string;
  ancientSongFragment?: string;
  dimensionalGlyphs?: string[];
}

export interface LogEntry {
  id: string;
  timestamp: string;
  frequency: string;
  dimension: string;
  entity: string;
  type: "RECEPTOR" | "TRANSMISOR";
  message: string;
  resonance: number;
  spectralAnalysis: string;
  sheetSynced?: boolean;
}
