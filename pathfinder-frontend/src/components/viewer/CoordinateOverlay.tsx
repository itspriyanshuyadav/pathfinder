interface CoordinateOverlayProps {
  x: number;
  y: number;
}

export default function CoordinateOverlay({ x, y }: CoordinateOverlayProps) {
  return (
    <div
      className="absolute pointer-events-none px-2 py-1 rounded text-[10px] font-mono"
      style={{
        bottom: 8,
        right: 8,
        background: "rgba(10, 15, 30, 0.9)",
        border: "1px solid var(--border-default)",
        color: "var(--accent-cyan)",
      }}
    >
      COL: {x} &nbsp; ROW: {y}
    </div>
  );
}
