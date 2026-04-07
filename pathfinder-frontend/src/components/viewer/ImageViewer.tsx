import { useState, useCallback } from "react";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { base64ToImageSrc } from "../../utils/imageUtils";
import CoordinateOverlay from "./CoordinateOverlay";

interface ImageViewerProps {
  base64: string | null;
  label?: string;
}

export default function ImageViewer({ base64, label }: ImageViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = Math.round((e.clientX - rect.left) / zoom);
      const y = Math.round((e.clientY - rect.top) / zoom);
      setMousePos({ x, y });
    },
    [zoom]
  );

  const handleMouseLeave = useCallback(() => setMousePos(null), []);

  if (!base64) return null;

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-card border-b border-border-default">
        <span className="font-display text-[10px] tracking-widest text-text-secondary uppercase">
          {label || "IMAGE"}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoom((z) => Math.min(z + 0.25, 3))}
            className="p-1.5 rounded hover:bg-panel text-text-secondary hover:text-accent-cyan transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(z - 0.25, 0.25))}
            className="p-1.5 rounded hover:bg-panel text-text-secondary hover:text-accent-cyan transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom(1)}
            className="p-1.5 rounded hover:bg-panel text-text-secondary hover:text-accent-cyan transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <span className="ml-2 text-[10px] font-mono text-text-secondary">
            {Math.round(zoom * 100)}%
          </span>
        </div>
      </div>

      {/* Image area */}
      <div
        className="relative flex-1 overflow-auto bg-base flex items-center justify-center"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <img
          src={base64ToImageSrc(base64)}
          alt={label || "Analysis result"}
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "center center",
            transition: "transform 0.2s ease",
            maxWidth: "100%",
            maxHeight: "100%",
          }}
          className="block"
        />
        {mousePos && <CoordinateOverlay x={mousePos.x} y={mousePos.y} />}
      </div>
    </div>
  );
}
