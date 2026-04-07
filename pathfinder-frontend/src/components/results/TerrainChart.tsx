import { motion } from "framer-motion";

interface ClassDistribution {
  water: number;
  road: number;
  building: number;
  background: number;
}

interface TerrainChartProps {
  classDistribution: ClassDistribution;
}

const TERRAIN_CONFIG: {
  key: keyof ClassDistribution;
  label: string;
  color: string;
}[] = [
  { key: "water", label: "WATER", color: "#3b82f6" },
  { key: "road", label: "ROAD", color: "#9ca3af" },
  { key: "building", label: "BUILDING", color: "#f97316" },
  { key: "background", label: "BACKGROUND", color: "#22c55e" },
];

export default function TerrainChart({ classDistribution }: TerrainChartProps) {
  const total = Object.values(classDistribution).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-2.5">
      <div className="font-display text-[10px] tracking-widest text-text-secondary uppercase">
        TERRAIN DISTRIBUTION
      </div>
      {TERRAIN_CONFIG.map((terrain, i) => {
        const raw = classDistribution[terrain.key];
        const pct = total > 0 ? (raw / total) * 100 : 0;
        return (
          <div key={terrain.key} className="space-y-1">
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-text-secondary">{terrain.label}</span>
              <span style={{ color: terrain.color }}>
                {pct.toFixed(1)}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-base overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, delay: i * 0.15, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ backgroundColor: terrain.color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
