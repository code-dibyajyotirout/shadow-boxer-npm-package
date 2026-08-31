import React, { useRef, useEffect } from "react";
import { Landmark3D, StrikeType } from "../types/index.js";

export interface PoseOverlayProps {
  landmarks?: Landmark3D[];
  currentTarget?: StrikeType | null;
  width?: number;
  height?: number;
  className?: string;
}

const POSE_CONNECTIONS = [
  [11, 12], // shoulders
  [11, 13], [13, 15], // left arm
  [12, 14], [14, 16], // right arm
  [11, 23], [12, 24], // torso
  [23, 24], // hips
  [23, 25], [25, 27], // left leg
  [24, 26], [26, 28], // right leg
];

export const PoseOverlay: React.FC<PoseOverlayProps> = ({
  landmarks,
  currentTarget,
  width = 640,
  height = 480,
  className = "",
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    if (!landmarks || landmarks.length < 33) return;

    // Draw skeletal connections
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(0, 229, 255, 0.75)";
    ctx.shadowBlur = 8;
    ctx.shadowColor = "#00e5ff";

    for (const [start, end] of POSE_CONNECTIONS) {
      const p1 = landmarks[start];
      const p2 = landmarks[end];
      if (p1 && p2 && (p1.visibility ?? 1) > 0.5 && (p2.visibility ?? 1) > 0.5) {
        ctx.beginPath();
        ctx.moveTo(p1.x * width, p1.y * height);
        ctx.lineTo(p2.x * width, p2.y * height);
        ctx.stroke();
      }
    }

    // Draw landmark joints
    for (let i = 0; i < landmarks.length; i++) {
      const p = landmarks[i];
      if (!p || (p.visibility ?? 1) < 0.5) continue;

      const px = p.x * width;
      const py = p.y * height;

      ctx.beginPath();
      if (i === 15 || i === 16) {
        // Wrists: Neon Magenta Glow
        ctx.arc(px, py, 9, 0, Math.PI * 2);
        ctx.fillStyle = "#ff007f";
        ctx.shadowColor = "#ff007f";
        ctx.shadowBlur = 12;
      } else if (i === 0) {
        // Head / Nose: Emerald Glow
        ctx.arc(px, py, 7, 0, Math.PI * 2);
        ctx.fillStyle = "#00ff9f";
        ctx.shadowColor = "#00ff9f";
        ctx.shadowBlur = 10;
      } else {
        // Standard Joint: Cyan Glow
        ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fillStyle = "#00e5ff";
        ctx.shadowColor = "#00e5ff";
        ctx.shadowBlur = 6;
      }
      ctx.fill();
    }

    // Draw Target HUD Indicator if active
    if (currentTarget) {
      ctx.save();
      ctx.strokeStyle = "#ffe600";
      ctx.shadowColor = "#ffe600";
      ctx.shadowBlur = 14;
      ctx.lineWidth = 2;

      // Target reticle at center top
      const cx = width / 2;
      const cy = height * 0.28;
      ctx.beginPath();
      ctx.arc(cx, cy, 36, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = "#ffe600";
      ctx.font = "bold 13px Orbitron, monospace, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`TARGET: ${currentTarget}`, cx, cy + 54);
      ctx.restore();
    }
  }, [landmarks, currentTarget, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={`sb-pose-canvas ${className}`}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    />
  );
};
