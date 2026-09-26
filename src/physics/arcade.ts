// Arcade mode: plausible reactor-like behavior without real neutron kinetics.
// Power chases a rod-position target through a simple lag filter. This mode
// exists so a new player can get a feel for "pull rods out -> power rises,
// with a delay" before being handed the real equations in educational mode.

import type { ControlInputs, ReactorState } from "./core";

const POWER_LAG_SECONDS = 4;
const DANGER_RISE_RATE = 0.15; // per second while over 110% power
const DANGER_FALL_RATE = 0.08; // per second while under 100% power

export function stepArcade(
  state: ReactorState,
  controls: ControlInputs,
  dt: number
): ReactorState {
  const rodPosition = controls.scram ? 0 : controls.rodPosition;

  // Target power is just a smooth function of rod position, 0 -> ~1.3x rated
  const targetPower = rodPosition * 1.3;
  const newPower = state.power + ((targetPower - state.power) / POWER_LAG_SECONDS) * dt;

  const scrammed = state.scrammed || controls.scram;

  let danger = state.danger;
  if (newPower > 1.1) {
    danger = Math.min(1, danger + DANGER_RISE_RATE * dt);
  } else {
    danger = Math.max(0, danger - DANGER_FALL_RATE * dt);
  }

  return {
    ...state,
    t: state.t + dt,
    power: Math.max(0, newPower),
    reactivityRod: (rodPosition - 0.5) * 3,
    reactivityDoppler: 0,
    reactivityVoid: 0,
    reactivityXenon: 0,
    reactivityTotal: (rodPosition - 0.5) * 3,
    fuelTemp: 600 * newPower,
    coolantTemp: 286 + 5 * (newPower - 1),
    voidFraction: Math.min(0.95, Math.max(0.02, 0.4 + 0.3 * (newPower - 1))),
    scrammed,
    danger,
  };
}