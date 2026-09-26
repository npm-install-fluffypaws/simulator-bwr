import type { FidelityMode, ReactorState } from "../physics/core";

function Gauge({
  label,
  value,
  unit,
  danger,
}: {
  label: string;
  value: string;
  unit: string;
  danger?: boolean;
}) {
  return (
    <div className={`gauge${danger ? " gauge--danger" : ""}`}>
      <div className="gauge__label">{label}</div>
      <div className="gauge__value">
        {value}
        <span className="gauge__unit">{unit}</span>
      </div>
    </div>
  );
}

export function Gauges({ state, mode }: { state: ReactorState; mode: FidelityMode }) {
  const powerPct = (state.power * 100).toFixed(1);
  const isDangerPower = state.power > 1.15;

  return (
    <div className="gauges">
      <Gauge label="Reactor Power" value={powerPct} unit="% rated" danger={isDangerPower} />
      <Gauge label="Reactivity" value={state.reactivityTotal.toFixed(3)} unit="$" />
      <Gauge label="Fuel Temp" value={state.fuelTemp.toFixed(0)} unit="°C" danger={state.fuelTemp > 1000} />
      <Gauge label="Coolant Temp" value={state.coolantTemp.toFixed(0)} unit="°C" />
      <Gauge label="Void Fraction" value={(state.voidFraction * 100).toFixed(0)} unit="%" />
      {mode === "high-fidelity" && (
        <Gauge label="Xenon-135" value={state.xenon135.toFixed(2)} unit="× eq." />
      )}
      <Gauge label="Sim Time" value={formatTime(state.t)} unit="" />
      {state.scrammed && <Gauge label="Status" value="SCRAM" unit="" danger />}
    </div>
  );
}

function formatTime(t: number): string {
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = Math.floor(t % 60);
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}