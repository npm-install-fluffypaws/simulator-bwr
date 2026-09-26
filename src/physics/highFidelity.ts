// High-fidelity mode: everything in pointKinetics.ts, plus Xe-135/I-135
// transient poisoning — the effect responsible for the "xenon pit" that makes
// restarting a reactor difficult for ~8-10 hours after a power reduction.
//
// EXTENSION POINT: the thermal-hydraulics here is still the single lumped
// node from pointKinetics.ts. The next real step up in fidelity is splitting
// the core into N axial nodes (say 10-20), each with its own fuel temp,
// coolant temp and void fraction, integrated with the same point-kinetics
// power but a shape function for axial power distribution. That's a bigger
// step (new state shape, not just new equations) so it's deliberately left
// as a follow-on rather than bolted on here.

import {
  IODINE_LAMBDA,
  IODINE_YIELD,
  XENON_ABSORPTION,
  XENON_LAMBDA,
  XENON_YIELD,
  type ControlInputs,
  type ReactorState,
} from "./core";
import { stepEducational } from "./pointKinetics";

export function stepHighFidelity(
  state: ReactorState,
  controls: ControlInputs,
  dt: number
): ReactorState {
  // Run the shared point-kinetics + thermal step first, folding in *last step's*
  // xenon reactivity so the poisoning actually feeds back into neutron population
  // (see stepEducational's extraReactivity param for why the one-step lag is fine).
  const base = stepEducational(state, controls, dt, state.reactivityXenon);

  // ...then layer in the iodine/xenon chain on top of its power history.
  // dI/dt = yield_I * fissionRate - lambda_I * I
  // dXe/dt = yield_Xe * fissionRate + lambda_I * I - lambda_Xe * Xe - sigma_a * Xe * flux
  // fissionRate and flux both scale with `power` in this normalized model.
  const fissionRate = base.power;
  const flux = base.power;

  const dIdt = IODINE_YIELD * fissionRate - IODINE_LAMBDA * state.iodine135;
  const newIodine = Math.max(0, state.iodine135 + dIdt * dt);

  const dXedt =
    XENON_YIELD * fissionRate +
    IODINE_LAMBDA * state.iodine135 -
    XENON_LAMBDA * state.xenon135 -
    XENON_ABSORPTION * state.xenon135 * flux;
  const newXenon = Math.max(0, state.xenon135 + dXedt * dt);

  // Xenon reactivity worth: more xenon = more neutron absorption = negative reactivity.
  // Scaled so equilibrium-at-100%-power xenon (xenon135 == 1.0) costs about -2.7$,
  // which is in the right ballpark for a typical LWR equilibrium xenon worth.
  const XENON_WORTH_SCALE = 2.7;
  const reactivityXenon = -XENON_WORTH_SCALE * newXenon;

  // base.reactivityTotal already includes last step's xenon term (folded in above),
  // so just report the freshly computed xenon reactivity for next step's use.
  return {
    ...base,
    iodine135: newIodine,
    xenon135: newXenon,
    reactivityXenon,
  };
}