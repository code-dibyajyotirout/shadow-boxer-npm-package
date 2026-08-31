import test from "node:test";
import assert from "node:assert/strict";
import { BiomechanicsEngine } from "../dist/utils/Biomechanics.js";

test("BiomechanicsEngine Test Suite", async (t) => {
  await t.test("computes Euclidean 3D and 2D distances correctly", () => {
    const p1 = { x: 0, y: 0, z: 0 };
    const p2 = { x: 3, y: 4, z: 0 };
    assert.strictEqual(BiomechanicsEngine.distance2D(p1, p2), 5);
    assert.strictEqual(BiomechanicsEngine.distance3D(p1, p2), 5);

    const p3 = { x: 0, y: 0, z: 12 };
    assert.strictEqual(BiomechanicsEngine.distance3D(p1, p3), 12);
  });

  await t.test("calculates joint angles with high precision", () => {
    // 90 degree right angle: (0,1) -> (0,0) -> (1,0)
    const a = { x: 0, y: 1, z: 0 };
    const b = { x: 0, y: 0, z: 0 }; // vertex
    const c = { x: 1, y: 0, z: 0 };
    const angle90 = BiomechanicsEngine.calculateAngle(a, b, c);
    assert.ok(Math.abs(angle90 - 90.0) < 0.001, `Expected 90 deg, got ${angle90}`);

    // 180 degree straight line: (-1,0) -> (0,0) -> (1,0)
    const a180 = { x: -1, y: 0, z: 0 };
    const angle180 = BiomechanicsEngine.calculateAngle(a180, b, c);
    assert.ok(Math.abs(angle180 - 180.0) < 0.001, `Expected 180 deg, got ${angle180}`);
  });

  await t.test("computes punch velocity and acceleration accurately", () => {
    const pPrev = { x: 0.1, y: 0.2, z: 0.1 };
    const pCurr = { x: 0.1, y: 0.2, z: 0.3 }; // 0.2 units in z
    const dt = 0.05; // 50ms
    const velocity = BiomechanicsEngine.computeVelocity(pPrev, pCurr, dt, 2.5);
    // (0.2 * 2.5) / 0.05 = 10.0 m/s
    assert.ok(Math.abs(velocity - 10.0) < 0.001, `Expected 10.0 m/s, got ${velocity}`);

    const accel = BiomechanicsEngine.computeAcceleration(2.0, 10.0, dt);
    // (10.0 - 2.0) / 0.05 = 160 m/s^2
    assert.ok(Math.abs(accel - 160.0) < 0.001, `Expected 160 m/s^2, got ${accel}`);
  });

  await t.test("evaluates full stance and guard posture", () => {
    // Generate mock 33 landmarks for full human skeleton
    const mockLandmarks = Array.from({ length: 33 }, (_, i) => ({
      x: 0.5,
      y: 0.5 + i * 0.01,
      z: 0.0,
      visibility: 0.99,
    }));

    // Setup good guard and stance coordinates
    mockLandmarks[0] = { x: 0.5, y: 0.2, z: 0.0 }; // nose
    mockLandmarks[11] = { x: 0.4, y: 0.3, z: 0.0 }; // left shoulder
    mockLandmarks[12] = { x: 0.6, y: 0.3, z: 0.0 }; // right shoulder
    mockLandmarks[13] = { x: 0.38, y: 0.4, z: 0.0 }; // left elbow (tucked)
    mockLandmarks[14] = { x: 0.62, y: 0.4, z: 0.0 }; // right elbow (tucked)
    mockLandmarks[15] = { x: 0.45, y: 0.28, z: 0.0 }; // left wrist (guard up)
    mockLandmarks[16] = { x: 0.55, y: 0.28, z: 0.0 }; // right wrist (guard up)
    mockLandmarks[23] = { x: 0.45, y: 0.6, z: 0.0 }; // left hip
    mockLandmarks[24] = { x: 0.55, y: 0.6, z: 0.0 }; // right hip
    mockLandmarks[25] = { x: 0.45, y: 0.75, z: 0.0 }; // left knee
    mockLandmarks[26] = { x: 0.55, y: 0.75, z: 0.0 }; // right knee
    mockLandmarks[27] = { x: 0.42, y: 0.9, z: -0.1 }; // left ankle (staggered)
    mockLandmarks[28] = { x: 0.58, y: 0.9, z: 0.1 }; // right ankle (staggered)

    const stance = BiomechanicsEngine.evaluateStance(mockLandmarks);
    assert.ok(typeof stance.overallScore === "number");
    assert.ok(stance.guardUp, "Guard should be detected as UP");
    assert.ok(stance.elbowsTucked, "Elbows should be detected as TUCKED");
  });
});
