import type { ControlInputs, FidelityMode, ReactorState } from "./core";
import { stepArcade } from "./arcade";
import { stepEducational } from "./pointKinetics";
import { stepHighFidelity } from "./highFidelity";

/**
 * Single entry point the UI/state layer calls every tick. Swapping `mode`
 * swaps the entire physics model underneath with zero changes needed
 * anywhere else — this is the whole point of sharing the ReactorState shape.
 */
export function stepReactor(
  state: ReactorState,
  controls: ControlInputs,
  dt: number,
  mode: FidelityMode
): ReactorState {
  switch (mode) {
    case "arcade":
      return stepArcade(state, controls, dt);
    case "educational":
      return stepEducational(state, controls, dt);
    case "high-fidelity":
      return stepHighFidelity(state, controls, dt);
  }
}

/** Fixed timestep for the physics integration, independent of render rate. */
export const PHYSICS_DT = 0.1; // seconds of sim-time per physics step