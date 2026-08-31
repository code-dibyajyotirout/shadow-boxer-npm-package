import { FilterConfig, Landmark3D } from "../types/index.js";

/**
 * LowPassFilter implementation used by OneEuroFilter
 */
export class LowPassFilter {
  private alpha: number = 0;
  private s: number = 0;
  private initialized: boolean = false;

  constructor(alpha: number = 0) {
    this.setAlpha(alpha);
  }

  public setAlpha(alpha: number): void {
    if (alpha <= 0 || alpha > 1.0) {
      alpha = 0.5;
    }
    this.alpha = alpha;
  }

  public filter(value: number): number {
    let result: number;
    if (this.initialized) {
      result = this.alpha * value + (1.0 - this.alpha) * this.s;
    } else {
      result = value;
      this.initialized = true;
    }
    this.s = result;
    return result;
  }

  public filterWithAlpha(value: number, alpha: number): number {
    this.setAlpha(alpha);
    return this.filter(value);
  }

  public hasLastRawValue(): boolean {
    return this.initialized;
  }

  public lastRawValue(): number {
    return this.s;
  }

  public reset(): void {
    this.initialized = false;
    this.s = 0;
  }
}

/**
 * 1€ Filter (OneEuroFilter) for precise adaptive signal smoothing
 * Dynamically adjusts cutoff frequency based on instantaneous speed to eliminate jitter
 * while preserving low latency on fast strike movements.
 */
export class OneEuroFilter {
  private freq: number;
  private minCutoff: number;
  private beta: number;
  private dCutoff: number;
  private xFilter: LowPassFilter;
  private dxFilter: LowPassFilter;
  private lastTime: number | null = null;

  constructor(
    freq: number = 60,
    minCutoff: number = 1.5,
    beta: number = 0.007,
    dCutoff: number = 1.0
  ) {
    this.freq = freq;
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.dCutoff = dCutoff;
    this.xFilter = new LowPassFilter(this.computeAlpha(minCutoff));
    this.dxFilter = new LowPassFilter(this.computeAlpha(dCutoff));
  }

  private computeAlpha(cutoff: number): number {
    const te = 1.0 / this.freq;
    const tau = 1.0 / (2 * Math.PI * cutoff);
    return 1.0 / (1.0 + tau / te);
  }

  public updateConfig(config: Partial<FilterConfig>): void {
    if (config.minCutoff !== undefined) this.minCutoff = config.minCutoff;
    if (config.beta !== undefined) this.beta = config.beta;
    if (config.dCutoff !== undefined) this.dCutoff = config.dCutoff;
  }

  public filter(value: number, timestamp?: number): number {
    if (this.lastTime && timestamp) {
      const dt = (timestamp - this.lastTime) / 1000.0;
      if (dt > 0) {
        this.freq = 1.0 / dt;
      }
    }
    this.lastTime = timestamp || Date.now();

    const prevX = this.xFilter.hasLastRawValue() ? this.xFilter.lastRawValue() : value;
    const dx = (value - prevX) * this.freq;
    const edx = this.dxFilter.filterWithAlpha(dx, this.computeAlpha(this.dCutoff));
    const cutoff = this.minCutoff + this.beta * Math.abs(edx);

    return this.xFilter.filterWithAlpha(value, this.computeAlpha(cutoff));
  }

  public reset(): void {
    this.xFilter.reset();
    this.dxFilter.reset();
    this.lastTime = null;
  }
}

/**
 * 3D Landmark Filter to smooth spatial tracking vectors
 */
export class LandmarkFilter3D {
  private xFilter: OneEuroFilter;
  private yFilter: OneEuroFilter;
  private zFilter: OneEuroFilter;

  constructor(minCutoff: number = 1.5, beta: number = 0.007) {
    this.xFilter = new OneEuroFilter(60, minCutoff, beta, 1.0);
    this.yFilter = new OneEuroFilter(60, minCutoff, beta, 1.0);
    this.zFilter = new OneEuroFilter(60, minCutoff, beta, 1.0);
  }

  public filter(landmark: Landmark3D, timestamp?: number): Landmark3D {
    return {
      x: this.xFilter.filter(landmark.x, timestamp),
      y: this.yFilter.filter(landmark.y, timestamp),
      z: this.zFilter.filter(landmark.z, timestamp),
      visibility: landmark.visibility,
    };
  }

  public reset(): void {
    this.xFilter.reset();
    this.yFilter.reset();
    this.zFilter.reset();
  }
}
