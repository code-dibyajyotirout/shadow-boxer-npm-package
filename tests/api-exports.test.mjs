import test from "node:test";
import assert from "node:assert/strict";

test("Public API Exports Test Suite", async (t) => {
  await t.test("Root index exports all expected classes and components", async () => {
    const root = await import("../dist/index.js");
    assert.ok(root.OneEuroFilter, "OneEuroFilter should be exported from root");
    assert.ok(root.LandmarkFilter3D, "LandmarkFilter3D should be exported from root");
    assert.ok(root.BiomechanicsEngine, "BiomechanicsEngine should be exported from root");
    assert.ok(root.StrikeClassifier, "StrikeClassifier should be exported from root");
    assert.ok(root.AudioSynthesizer, "AudioSynthesizer should be exported from root");
    assert.ok(root.useShadowBoxer, "useShadowBoxer should be exported from root");
    assert.ok(root.useAudioFX, "useAudioFX should be exported from root");
    assert.ok(root.ShadowBoxer, "ShadowBoxer component should be exported from root");
    assert.ok(root.PoseOverlay, "PoseOverlay component should be exported from root");
    assert.ok(root.MetricsDisplay, "MetricsDisplay component should be exported from root");
  });

  await t.test("Subpath ./utils exports all utility classes", async () => {
    const utils = await import("../dist/utils/index.js");
    assert.ok(utils.OneEuroFilter, "OneEuroFilter should be exported from ./utils");
    assert.ok(utils.BiomechanicsEngine, "BiomechanicsEngine should be exported from ./utils");
    assert.ok(utils.StrikeClassifier, "StrikeClassifier should be exported from ./utils");
    assert.ok(utils.AudioSynthesizer, "AudioSynthesizer should be exported from ./utils");
  });

  await t.test("Subpath ./hooks exports all custom hooks", async () => {
    const hooks = await import("../dist/hooks/index.js");
    assert.ok(hooks.useShadowBoxer, "useShadowBoxer should be exported from ./hooks");
    assert.ok(hooks.useAudioFX, "useAudioFX should be exported from ./hooks");
  });

  await t.test("Subpath ./components exports all UI components", async () => {
    const components = await import("../dist/components/index.js");
    assert.ok(components.ShadowBoxer, "ShadowBoxer should be exported from ./components");
    assert.ok(components.PoseOverlay, "PoseOverlay should be exported from ./components");
    assert.ok(components.MetricsDisplay, "MetricsDisplay should be exported from ./components");
  });
});
