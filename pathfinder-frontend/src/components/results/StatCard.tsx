import { motion } from "framer-motion";

interface StatCardProps {
  label: string;
  value: string;
  unit?: string;
  glowColor?: string;
  delay?: number;
}

export default function StatCard({
  label,
  value,
  unit,
  glowColor = "#00e5ff",
  delay = 0,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="card-frame p-3"
      style={{ borderTopColor: glowColor, borderTopWidth: 2 }}
    >
      <div
        className="text-[10px] font-mono uppercase tracking-widest mb-1"
        style={{ color: "var(--text-secondary)" }}
      >
        {label}
      </div>
      <div className="flex items-baseline gap-1">
        <span
          className="text-lg font-display font-bold"
          style={{ color: glowColor }}
        >
          {value}
        </span>
        {unit && (
          <span className="text-[10px] font-mono text-text-secondary">
            {unit}
          </span>
        )}
      </div>
    </motion.div>
  );
}
