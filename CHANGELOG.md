# Changelog

All notable changes to `shadow-boxer` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-08-31

### Added
- Initial public release of `shadow-boxer` NPM package.
- Modular exports for `.`, `./hooks`, `./components`, `./utils`, `./types`, and `./style.css`.
- Real-time 3D landmark kinematics calculating punch velocity in m/s, acceleration in m/s^2, and power index.
- Strike archetype classification for Jabs, Crosses, Hooks, Uppercuts, Slips, and Ducks.
- OneEuroFilter adaptive signal smoothing pipeline to suppress sensor jitter.
- Procedural Web Audio synthesizer generating strike swooshes, impact booms, and combo chimes.
- React components: `ShadowBoxer`, `PoseOverlay`, and `MetricsDisplay`.
- Full automated test suite with 100% pass rate.
