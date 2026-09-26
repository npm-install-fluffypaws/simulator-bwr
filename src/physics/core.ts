// Shared types for every physics engine tier.
// The UI and the sim loop only ever talk to this interface — never to a
// specific engine — which is what lets you swap fidelity modes at runtime.

export type FidelityMode = "arcade" | "educational" | "high-fidelity";

export type ControlComplexity = "rods-only" | "rods-and-flow" | "full-control-room";

/** Everything the player can adjust, 0-1 normalized unless noted. */
export interface ControlInputs {
  /** 0 = fully inserted, 1 = fully withdrawn */
  rodPosition: number;
  /** 0 = pumps off, 1 = rated recirculation flow. BWRs use this for power maneuvering. */
  recircFlow: number;
  /** 0-1, only used in full-control-room complexity */
  feedwaterFlow: number;
  /** 0-1, only used in full-control-room complexity */
  turbineValvePosition: number;
  /** Manual reactor trip. Once true, rods are assumed fully inserted next step. */
  scram: boolean;
}

export const defaultControls: ControlInputs = {
  rodPosition: 0.5,
  recircFlow: 1.0,
  feedwaterFlow: 1.0,
  turbineValvePosition: 1.0,
  scram: false,
};

/** The full simulation state. Every engine reads/writes a subset of this. */
export interface ReactorState {
  t: number; // sim time, seconds

  // Neutronics
  power: number; // relative power, 1.0 = 100% rated
  precursors: number[]; // 6 delayed-neutron precursor groups, relative
  reactivityRod: number; // $ (dollars) contributed by rod position
  reactivityDoppler: number; // $ from fuel-temperature feedback
  reactivityVoid: number; // $ from coolant-void feedback
  reactivityXenon: number; // $ from Xe-135 poisoning (high-fidelity only, else 0)
  reactivityTotal: number;

  // Thermal-hydraulics (lumped / single-node — see highFidelity.ts for
  // where you'd extend this to an axially-nodalized model)
  fuelTemp: number; // deg C
  coolantTemp: number; // deg C
  voidFraction: number; // 0-1, fraction of core coolant volume that is steam

  // Xenon/Iodine transient poisoning (high-fidelity only, else stays at equilibrium)
  iodine135: number; // relative concentration
  xenon135: number; // relative concentration

  // Bookkeeping
  scrammed: boolean;
  danger: number; // 0-1 "how close to trouble" meter, mode-dependent meaning
}

/** Equilibrium precursor concentration for group i at power P: Ci = (βi / (λi·Λ)) · P */
function equilibriumPrecursors(power: number): number[] {
  return DELAYED_NEUTRON_GROUPS.map((g) => (g.beta / (g.lambda * NEUTRON_LIFETIME)) * power);
}

export function initialReactorState(): ReactorState {
  return {
    t: 0,
    power: 1.0,
    precursors: equilibriumPrecursors(1.0),
    reactivityRod: 0,
    reactivityDoppler: 0,
    reactivityVoid: 0,
    reactivityXenon: 0,
    reactivityTotal: 0,
    fuelTemp: FUEL_TEMP_EQUILIBRIUM,
    coolantTemp: COOLANT_TEMP_EQUILIBRIUM,
    voidFraction: VOID_FRACTION_EQUILIBRIUM,
    iodine135: 1.0,
    xenon135: 1.0,
    scrammed: false,
    danger: 0,
  };
}

// --- Physical constants (typical BWR-ish values, simplified for teaching) ---

export const NEUTRON_LIFETIME = 5e-5; // seconds, prompt neutron lifetime (Λ)

// 6-group delayed neutron data (U-235 thermal fission, standard textbook values)
export const DELAYED_NEUTRON_GROUPS = [
  { beta: 0.000215, lambda: 0.0124 },
  { beta: 0.001424, lambda: 0.0305 },
  { beta: 0.001274, lambda: 0.111 },
  { beta: 0.002568, lambda: 0.301 },
  { beta: 0.000748, lambda: 1.14 },
  { beta: 0.000273, lambda: 3.01 },
];
export const BETA_TOTAL = DELAYED_NEUTRON_GROUPS.reduce((s, g) => s + g.beta, 0); // ~0.0065

// Feedback coefficients (units: $ reactivity per unit of the driving variable)
export const DOPPLER_COEFF = 0.006; // $ per degC of fuel temp rise (negative feedback)
export const VOID_COEFF = 1.2; // $ per unit void fraction rise (negative feedback) — dominant in BWRs

// Thermal time constants (lumped single-node model)
export const FUEL_TIME_CONSTANT = 6; // seconds
export const COOLANT_TIME_CONSTANT = 15; // seconds
export const FUEL_TEMP_EQUILIBRIUM = 600; // degC at 100% power
export const COOLANT_TEMP_EQUILIBRIUM = 286; // degC, BWR operating temp
export const VOID_FRACTION_EQUILIBRIUM = 0.4; // core-average void fraction at 100% power, rated flow

// Xenon/Iodine (Xe-135 / I-135) chain constants
export const IODINE_LAMBDA = 2.87e-5; // 1/s decay constant
export const XENON_LAMBDA = 2.09e-5; // 1/s decay constant
export const IODINE_YIELD = 0.061; // fission yield fraction
export const XENON_YIELD = 0.002; // direct fission yield fraction
export const XENON_ABSORPTION = 2.6e-4; // relative absorption cross-section scale