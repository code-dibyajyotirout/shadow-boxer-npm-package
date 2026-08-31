import React, { useRef, useEffect, useState, useCallback } from "react";
import { Landmark3D, ShadowBoxerConfig, StrikeEvent, StrikeType, WorkoutPreset } from "../types/index.js";
import { useShadowBoxer } from "../hooks/useShadowBoxer.js";
import { PoseOverlay } from "./PoseOverlay.js";
import { MetricsDisplay } from "./MetricsDisplay.js";

export interface ShadowBoxerProps extends ShadowBoxerConfig {
  onStrike?: (event: StrikeEvent) => void;
  onComboComplete?: (streak: number) => void;
  className?: string;
  showMetrics?: boolean;
  showControls?: boolean;
}

export const ShadowBoxer: React.FC<ShadowBoxerProps> = ({
  speedThreshold = 1.5,
  filterCutoff = 1.5,
  enableAudio = true,
  workoutPreset = "all",
  customRoutine,
  onStrike,
  onComboComplete,
  className = "",
  showMetrics = true,
  showControls = true,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [selectedRoutine, setSelectedRoutine] = useState<WorkoutPreset>(workoutPreset);
  const [currentSpeedThreshold, setCurrentSpeedThreshold] = useState<number>(speedThreshold);
  const [currentFilterCutoff, setCurrentFilterCutoff] = useState<number>(filterCutoff);
  const [landmarks, setLandmarks] = useState<Landmark3D[]>([]);

  const { state, start, stop, resetMetrics, processPose } = useShadowBoxer({
    speedThreshold: currentSpeedThreshold,
    filterCutoff: currentFilterCutoff,
    enableAudio,
    workoutPreset: selectedRoutine,
    customRoutine,
    onStrike,
    onComboComplete,
  });

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
        start();
      }
    } catch {
      // Camera permission denied or not available
    }
  }, [start]);

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
      stop();
    }
  }, [stop]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <div className={`sb-root-container ${className}`}>
      {/* Viewport and Canvas Overlay */}
      <div className="sb-viewport-container">
        <video
          ref={videoRef}
          className="sb-video-feed"
          playsInline
          muted
          style={{ width: "100%", height: "auto", display: cameraActive ? "block" : "none" }}
        />
        {!cameraActive && (
          <div className="sb-placeholder">
            <div className="sb-brand-title">SHADOW BOXER</div>
            <div className="sb-subtitle">AI WebAssembly Boxing Physics Engine</div>
            <button type="button" className="sb-btn sb-btn-primary" onClick={startCamera}>
              START ENGINE
            </button>
          </div>
        )}
        {cameraActive && (
          <PoseOverlay
            landmarks={landmarks}
            currentTarget={state.currentStrikeTarget}
            width={640}
            height={480}
          />
        )}
      </div>

      {/* Real-time Telemetry Metrics */}
      {showMetrics && (
        <MetricsDisplay
          metrics={state.activeMetrics}
          comboStreak={state.comboStreak}
          highestCombo={state.highestCombo}
          totalPunches={state.totalPunches}
          peakVelocity={state.peakVelocity}
          score={state.currentScore}
        />
      )}

      {/* Control Panel */}
      {showControls && (
        <div className="sb-controls-panel">
          <div className="sb-controls-row">
            {cameraActive ? (
              <button type="button" className="sb-btn sb-btn-danger" onClick={stopCamera}>
                STOP ENGINE
              </button>
            ) : (
              <button type="button" className="sb-btn sb-btn-primary" onClick={startCamera}>
                START ENGINE
              </button>
            )}
            <button type="button" className="sb-btn sb-btn-secondary" onClick={resetMetrics}>
              RESET STATS
            </button>
          </div>

          <div className="sb-controls-row">
            <label className="sb-label">
              WORKOUT ROUTINE:
              <select
                className="sb-select"
                value={selectedRoutine}
                onChange={(e) => setSelectedRoutine(e.target.value as WorkoutPreset)}
              >
                <option value="all">Mixed Combos</option>
                <option value="cardio">Cardio Blitz</option>
                <option value="power">Heavy Hitter</option>
                <option value="defense">Elusive Boxer</option>
              </select>
            </label>
          </div>

          <div className="sb-settings-sliders">
            <label className="sb-label">
              VELOCITY THRESHOLD: {currentSpeedThreshold.toFixed(1)} m/s
              <input
                type="range"
                min="0.8"
                max="5.0"
                step="0.1"
                value={currentSpeedThreshold}
                onChange={(e) => setCurrentSpeedThreshold(parseFloat(e.target.value))}
                className="sb-range"
              />
            </label>
            <label className="sb-label">
              JITTER SMOOTHING: {currentFilterCutoff.toFixed(1)} Hz
              <input
                type="range"
                min="0.5"
                max="3.0"
                step="0.1"
                value={currentFilterCutoff}
                onChange={(e) => setCurrentFilterCutoff(parseFloat(e.target.value))}
                className="sb-range"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
