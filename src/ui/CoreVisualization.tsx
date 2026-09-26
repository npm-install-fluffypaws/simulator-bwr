import type { ReactorState } from "../physics/core";

export function CoreVisualization({
  state,
  rodPosition,
}: {
  state: ReactorState;
  rodPosition: number;
}) {
  const coreHeight = 260;
  const coreWidth = 140;
  const rodInsertionPx = (1 - rodPosition) * coreHeight * 0.85;
  const glow = Math.min(1, state.power);
  const bubbleCount = Math.round(state.voidFraction * 24);

  return (
    <svg viewBox="0 0 220 320" className="core-viz" role="img" aria-label="Reactor core cutaway">
      <rect x="30" y="20" width={coreWidth} height={coreHeight} rx="8" fill="#0a1420" stroke="#2a3f55" />
      <rect
        x="34"
        y="24"
        width={coreWidth - 8}
        height={coreHeight - 8}
        rx="6"
        fill={`rgba(255, ${140 - glow * 90}, 60, ${0.15 + glow * 0.5})`}
      />
      {Array.from({ length: bubbleCount }).map((_, i) => (
        <circle
          key={i}
          cx={40 + ((i * 37) % (coreWidth - 20))}
          cy={30 + ((i * 53) % (coreHeight - 20))}
          r={2 + (i % 3)}
          fill="rgba(180, 220, 255, 0.6)"
        />
      ))}
      {[0, 1, 2, 3].map((i) => (
        <rect
          key={i}
          x={45 + i * 28}
          y={20}
          width="10"
          height={rodInsertionPx}
          fill="#556"
          stroke="#889"
        />
      ))}
      <text x="100" y="300" textAnchor="middle" fill="#8fa" fontSize="12">
        {(state.power * 100).toFixed(0)}% power
      </text>
    </svg>
  );
}