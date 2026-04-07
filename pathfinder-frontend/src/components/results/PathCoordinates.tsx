import { formatCoord } from "../../utils/formatters";
import { exportPathAsJson } from "../../utils/exportUtils";
import GlowButton from "../ui/GlowButton";
import { Download } from "lucide-react";

interface PathCoordinatesProps {
  coordinates: [number, number][];
}

export default function PathCoordinates({ coordinates }: PathCoordinatesProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-display text-[10px] tracking-widest text-text-secondary uppercase">
          PATH COORDINATES
        </span>
        <GlowButton
          onClick={() => exportPathAsJson(coordinates)}
          className="!px-3 !py-1.5 !text-[9px]"
        >
          <Download className="w-3 h-3 inline mr-1" />
          EXPORT JSON
        </GlowButton>
      </div>
      <div
        className="overflow-y-auto rounded border border-border-default font-mono text-[11px]"
        style={{
          maxHeight: 180,
          backgroundColor: "#0a0f1e",
          color: "#7fdbca",
        }}
      >
        <div className="p-2 space-y-0.5">
          {coordinates.map((coord, i) => (
            <div key={i} className="flex gap-3">
              <span className="text-text-secondary w-8 text-right select-none">
                {String(i).padStart(4, "0")}
              </span>
              <span>{formatCoord(coord)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
