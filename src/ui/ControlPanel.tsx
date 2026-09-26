import type { ControlComplexity, ControlInputs, FidelityMode } from "../physics/core";

interface Props {
  controls: ControlInputs;
  mode: FidelityMode;
  complexity: ControlComplexity;
  running: boolean;
  speed: number;
  onControlsChange: (patch: Partial<ControlInputs>) => void;
  onModeChange: (mode: FidelityMode) => void;
  onComplexityChange: (c: ControlComplexity) => void;
  onToggleRunning: () => void;
  onSpeedChange: (s: number) => void;
  onReset: () => void;
}

function Slider({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <label className="slider">
      <span className="slider__label">
        {label} <span className="slider__value">{(value * 100).toFixed(0)}%</span>
      </span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

export function ControlPanel({
  controls,
  mode,
  complexity,
  running,
  speed,
  onControlsChange,
  onModeChange,
  onComplexityChange,
  onToggleRunning,
  onSpeedChange,
  onReset,
}: Props) {
  return (
    <div className="control-panel">
      <section>
        <h3>Fidelity</h3>
        <div className="button-row">
          {(["arcade", "educational", "high-fidelity"] as FidelityMode[]).map((m) => (
            <button key={m} className={m === mode ? "active" : ""} onClick={() => onModeChange(m)}>
              {m}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3>Control room</h3>
        <div className="button-row">
          {(["rods-only", "rods-and-flow", "full-control-room"] as ControlComplexity[]).map((c) => (
            <button key={c} className={c === complexity ? "active" : ""} onClick={() => onComplexityChange(c)}>
              {c.replace(/-/g, " ")}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3>Controls</h3>
        <Slider
          label="Control rods (withdrawn)"
          value={controls.rodPosition}
          onChange={(v) => onControlsChange({ rodPosition: v })}
          disabled={controls.scram}
        />
        {complexity !== "rods-only" && (
          <Slider
            label="Recirculation flow"
            value={controls.recircFlow}
            onChange={(v) => onControlsChange({ recircFlow: v })}
          />
        )}
        {complexity === "full-control-room" && (
          <>
            <Slider
              label="Feedwater flow"
              value={controls.feedwaterFlow}
              onChange={(v) => onControlsChange({ feedwaterFlow: v })}
            />
            <Slider
              label="Turbine valve"
              value={controls.turbineValvePosition}
              onChange={(v) => onControlsChange({ turbineValvePosition: v })}
            />
          </>
        )}
        <button
          className="scram-button"
          onClick={() => onControlsChange({ scram: true })}
          disabled={controls.scram}
        >
          SCRAM
        </button>
      </section>

      <section>
        <h3>Simulation</h3>
        <div className="button-row">
          <button onClick={onToggleRunning}>{running ? "Pause" : "Resume"}</button>
          <button onClick={onReset}>Reset</button>
        </div>
        <label className="slider">
          <span className="slider__label">
            Speed <span className="slider__value">{speed.toFixed(1)}×</span>
          </span>
          <input
            type="range"
            min={0.1}
            max={10}
            step={0.1}
            value={speed}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
          />
        </label>
      </section>
    </div>
  );
}