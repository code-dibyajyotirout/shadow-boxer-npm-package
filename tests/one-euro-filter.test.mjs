import test from "node:test";
import assert from "node:assert/strict";
import { OneEuroFilter, LandmarkFilter3D } from "../dist/utils/OneEuroFilter.js";

test("OneEuroFilter Test Suite", async (t) => {
  await t.test("initializes correctly and returns initial value", () => {
    const filter = new OneEuroFilter(60, 1.5, 0.007, 1.0);
    const result = filter.filter(10.0, 1000);
    assert.strictEqual(result, 10.0);
  });

  await t.test("smooths noisy stationary signal", () => {
    const filter = new OneEuroFilter(60, 1.0, 0.001, 1.0);
    let time = 1000;
    const baseValue = 5.0;
    const filteredValues = [];

    for (let i = 0; i < 20; i++) {
      time += 16;
      // Add artificial alternating noise (+0.5, -0.5)
      const noisyValue = baseValue + (i % 2 === 0 ? 0.5 : -0.5);
      const filtered = filter.filter(noisyValue, time);
      filteredValues.push(filtered);
    }

    const lastFiltered = filteredValues[filteredValues.length - 1];
    // Check that variance from baseValue is significantly damped
    assert.ok(Math.abs(lastFiltered - baseValue) < 0.4, "Noise should be significantly damped");
  });

  await t.test("tracks fast transitions with low lag", () => {
    const filter = new OneEuroFilter(60, 1.5, 0.05, 1.0);
    let time = 1000;

    // Settle at 0
    for (let i = 0; i < 10; i++) {
      time += 16;
      filter.filter(0.0, time);
    }

    // Step change to 100
    time += 16;
    const stepResponse = filter.filter(100.0, time);
    assert.ok(stepResponse > 10.0, "High velocity movement should adapt filter cutoff rapidly");
  });

  await t.test("LandmarkFilter3D filters all three 3D axes", () => {
    const filter3D = new LandmarkFilter3D(1.5, 0.007);
    const landmark = { x: 0.5, y: 0.8, z: -0.2, visibility: 0.99 };
    const filtered = filter3D.filter(landmark, 1000);

    assert.strictEqual(filtered.x, 0.5);
    assert.strictEqual(filtered.y, 0.8);
    assert.strictEqual(filtered.z, -0.2);
    assert.strictEqual(filtered.visibility, 0.99);
  });
});
