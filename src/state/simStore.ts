import { useCallback, useEffect, useRef, useState } from "react";
import {
  defaultControls,
  initialReactorState,
  type ControlInputs,
  type FidelityMode,
  type ReactorState,
} from "../physics/core";
import { PHYSICS_DT, stepReactor } from "../physics/engine";

export interface SimStore {
  state: ReactorState;
  controls: ControlInputs;
  mode: FidelityMode;
  running: boolean;
  speed: number; // sim-seconds per wall-second
  setControls: (patch: Partial<ControlInputs>) => void;
  setMode: (mode: FidelityMode) => void;
  setSpeed: (speed: number) => void;
  togglePaused: () => void;
  reset: () => void;
}

/** Drives the physics loop with a fixed dt, decoupled from the browser's
 * variable frame rate, via a simple accumulator pattern. */
export function useSimStore(initialMode: FidelityMode = "educational"): SimStore {
  const [state, setState] = useState<ReactorState>(initialReactorState);
  const [controls, setControlsState] = useState<ControlInputs>(defaultControls);
  const [mode, setMode] = useState<FidelityMode>(initialMode);
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(1);

  const accumulator = useRef(0);
  const lastFrame = useRef<number | null>(null);
  const controlsRef = useRef(controls);
  const modeRef = useRef(mode);
  controlsRef.current = controls;
  modeRef.current = mode;

  useEffect(() => {
    let rafId: number;

    const frame = (t: number) => {
      if (lastFrame.current === null) lastFrame.current = t;
      const wallDt = (t - lastFrame.current) / 1000;
      lastFrame.current = t;

      if (running) {
        accumulator.current += wallDt * speed;
        // Cap how much sim-time we chase in one frame so a tab coming back
        // from background doesn't fast-forward wildly.
        accumulator.current = Math.min(accumulator.current, PHYSICS_DT * 50);

        setState((prev) => {
          let next = prev;
          let acc = accumulator.current;
          while (acc >= PHYSICS_DT) {
            next = stepReactor(next, controlsRef.current, PHYSICS_DT, modeRef.current);
            acc -= PHYSICS_DT;
          }
          accumulator.current = acc;
          return next;
        });
      }

      rafId = requestAnimationFrame(frame);
    };

    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, [running, speed]);

  const setControls = useCallback((patch: Partial<ControlInputs>) => {
    setControlsState((prev) => ({ ...prev, ...patch }));
  }, []);

  const togglePaused = useCallback(() => setRunning((r) => !r), []);

  const reset = useCallback(() => {
    setState(initialReactorState());
    setControlsState(defaultControls);
    accumulator.current = 0;
  }, []);

  return { state, controls, mode, running, speed, setControls, setMode, setSpeed, togglePaused, reset };
}