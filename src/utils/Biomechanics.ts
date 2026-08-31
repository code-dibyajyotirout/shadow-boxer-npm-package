import { Landmark3D, PunchMetrics, StanceStatus } from "../types/index.js";

/**
 * BiomechanicsEngine provides mathematical transforms, kinematics, and physics evaluation
 * for real-time shadow boxing analysis.
 */
export class BiomechanicsEngine {
  /**
   * Calculates Euclidean distance between two 3D points
   */
  public static distance3D(p1: Landmark3D, p2: Landmark3D): number {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    const dz = (p1.z || 0) - (p2.z || 0);
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Calculates 2D Euclidean distance in the XY plane
   */
  public static distance2D(p1: Landmark3D, p2: Landmark3D): number {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Calculates joint angle (in degrees) between three points (A -> B -> C) where B is the vertex
   */
  public static calculateAngle(a: Landmark3D, b: Landmark3D, c: Landmark3D): number {
    const ab = { x: a.x - b.x, y: a.y - b.y, z: (a.z || 0) - (b.z || 0) };
    const cb = { x: c.x - b.x, y: c.y - b.y, z: (c.z || 0) - (b.z || 0) };

    const dot = ab.x * cb.x + ab.y * cb.y + ab.z * cb.z;
    const magAB = Math.sqrt(ab.x * ab.x + ab.y * ab.y + ab.z * ab.z);
    const magCB = Math.sqrt(cb.x * cb.x + cb.y * cb.y + cb.z * cb.z);

    if (magAB * magCB === 0) return 0;
    const cosine = Math.max(-1.0, Math.min(1.0, dot / (magAB * magCB)));
    return (Math.acos(cosine) * 180.0) / Math.PI;
  }

  /**
   * Computes punch speed in meters per second (m/s) given 3D displacement and elapsed time
   */
  public static computeVelocity(pPrev: Landmark3D, pCurr: Landmark3D, dtSeconds: number, scaleFactor: number = 2.5): number {
    if (dtSeconds <= 0) return 0;
    const rawDist = this.distance3D(pPrev, pCurr);
    // Convert normalized webcam units to approximate metric scale (average human reach)
    return (rawDist * scaleFactor) / dtSeconds;
  }

  /**
   * Computes punch acceleration in m/s^2 given two consecutive velocity samples
   */
  public static computeAcceleration(vPrev: number, vCurr: number, dtSeconds: number): number {
    if (dtSeconds <= 0) return 0;
    return (vCurr - vPrev) / dtSeconds;
  }

  /**
   * Computes arm extension ratio (0.0 to 1.0) based on elbow angle
   */
  public static computeExtensionRatio(shoulder: Landmark3D, elbow: Landmark3D, wrist: Landmark3D): number {
    const angle = this.calculateAngle(shoulder, elbow, wrist);
    // Fully bent elbow ~ 45 deg, fully extended ~ 170 deg
    const clampedAngle = Math.max(45, Math.min(175, angle));
    return (clampedAngle - 45) / (175 - 45);
  }

  /**
   * Evaluates punch trajectory quality and alignment score
   */
  public static evaluateTrajectory(
    shoulder: Landmark3D,
    elbow: Landmark3D,
    wrist: Landmark3D,
    velocity: number
  ): { alignmentScore: number; quality: "OPTIMAL" | "DECENT" | "LOOSE" } {
    const angle = this.calculateAngle(shoulder, elbow, wrist);
    const yDeviation = Math.abs(wrist.y - shoulder.y);

    let score = 70;
    if (angle > 145 && yDeviation < 0.25) {
      score = Math.min(100, Math.round(85 + (velocity / 5.0) * 15));
    } else if (angle > 120) {
      score = Math.min(85, Math.round(65 + (velocity / 4.0) * 15));
    } else {
      score = Math.max(30, Math.round(40 + (velocity / 3.0) * 20));
    }

    let quality: "OPTIMAL" | "DECENT" | "LOOSE" = "DECENT";
    if (score >= 85) quality = "OPTIMAL";
    else if (score < 60) quality = "LOOSE";

    return { alignmentScore: score, quality };
  }

  /**
   * Compiles comprehensive punch metrics
   */
  public static computePunchMetrics(
    pPrev: Landmark3D,
    pCurr: Landmark3D,
    shoulder: Landmark3D,
    elbow: Landmark3D,
    vPrev: number,
    dtSeconds: number
  ): PunchMetrics {
    const velocity = this.computeVelocity(pPrev, pCurr, dtSeconds);
    const acceleration = Math.max(0, this.computeAcceleration(vPrev, velocity, dtSeconds));
    const extension = this.computeExtensionRatio(shoulder, elbow, pCurr);
    const { alignmentScore, quality } = this.evaluateTrajectory(shoulder, elbow, pCurr, velocity);

    // Power index: function of velocity (60%), acceleration (20%), and extension (20%)
    const normalizedSpeed = Math.min(1.0, velocity / 6.0);
    const normalizedAccel = Math.min(1.0, acceleration / 30.0);
    const power = Math.min(100, Math.round((normalizedSpeed * 0.6 + normalizedAccel * 0.2 + extension * 0.2) * 100));

    return {
      velocity,
      acceleration,
      power,
      extension,
      alignmentScore,
      trajectoryQuality: quality,
    };
  }

  /**
   * Evaluates overall boxing stance stability and guard positioning
   */
  public static evaluateStance(landmarks: Landmark3D[]): StanceStatus {
    const feedback: string[] = [];
    if (!landmarks || landmarks.length < 33) {
      return {
        guardUp: false,
        elbowsTucked: false,
        kneesBent: false,
        stanceStaggered: false,
        stanceWidthOk: false,
        overallScore: 0,
        feedback: ["Full body not visible in frame"],
      };
    }

    const nose = landmarks[0];
    const leftWrist = landmarks[15];
    const rightWrist = landmarks[16];
    const leftElbow = landmarks[13];
    const rightElbow = landmarks[14];
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];
    const leftKnee = landmarks[25];
    const rightKnee = landmarks[26];
    const leftAnkle = landmarks[27];
    const rightAnkle = landmarks[28];

    // 1. Guard Up (hands near chin level)
    const chinY = nose.y + 0.1;
    const guardUp = leftWrist.y <= chinY + 0.15 && rightWrist.y <= chinY + 0.15;
    if (!guardUp) {
      feedback.push("Guard dropped! Bring hands back to protect your chin.");
    }

    // 2. Elbows Tucked
    const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);
    const elbowWidth = Math.abs(leftElbow.x - rightElbow.x);
    const elbowsTucked = elbowWidth <= shoulderWidth * 1.35;
    if (!elbowsTucked) {
      feedback.push("Tuck your elbows! Do not flare them out wide.");
    }

    // 3. Knees Bent
    const leftKneeAngle = this.calculateAngle(leftHip, leftKnee, leftAnkle);
    const rightKneeAngle = this.calculateAngle(rightHip, rightKnee, rightAnkle);
    const kneesBent = leftKneeAngle < 170 && rightKneeAngle < 170;
    if (!kneesBent) {
      feedback.push("Locked knees! Keep knees slightly bent to absorb impact.");
    }

    // 4. Stance Staggered (one foot forward, one foot back)
    const ankleZDiff = Math.abs((leftAnkle.z || 0) - (rightAnkle.z || 0));
    const stanceStaggered = ankleZDiff > 0.08 || Math.abs(leftAnkle.y - rightAnkle.y) > 0.05;
    if (!stanceStaggered) {
      feedback.push("Do not stand square! Stagger your stance for boxing balance.");
    }

    // 5. Stance Width
    const ankleWidth = Math.abs(leftAnkle.x - rightAnkle.x);
    const stanceWidthOk = ankleWidth >= shoulderWidth * 0.8 && ankleWidth <= shoulderWidth * 2.0;
    if (!stanceWidthOk) {
      feedback.push(ankleWidth < shoulderWidth * 0.8 ? "Feet too narrow! Widen your base." : "Stance too wide!");
    }

    let score = 0;
    if (guardUp) score += 30;
    if (elbowsTucked) score += 20;
    if (kneesBent) score += 20;
    if (stanceStaggered) score += 15;
    if (stanceWidthOk) score += 15;

    if (feedback.length === 0) {
      feedback.push("Stance is fully balanced. Ready to strike!");
    }

    return {
      guardUp,
      elbowsTucked,
      kneesBent,
      stanceStaggered,
      stanceWidthOk,
      overallScore: score,
      feedback,
    };
  }
}
