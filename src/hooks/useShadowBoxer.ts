import { useState, useRef, useCallback, useEffect } from "react";
import {
  Landmark3D,
  PunchMetrics,
  ShadowBoxerConfig,
  ShadowBoxerState,
  StanceStatus,
  StrikeEvent,
  StrikeType,
  WorkoutPreset,
} from "../types/index.js";
import { LandmarkFilter3D } from "../utils/OneEuroFilter.js";
import { BiomechanicsEngine } from "../utils/Biomechanics.js";
import { StrikeClassifier } from "../utils/StrikeClassifier.js";
import { AudioSynthesizer } from "../utils/AudioSynthesizer.js";

export interface UseShadowBoxerOptions extends ShadowBoxerConfig {
  onStrike?: (event: StrikeEvent) => void;
  onComboComplete?: (streak: number) => void;
  onMetricsUpdate?: (metrics: PunchMetrics) => void;
  onStanceUpdate?: (stance: StanceStatus) => void;
}

const DEFAULT_ROUTINES: Record<WorkoutPreset, StrikeType[]> = {
  all: ["JAB/CROSS", "HOOK", "UPPERCUT", "SLIP", "DUCK"],
  cardio: ["JAB/CROSS", "JAB/CROSS", "HOOK"],
  power: ["HOOK", "UPPERCUT", "HOOK"],
  defense: ["SLIP", "DUCK", "JAB/CROSS"],
  custom: ["JAB/CROSS", "HOOK"],
};

export function useShadowBoxer(options: UseShadowBoxerOptions = {}) {
  const {
    speedThreshold = 1.5,
    filterCutoff = 1.5,
    enableAudio = true,
    workoutPreset = "all",
    customRoutine,
    targetTimeout = 4.0,
    onStrike,
    onComboComplete,
    onMetricsUpdate,
    onStanceUpdate,
  } = options;

  const [state, setState] = useState<ShadowBoxerState>({
    isInitialized: true,
    isRunning: false,
    currentScore: 0,
    comboStreak: 0,
    highestCombo: 0,
    totalPunches: 0,
    peakVelocity: 0,
    currentStrikeTarget: null,
    activeMetrics: null,
    lastStrike: null,
    stance: {
      guardUp: false,
      elbowsTucked: false,
      kneesBent: false,
      stanceStaggered: false,
      stanceWidthOk: false,
      overallScore: 0,
      feedback: [],
    },
  });

  // Signal filters for wrists and head
  const leftWristFilter = useRef(new LandmarkFilter3D(filterCutoff, 0.007));
  const rightWristFilter = useRef(new LandmarkFilter3D(filterCutoff, 0.007));
  const noseFilter = useRef(new LandmarkFilter3D(filterCutoff, 0.007));

  // Previous tracking samples
  const prevLeftWrist = useRef<Landmark3D | null>(null);
  const prevRightWrist = useRef<Landmark3D | null>(null);
  const prevNose = useRef<Landmark3D | null>(null);
  const prevTime = useRef<number>(0);
  const prevLeftSpeed = useRef<number>(0);
  const prevRightSpeed = useRef<number>(0);

  // Audio synthesizer
  const audioSynth = useRef<AudioSynthesizer | null>(null);

  useEffect(() => {
    audioSynth.current = new AudioSynthesizer(enableAudio);
    return () => {
      audioSynth.current = null;
    };
  }, [enableAudio]);

  const activeRoutine = useRef<StrikeType[]>(
    workoutPreset === "custom" && customRoutine && customRoutine.length > 0
      ? customRoutine
      : DEFAULT_ROUTINES[workoutPreset] || DEFAULT_ROUTINES.all
  );

  const routineIndex = useRef(0);
  const lastTargetTime = useRef(0);

  const getNextTarget = useCallback((): StrikeType => {
    const list = activeRoutine.current;
    if (!list || list.length === 0) return "JAB/CROSS";
    const target = list[routineIndex.current % list.length];
    routineIndex.current += 1;
    return target;
  }, []);

  const start = useCallback(() => {
    leftWristFilter.current.reset();
    rightWristFilter.current.reset();
    noseFilter.current.reset();
    prevLeftWrist.current = null;
    prevRightWrist.current = null;
    prevNose.current = null;
    prevTime.current = 0;
    prevLeftSpeed.current = 0;
    prevRightSpeed.current = 0;
    routineIndex.current = 0;
    lastTargetTime.current = Date.now();

    const firstTarget = getNextTarget();
    setState((prev) => ({
      ...prev,
      isRunning: true,
      currentStrikeTarget: firstTarget,
    }));
  }, [getNextTarget]);

  const stop = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isRunning: false,
      currentStrikeTarget: null,
    }));
  }, []);

  const resetMetrics = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentScore: 0,
      comboStreak: 0,
      highestCombo: 0,
      totalPunches: 0,
      peakVelocity: 0,
      activeMetrics: null,
      lastStrike: null,
    }));
  }, []);

  /**
   * Main pose processing routine
   */
  const processPose = useCallback(
    (rawLandmarks: Landmark3D[], timestamp: number = Date.now()) => {
      if (!rawLandmarks || rawLandmarks.length < 33) return;

      const dtSeconds = prevTime.current ? Math.max(0.001, (timestamp - prevTime.current) / 1000.0) : 0.016;
      prevTime.current = timestamp;

      // Filter critical keypoints
      const nose = noseFilter.current.filter(rawLandmarks[0], timestamp);
      const leftShoulder = rawLandmarks[11];
      const rightShoulder = rawLandmarks[12];
      const leftElbow = rawLandmarks[13];
      const rightElbow = rawLandmarks[14];
      const leftWrist = leftWristFilter.current.filter(rawLandmarks[15], timestamp);
      const rightWrist = rightWristFilter.current.filter(rawLandmarks[16], timestamp);

      // Evaluate full body stance
      const stance = BiomechanicsEngine.evaluateStance(rawLandmarks);
      onStanceUpdate?.(stance);

      // Analyze left arm
      let leftMetrics: PunchMetrics | null = null;
      let leftClassified = null;
      if (prevLeftWrist.current) {
        leftMetrics = BiomechanicsEngine.computePunchMetrics(
          prevLeftWrist.current,
          leftWrist,
          leftShoulder,
          leftElbow,
          prevLeftSpeed.current,
          dtSeconds
        );
        prevLeftSpeed.current = leftMetrics.velocity;
        leftClassified = StrikeClassifier.classifyStrike(
          leftShoulder,
          leftElbow,
          leftWrist,
          prevLeftWrist.current,
          leftMetrics.velocity,
          speedThreshold
        );
      }

      // Analyze right arm
      let rightMetrics: PunchMetrics | null = null;
      let rightClassified = null;
      if (prevRightWrist.current) {
        rightMetrics = BiomechanicsEngine.computePunchMetrics(
          prevRightWrist.current,
          rightWrist,
          rightShoulder,
          rightElbow,
          prevRightSpeed.current,
          dtSeconds
        );
        prevRightSpeed.current = rightMetrics.velocity;
        rightClassified = StrikeClassifier.classifyStrike(
          rightShoulder,
          rightElbow,
          rightWrist,
          prevRightWrist.current,
          rightMetrics.velocity,
          speedThreshold
        );
      }

      // Analyze evasive head movement
      let defenseClassified = null;
      if (prevNose.current) {
        defenseClassified = StrikeClassifier.classifyDefense(nose, prevNose.current);
      }

      // Determine active strike event
      let strikeEvent: StrikeEvent | null = null;
      if (leftClassified && leftMetrics && leftMetrics.velocity >= speedThreshold) {
        strikeEvent = {
          id: `strike-${timestamp}`,
          timestamp,
          hand: "LEFT",
          type: leftClassified.type,
          metrics: leftMetrics,
        };
      } else if (rightClassified && rightMetrics && rightMetrics.velocity >= speedThreshold) {
        strikeEvent = {
          id: `strike-${timestamp}`,
          timestamp,
          hand: "RIGHT",
          type: rightClassified.type,
          metrics: rightMetrics,
        };
      } else if (defenseClassified) {
        strikeEvent = {
          id: `defense-${timestamp}`,
          timestamp,
          hand: "DEFENSE",
          type: defenseClassified.type,
          metrics: {
            velocity: 1.0,
            acceleration: 10,
            power: 50,
            extension: 0.5,
            alignmentScore: 90,
            trajectoryQuality: "OPTIMAL",
          },
        };
      }

      // Update previous coordinates
      prevLeftWrist.current = leftWrist;
      prevRightWrist.current = rightWrist;
      prevNose.current = nose;

      if (strikeEvent) {
        // Trigger procedural audio feedback
        if (strikeEvent.hand !== "DEFENSE") {
          audioSynth.current?.playSwoosh(strikeEvent.metrics.velocity / 3.0);
          audioSynth.current?.playImpact(strikeEvent.metrics.power);
        }

        onStrike?.(strikeEvent);
        onMetricsUpdate?.(strikeEvent.metrics);

        setState((prev) => {
          const isHit = prev.currentStrikeTarget === strikeEvent?.type;
          const newStreak = isHit ? prev.comboStreak + 1 : 0;
          const newHighest = Math.max(prev.highestCombo, newStreak);
          const scoreDelta = isHit ? Math.round(strikeEvent.metrics.power * 10) : 0;

          if (isHit && newStreak > 0 && newStreak % 3 === 0) {
            audioSynth.current?.playComboComplete();
            onComboComplete?.(newStreak);
          } else if (!isHit && prev.isRunning) {
            audioSynth.current?.playMissTone();
          }

          const nextTarget = isHit ? getNextTarget() : prev.currentStrikeTarget;

          return {
            ...prev,
            currentScore: prev.currentScore + scoreDelta,
            comboStreak: newStreak,
            highestCombo: newHighest,
            totalPunches: prev.totalPunches + 1,
            peakVelocity: Math.max(prev.peakVelocity, strikeEvent.metrics.velocity),
            currentStrikeTarget: nextTarget,
            activeMetrics: strikeEvent.metrics,
            lastStrike: strikeEvent,
            stance,
          };
        });
      } else {
        setState((prev) => ({ ...prev, stance }));
      }
    },
    [speedThreshold, onStanceUpdate, onStrike, onMetricsUpdate, onComboComplete, getNextTarget]
  );

  return {
    state,
    start,
    stop,
    resetMetrics,
    processPose,
  };
}
