import React from "react";
import { PunchMetrics } from "../types/index.js";

export interface MetricsDisplayProps {
  metrics: PunchMetrics | null;
  comboStreak?: number;
  highestCombo?: number;
  totalPunches?: number;
  peakVelocity?: number;
  score?: number;
  className?: string;
}

export const MetricsDisplay: React.FC<MetricsDisplayProps> = ({
  metrics,
  comboStreak = 0,
  highestCombo = 0,
  totalPunches = 0,
  peakVelocity = 0,
  score = 0,
  className = "",
}) => {
  const velocity = metrics ? metrics.velocity.toFixed(1) : "0.0";
  const acceleration = metrics ? metrics.acceleration.toFixed(0) : "0";
  const power = metrics ? metrics.power : 0;
  const alignment = metrics ? metrics.alignmentScore : 0;
  const quality = metrics ? metrics.trajectoryQuality : "OPTIMAL";

  return (
    <div className={`sb-metrics-container ${className}`}>
      <div className="sb-metrics-grid">
        {/* Punch Velocity */}
        <div className="sb-metric-card">
          <div className="sb-metric-label">STRIKE VELOCITY</div>
          <div className="sb-metric-value">{velocity} <span className="sb-unit">m/s</span></div>
          <div className="sb-bar-bg">
            <div
              className="sb-bar-fill sb-bar-cyan"
              style={{ width: `${Math.min(100, (parseFloat(velocity) / 6.0) * 100)}%` }}
            />
          </div>
        </div>

        {/* Instantaneous Acceleration */}
        <div className="sb-metric-card">
          <div className="sb-metric-label">ACCELERATION</div>
          <div className="sb-metric-value">{acceleration} <span className="sb-unit">m/s²</span></div>
          <div className="sb-bar-bg">
            <div
              className="sb-bar-fill sb-bar-magenta"
              style={{ width: `${Math.min(100, (parseFloat(acceleration) / 40.0) * 100)}%` }}
            />
          </div>
        </div>

        {/* Strike Power */}
        <div className="sb-metric-card">
          <div className="sb-metric-label">POWER INDEX</div>
          <div className="sb-metric-value">{power} <span className="sb-unit">%</span></div>
          <div className="sb-bar-bg">
            <div
              className="sb-bar-fill sb-bar-orange"
              style={{ width: `${power}%` }}
            />
          </div>
        </div>

        {/* Alignment & Form */}
        <div className="sb-metric-card">
          <div className="sb-metric-label">TRAJECTORY ({quality})</div>
          <div className="sb-metric-value">{alignment} <span className="sb-unit">%</span></div>
          <div className="sb-bar-bg">
            <div
              className="sb-bar-fill sb-bar-green"
              style={{ width: `${alignment}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stats Summary Strip */}
      <div className="sb-stats-strip">
        <div className="sb-stat-pill">
          <span className="sb-stat-title">SCORE:</span> {score}
        </div>
        <div className="sb-stat-pill">
          <span className="sb-stat-title">COMBO:</span> {comboStreak} (MAX {highestCombo})
        </div>
        <div className="sb-stat-pill">
          <span className="sb-stat-title">TOTAL STRIKES:</span> {totalPunches}
        </div>
        <div className="sb-stat-pill">
          <span className="sb-stat-title">PEAK SPEED:</span> {peakVelocity.toFixed(1)} m/s
        </div>
      </div>
    </div>
  );
};
