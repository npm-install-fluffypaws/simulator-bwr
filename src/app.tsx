import { useState } from "react";
import type { ControlComplexity } from "./physics/core";
import { useSimStore } from "./state/simStore";
import { ControlPanel } from "./ui/ControlPanel";
import { Gauges } from "./ui/Gauges";
import { CoreVisualization } from "./ui/CoreVisualization";
import "./styles.css";

export default function App() {
  const sim = useSimStore("educational");
  const [complexity, setComplexity] = useState<ControlComplexity>("rods-and-flow");

  return (
    <div className="app">
      <header>
        <h1>BWR Simulator</h1>
        {sim.state.danger > 0.6 && <div className="alert">⚠ Approaching operating limits</div>}
      </header>

      <main>
        <div className="viz-column">
          <CoreVisualization state={sim.state} rodPosition={sim.controls.rodPosition} />
          <Gauges state={sim.state} mode={sim.mode} />
        </div>

        <ControlPanel
          controls={sim.controls}
          mode={sim.mode}
          complexity={complexity}
          running={sim.running}
          speed={sim.speed}
          onControlsChange={sim.setControls}
          onModeChange={sim.setMode}
          onComplexityChange={setComplexity}
          onToggleRunning={sim.togglePaused}
          onSpeedChange={sim.setSpeed}
          onReset={sim.reset}
        />
      </main>
    </div>
  );
}