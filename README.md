# @animatrous/shadow-boxer

> **Browser-Native AI WebAssembly Boxing Physics Engine & Real-Time Biomechanics Tracker**

[![npm version](https://img.shields.io/npm/v/@animatrous/shadow-boxer.svg)](https://www.npmjs.com/package/@animatrous/shadow-boxer)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18%2B-61DAFB?logo=react&logoColor=black)](https://react.dev/)

`@animatrous/shadow-boxer` is a modular, high-performance computer vision and biomechanics SDK for browser-based fitness tracking, combat sports telemetry, and motion analysis. It computes 3D punch velocity in $m/s$, instantaneous acceleration in $m/s^2$, joint extension ratios, and strike archetypes in real time at 60 FPS with zero server-side computation.

---

## Installation

```bash
npm install @animatrous/shadow-boxer
```

```bash
yarn add @animatrous/shadow-boxer
```

```bash
pnpm add @animatrous/shadow-boxer
```

---

## Quick Start

### 1. Import Stylesheet

Import the default cyberpunk HUD styles in your application root:

```typescript
import "@animatrous/shadow-boxer/style.css";
```

### 2. Full React Component Integration

```tsx
import React from "react";
import { ShadowBoxer } from "@animatrous/shadow-boxer";
import "@animatrous/shadow-boxer/style.css";

export default function BoxingPage() {
  return (
    <main style={{ padding: 24, background: "#06090e", minHeight: "100vh" }}>
      <ShadowBoxer
        speedThreshold={1.5}
        filterCutoff={1.5}
        enableAudio={true}
        workoutPreset="cardio"
        onStrike={(event) => {
          console.log("Strike landed:", event.type, event.metrics.velocity, "m/s");
        }}
        onComboComplete={(streak) => {
          console.log("Combo completed! Current streak:", streak);
        }}
      />
    </main>
  );
}
```

### 3. Headless React Hook Integration (`useShadowBoxer`)

Build custom UI or 3D viewports while letting `@animatrous/shadow-boxer` handle kinematics, filtering, and classification:

```tsx
import React from "react";
import { useShadowBoxer, PoseOverlay, MetricsDisplay } from "@animatrous/shadow-boxer";

export function CustomBoxingTracker() {
  const { state, start, stop, resetMetrics, processPose } = useShadowBoxer({
    speedThreshold: 1.5,
    filterCutoff: 1.5,
    enableAudio: true,
    workoutPreset: "all",
  });

  return (
    <div>
      <MetricsDisplay
        metrics={state.activeMetrics}
        comboStreak={state.comboStreak}
        highestCombo={state.highestCombo}
        totalPunches={state.totalPunches}
        peakVelocity={state.peakVelocity}
        score={state.currentScore}
      />
      <button onClick={start}>Start Tracking</button>
      <button onClick={stop}>Stop</button>
    </div>
  );
}
```

---

## Subpath Imports

`@animatrous/shadow-boxer` provides modular exports for minimal bundle footprints:

```typescript
// Core Root
import { ShadowBoxer, useShadowBoxer, BiomechanicsEngine, OneEuroFilter } from "@animatrous/shadow-boxer";

// Dedicated Hooks
import { useShadowBoxer, useAudioFX } from "@animatrous/shadow-boxer/hooks";

// Dedicated Components
import { ShadowBoxer, PoseOverlay, MetricsDisplay } from "@animatrous/shadow-boxer/components";

// Dedicated Utilities
import { BiomechanicsEngine, OneEuroFilter, StrikeClassifier, AudioSynthesizer } from "@animatrous/shadow-boxer/utils";

// Dedicated Types
import type { Landmark3D, PunchMetrics, StrikeEvent, StanceStatus } from "@animatrous/shadow-boxer/types";
```

---

## API Reference

### `BiomechanicsEngine`

Static kinematic calculator for 3D coordinates:

- `distance3D(p1: Landmark3D, p2: Landmark3D): number`
- `calculateAngle(a: Landmark3D, b: Landmark3D, c: Landmark3D): number`
- `computeVelocity(pPrev: Landmark3D, pCurr: Landmark3D, dtSeconds: number, scaleFactor?: number): number`
- `computeAcceleration(vPrev: number, vCurr: number, dtSeconds: number): number`
- `computeExtensionRatio(shoulder: Landmark3D, elbow: Landmark3D, wrist: Landmark3D): number`
- `evaluateStance(landmarks: Landmark3D[]): StanceStatus`

### `OneEuroFilter` & `LandmarkFilter3D`

Adaptive low-pass filter algorithm suppressing coordinate jitter without adding latency during rapid movement:

```typescript
import { OneEuroFilter } from "@animatrous/shadow-boxer/utils";

const filter = new OneEuroFilter(60, 1.5, 0.007, 1.0);
const smoothedX = filter.filter(rawX, performance.now());
```

### `StrikeClassifier`

Identifies five strike and defense archetypes:

- `JAB/CROSS`: Extended arm along dominant axis (elbow angle > 130 degrees).
- `HOOK`: Horizontal angular displacement with bent elbow (45 - 135 degrees).
- `UPPERCUT`: Upward wrist trajectory with vertical flexion.
- `SLIP`: Rapid lateral head displacement.
- `DUCK`: Rapid downward head and torso drop.

---

## Security & Privacy Model

`@animatrous/shadow-boxer` executes all landmark filters, mathematical calculations, and classification loops entirely inside the client-side JavaScript runtime. No camera frames, biometric measurements, or telemetry data are stored or transmitted across network sockets.

---

## License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**. See the [LICENSE](LICENSE) file for details.
