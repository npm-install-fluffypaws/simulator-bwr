# BWR Simulator
 
## Run it
 
```
npm install
npm run dev
```
 
Opens at `http://localhost:5173`. (This container has no network access, so
the install/build couldn't be verified end-to-end here — do that first thing
locally. The code was hand-checked for structural correctness, but treat the
first `npm run dev` as the real smoke test.)
 
## How it's organized
 
- `src/physics/core.ts` — shared `ReactorState`/`ControlInputs` types and all
  physical constants. This is the contract every engine and every UI
  component talks to.
- `src/physics/arcade.ts`, `pointKinetics.ts`, `highFidelity.ts` — the three
  fidelity tiers. Each exports a `step(state, controls, dt) -> newState`
  function with the same signature.
- `src/physics/engine.ts` — picks which tier's `step` function to call.
- `src/state/simStore.ts` — a React hook running a fixed-timestep loop
  (`requestAnimationFrame` + accumulator) so physics correctness doesn't
  depend on frame rate.
- `src/ui/` — control panel, gauges, and a small SVG core visualization.
  None of these know which fidelity tier is active; they just render
  whatever `ReactorState` they're given.
## What's real vs. simplified right now
 
**Educational mode** is genuine 6-group point kinetics (the actual
textbook ODEs) with Doppler and void reactivity feedback, coupled to a
single-node (whole-core-averaged) thermal model. **High-fidelity mode**
adds the Iodine-135/Xenon-135 poisoning chain on top of that — try dropping
power for a while and watching xenon build up over sim-hours, then notice
how much harder it is to bring power back up (the real "xenon pit" effect).
**Arcade mode** is intentionally not physical — just a lagged response to
rod position, for a forgiving first impression.
 
## Natural next steps, in rough order of effort
 
1. **Tune the constants** in `core.ts` against a real BWR's published
   parameters if you want closer-to-real numbers (current values are
   textbook-typical, not from a specific plant).
2. **Persist/replay** — log `ReactorState` over time so you can plot
   power/reactivity traces after a run, not just watch gauges live.
3. **Scenarios** — canned starting conditions + objectives ("bring the
   reactor from cold shutdown to 100% power without exceeding fuel temp
   limits") rather than free-play only.
4. **Axially-nodalized thermal-hydraulics** — the biggest real fidelity
   jump. Split the core into N axial nodes, each with its own fuel/coolant
   temp and void fraction, driven by an axial power shape function. This
   is flagged as a comment in `highFidelity.ts` — it changes the state
   shape, so it's a bigger lift than the xenon chain was.
5. **Automatic control systems** — rod worth minimizer, automatic
   recirculation flow control to hold power on a setpoint, etc., as an
   optional "autopilot" toggle.
 