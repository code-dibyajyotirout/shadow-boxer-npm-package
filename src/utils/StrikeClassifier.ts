import { Landmark3D, StrikeArchetype, StrikeType } from "../types/index.js";
import { BiomechanicsEngine } from "./Biomechanics.js";

export interface ClassificationInput {
  shoulder: Landmark3D;
  elbow: Landmark3D;
  wrist: Landmark3D;
  wristPrev: Landmark3D;
  nose: Landmark3D;
  nosePrev?: Landmark3D;
  hipsCenter?: Landmark3D;
}

/**
 * StrikeClassifier identifies boxing strike archetypes and evasive maneuvers in real time.
 */
export class StrikeClassifier {
  /**
   * Classifies an offensive strike from upper body landmarks
   */
  public static classifyStrike(
    shoulder: Landmark3D,
    elbow: Landmark3D,
    wrist: Landmark3D,
    wristPrev: Landmark3D,
    velocity: number,
    minSpeedThreshold: number = 1.2
  ): { type: StrikeType; archetype: StrikeArchetype; confidence: number } | null {
    if (velocity < minSpeedThreshold) {
      return null;
    }

    const elbowAngle = BiomechanicsEngine.calculateAngle(shoulder, elbow, wrist);
    const dy = wrist.y - wristPrev.y; // Negative dy means moving upward
    const dx = wrist.x - wristPrev.x;
    const dz = (wrist.z || 0) - (wristPrev.z || 0);

    // 1. UPPERCUT: Upward vertical trajectory (dy < -0.03) + bent elbow (40 - 125 deg)
    if (dy < -0.03 && elbowAngle >= 40 && elbowAngle <= 125 && wrist.y < elbow.y + 0.1) {
      const confidence = Math.min(0.98, 0.75 + Math.abs(dy) * 2.0);
      return { type: "UPPERCUT", archetype: "UPPERCUT", confidence };
    }

    // 2. HOOK: Horizontal curved motion (high abs(dx)) + bent elbow (45 - 135 deg)
    if (Math.abs(dx) > 0.04 && elbowAngle >= 45 && elbowAngle <= 135) {
      const confidence = Math.min(0.95, 0.7 + Math.abs(dx) * 2.0);
      return { type: "HOOK", archetype: "HOOK", confidence };
    }

    // 3. JAB / CROSS: High arm extension (angle > 135 deg) + forward thrust (dz or dominant forward vector)
    if (elbowAngle > 130) {
      const confidence = Math.min(0.99, 0.8 + (elbowAngle / 180.0) * 0.19);
      const isCross = Math.abs(wrist.x - shoulder.x) > 0.15;
      return {
        type: "JAB/CROSS",
        archetype: isCross ? "CROSS" : "JAB",
        confidence,
      };
    }

    // Default to JAB/CROSS if extension is moderate and speed is fast
    if (elbowAngle > 115) {
      return { type: "JAB/CROSS", archetype: "JAB", confidence: 0.7 };
    }

    return null;
  }

  /**
   * Classifies defensive evasion movements (Slip, Duck)
   */
  public static classifyDefense(
    noseCurr: Landmark3D,
    nosePrev: Landmark3D,
    torsoCenter?: Landmark3D
  ): { type: StrikeType; confidence: number } | null {
    const dx = noseCurr.x - nosePrev.x;
    const dy = noseCurr.y - nosePrev.y; // Positive dy means dropping down

    // 1. DUCK / WEAVE: Rapid downward head drop (dy > 0.04)
    if (dy > 0.035) {
      return { type: "DUCK", confidence: Math.min(0.95, 0.7 + dy * 3.0) };
    }

    // 2. SLIP: Rapid lateral head displacement (abs(dx) > 0.04)
    if (Math.abs(dx) > 0.035) {
      return { type: "SLIP", confidence: Math.min(0.95, 0.7 + Math.abs(dx) * 3.0) };
    }

    return null;
  }
}
