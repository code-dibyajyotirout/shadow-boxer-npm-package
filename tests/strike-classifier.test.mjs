import test from "node:test";
import assert from "node:assert/strict";
import { StrikeClassifier } from "../dist/utils/StrikeClassifier.js";

test("StrikeClassifier Test Suite", async (t) => {
  await t.test("recognizes high-extension forward punch as JAB/CROSS", () => {
    // Shoulder, extended elbow, wrist in a straight line forward
    const shoulder = { x: 0.4, y: 0.3, z: 0.0 };
    const elbow = { x: 0.4, y: 0.3, z: 0.25 };
    const wrist = { x: 0.4, y: 0.3, z: 0.55 }; // fully extended forward
    const wristPrev = { x: 0.4, y: 0.3, z: 0.35 };

    const result = StrikeClassifier.classifyStrike(shoulder, elbow, wrist, wristPrev, 3.2, 1.2);
    assert.ok(result !== null, "Strike should be classified");
    assert.strictEqual(result.type, "JAB/CROSS");
    assert.ok(result.confidence > 0.7, "Confidence should exceed 0.7");
  });

  await t.test("recognizes bent upward punch as UPPERCUT", () => {
    const shoulder = { x: 0.4, y: 0.4, z: 0.0 };
    const elbow = { x: 0.4, y: 0.55, z: 0.1 };
    const wrist = { x: 0.4, y: 0.35, z: 0.15 }; // wrist higher than elbow, moving up
    const wristPrev = { x: 0.4, y: 0.45, z: 0.15 }; // upward displacement (dy = -0.1)

    const result = StrikeClassifier.classifyStrike(shoulder, elbow, wrist, wristPrev, 2.8, 1.2);
    assert.ok(result !== null, "Uppercut should be detected");
    assert.strictEqual(result.type, "UPPERCUT");
  });

  await t.test("recognizes lateral curved punch as HOOK", () => {
    const shoulder = { x: 0.3, y: 0.4, z: 0.0 };
    const elbow = { x: 0.15, y: 0.4, z: 0.15 };
    const wrist = { x: 0.45, y: 0.4, z: 0.2 }; // swinging horizontally across
    const wristPrev = { x: 0.35, y: 0.4, z: 0.2 }; // dx = 0.1

    const result = StrikeClassifier.classifyStrike(shoulder, elbow, wrist, wristPrev, 2.5, 1.2);
    assert.ok(result !== null, "Hook should be detected");
    assert.strictEqual(result.type, "HOOK");
  });

  await t.test("recognizes evasive head drop as DUCK and lateral shift as SLIP", () => {
    const noseHeadDrop = { x: 0.5, y: 0.32, z: 0.0 };
    const nosePrev = { x: 0.5, y: 0.25, z: 0.0 }; // dy = +0.07 (head dropped)

    const duckResult = StrikeClassifier.classifyDefense(noseHeadDrop, nosePrev);
    assert.ok(duckResult !== null);
    assert.strictEqual(duckResult.type, "DUCK");

    const noseLateralShift = { x: 0.58, y: 0.25, z: 0.0 }; // dx = +0.08 (head slipped)
    const slipResult = StrikeClassifier.classifyDefense(noseLateralShift, nosePrev);
    assert.ok(slipResult !== null);
    assert.strictEqual(slipResult.type, "SLIP");
  });

  await t.test("ignores sub-threshold movements", () => {
    const shoulder = { x: 0.4, y: 0.3, z: 0.0 };
    const elbow = { x: 0.4, y: 0.3, z: 0.2 };
    const wrist = { x: 0.4, y: 0.3, z: 0.4 };
    const wristPrev = { x: 0.4, y: 0.3, z: 0.39 };

    // Velocity 0.5 is lower than threshold 1.5
    const result = StrikeClassifier.classifyStrike(shoulder, elbow, wrist, wristPrev, 0.5, 1.5);
    assert.strictEqual(result, null, "Should return null for low speed motion");
  });
});
