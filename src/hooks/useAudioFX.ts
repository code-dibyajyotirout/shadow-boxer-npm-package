import { useRef, useEffect, useCallback } from "react";
import { AudioSynthesizer } from "../utils/AudioSynthesizer.js";

export interface UseAudioFXOptions {
  enabled?: boolean;
}

export function useAudioFX(options: UseAudioFXOptions = {}) {
  const { enabled = true } = options;
  const synthRef = useRef<AudioSynthesizer | null>(null);

  useEffect(() => {
    synthRef.current = new AudioSynthesizer(enabled);
    return () => {
      synthRef.current = null;
    };
  }, [enabled]);

  const playSwoosh = useCallback((speedRatio?: number) => {
    synthRef.current?.playSwoosh(speedRatio);
  }, []);

  const playImpact = useCallback((powerPercent?: number) => {
    synthRef.current?.playImpact(powerPercent);
  }, []);

  const playComboComplete = useCallback(() => {
    synthRef.current?.playComboComplete();
  }, []);

  const playMissTone = useCallback(() => {
    synthRef.current?.playMissTone();
  }, []);

  const setMuted = useCallback((muted: boolean) => {
    synthRef.current?.setMuted(muted);
  }, []);

  return {
    playSwoosh,
    playImpact,
    playComboComplete,
    playMissTone,
    setMuted,
  };
}
