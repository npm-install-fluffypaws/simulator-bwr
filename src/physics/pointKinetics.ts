// Educational mode: real point-kinetics equations for neutron population,
// coupled to a simplified (lumped, single-node) thermal-hydraulic model.
//
// This is the mode where the physics is genuinely the textbook model, just
// with the reactor core treated as one averaged "point" rather than being
// spatially resolved (see highFidelity.ts for where that would go next).

import {
  BETA_TOTAL,
  COOLANT_TEMP_EQUILIBRIUM,
  COOLANT_TIME_CONSTANT,
  DELAYED_NEUTRON_GROUPS,
  DOPPLER_COEFF,
  FUEL_TEMP_EQUILIBRIUM,
  FUEL_TIME_CONSTANT,
  NEUTRON_LIFETIME,
  VOID_COEFF,
  VOID_FRACTION_EQUILIBRIUM,
  type ControlInputs,
  type ReactorState,
} from "./core";

/** Rod position -> reactivity worth. A simple S-curve: most worth in the middle third
 * of travel, which is how real control rod worth curves behave (less bite at the
 * fully-in / fully-out ends). Centered so rodPosition=0.5 gives ~0 reactivity. */
function rodReactivityWorth(rodPosition: number): number {
  const MAX_ROD_WORTH = 3.0; // $ of total reactivity swing, rod fully in -> fully out
  const x = rodPosition - 0.5;
  // smoothstep-derivative-shaped worth curve, integrated to an S-curve, scaled to MAX_ROD_WORTH
  return MAX_ROD_WORTH * (x + x * x * x * 4) ; // odd function, steep in the middle
}

/** BWR-specific: recirculation flow changes core void fraction, which is the primary
 * day-to-day power control mechanism in a real BWR (more flow -> less voiding ->
 * positive reactivity -> power rises, without moving a single rod). */
function voidFractionFromOperatingPoint(power: number, recircFlow: number): number {
  const flowTerm = -0.25 * (recircFlow - 1.0); // less flow => more voids
  const powerTerm = 0.5 * (power - 1.0); // more power => more boiling => more voids
  const v = VOID_FRACTION_EQUILIBRIUM + flowTerm + powerTerm;
  return Math.min(0.95, Math.max(0.02, v));
}

/**
 * @param extraReactivity Additional $ reactivity to fold into this step's kinetics
 *   (e.g. xenon poisoning from highFidelity.ts). Lagged by one step, which is a fine
 *   approximation since xenon/iodine evolve on an hours timescale versus dt of ~seconds.
 */
export function stepEducational(
  state: ReactorState,
  controls: ControlInputs,
  dt: number,
  extraReactivity = 0
): ReactorState {
  const rodPosition = controls.scram ? 0 : controls.rodPosition;

  // --- Reactivity feedback terms ---
  const reactivityRod = rodReactivityWorth(rodPosition);
  const reactivityDoppler = -DOPPLER_COEFF * (state.fuelTemp - FUEL_TEMP_EQUILIBRIUM);
  const reactivityVoid = -VOID_COEFF * (state.voidFraction - VOID_FRACTION_EQUILIBRIUM);
  const reactivityTotal = reactivityRod + reactivityDoppler + reactivityVoid + extraReactivity; // in $

  // Convert $ to absolute reactivity (rho): rho = reactivity[$] * beta_total
  const rho = reactivityTotal * BETA_TOTAL;

  // --- Point kinetics equations (6 delayed groups) ---
  // dP/dt = ((rho - beta_total)/Lambda) * P + sum(lambda_i * C_i)
  // dC_i/dt = (beta_i/Lambda) * P - lambda_i * C_i
  const precursorSum = state.precursors.reduce(
    (s, c, i) => s + DELAYED_NEUTRON_GROUPS[i].lambda * c,
    0
  );
  const dPdt = ((rho - BETA_TOTAL) / NEUTRON_LIFETIME) * state.power + precursorSum;

  const newPrecursors = state.precursors.map((c, i) => {
    const g = DELAYED_NEUTRON_GROUPS[i];
    const dCdt = (g.beta / NEUTRON_LIFETIME) * state.power - g.lambda * c;
    return Math.max(0, c + dCdt * dt);
  });

  let newPower = state.power + dPdt * dt;
  newPower = Math.max(1e-6, newPower); // power can't go negative or truly to zero here

  // --- Thermal-hydraulics (first-order lag toward power-driven equilibrium) ---
  const fuelTempTarget = FUEL_TEMP_EQUILIBRIUM * newPower;
  const newFuelTemp =
    state.fuelTemp + ((fuelTempTarget - state.fuelTemp) / FUEL_TIME_CONSTANT) * dt;

  const coolantTempTarget = COOLANT_TEMP_EQUILIBRIUM + 5 * (newPower - 1.0);
  const newCoolantTemp =
    state.coolantTemp + ((coolantTempTarget - state.coolantTemp) / COOLANT_TIME_CONSTANT) * dt;

  const voidTarget = voidFractionFromOperatingPoint(newPower, controls.recircFlow);
  const newVoidFraction = state.voidFraction + (voidTarget - state.voidFraction) * Math.min(1, dt / 3);

  const scrammed = state.scrammed || controls.scram;

  // Danger meter: driven by fuel temp margin and rate of power rise (simple heuristic,
  // not a licensed safety limit — good enough to give the player a warning signal).
  const tempMargin = Math.max(0, (newFuelTemp - FUEL_TEMP_EQUILIBRIUM * 1.6) / (FUEL_TEMP_EQUILIBRIUM * 0.4));
  const rateTerm = Math.max(0, dPdt / newPower) * 2;
  const danger = Math.min(1, tempMargin + rateTerm);

  return {
    ...state,
    t: state.t + dt,
    power: newPower,
    precursors: newPrecursors,
    reactivityRod,
    reactivityDoppler,
    reactivityVoid,
    reactivityXenon: state.reactivityXenon, // untouched in educational mode
    reactivityTotal,
    fuelTemp: newFuelTemp,
    coolantTemp: newCoolantTemp,
    voidFraction: newVoidFraction,
    scrammed,
    danger,
  };
}