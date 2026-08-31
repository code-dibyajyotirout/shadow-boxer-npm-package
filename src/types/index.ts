/**
 * Shadow Boxer Core Types and Interfaces
 */

export interface Landmark3D {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export type PoseLandmarks = Landmark3D[];

export type StrikeType = "JAB/CROSS" | "HOOK" | "UPPERCUT" | "SLIP" | "DUCK";

export type StrikeHand = "LEFT" | "RIGHT" | "DEFENSE";

export type StrikeArchetype = "JAB" | "CROSS" | "HOOK" | "UPPERCUT" | "SLIP" | "DUCK";

export interface PunchMetrics {
  velocity: number; // m/s
  acceleration: number; // m/s^2
  power: number; // 0 - 100%
  extension: number; // 0 - 1
  alignmentScore: number; // 0 - 100%
  trajectoryQuality: "OPTIMAL" | "DECENT" | "LOOSE";
}

export interface StrikeEvent {
  id: string;
  timestamp: number;
  hand: StrikeHand;
  type: StrikeType;
  metrics: PunchMetrics;
  isHit?: boolean;
}

export interface StanceStatus {
  guardUp: boolean;
  elbowsTucked: boolean;
  kneesBent: boolean;
  stanceStaggered: boolean;
  stanceWidthOk: boolean;
  overallScore: number;
  feedback: string[];
}

export interface FilterConfig {
  minCutoff: number; // Hz, default 1.5
  beta: number; // velocity multiplier, default 0.007
  dCutoff: number; // derivative cutoff, default 1.0
}

export type WorkoutPreset = "all" | "cardio" | "power" | "defense" | "custom";

export interface WorkoutRoutine {
  id: string;
  name: string;
  description: string;
  targets: StrikeType[];
}

export interface ShadowBoxerConfig {
  speedThreshold?: number; // m/s, default 1.5
  filterCutoff?: number; // Hz, default 1.5
  enableAudio?: boolean;
  workoutPreset?: WorkoutPreset;
  customRoutine?: StrikeType[];
  targetTimeout?: number; // seconds, default 4.0
}

export interface ShadowBoxerState {
  isInitialized: boolean;
  isRunning: boolean;
  currentScore: number;
  comboStreak: number;
  highestCombo: number;
  totalPunches: number;
  peakVelocity: number;
  currentStrikeTarget: StrikeType | null;
  activeMetrics: PunchMetrics | null;
  lastStrike: StrikeEvent | null;
  stance: StanceStatus;
}
