import { motion } from "framer-motion";
import type { AnalyzeResponse } from "../../types";
import { formatCoord } from "../../utils/formatters";

interface AlertLogProps {
  results: AnalyzeResponse;
}

interface AlertItem {
  icon: string;
  message: string;
  level: "success" | "warning" | "danger";
}

export default function AlertLog({ results }: AlertLogProps) {
  const alerts: AlertItem[] = [];

  // Always show rescue target
  alerts.push({
    icon: "✓",
    message: `RESCUE TARGET AT ${formatCoord(results.goal_point)}`,
    level: "success",
  });

  if (results.path_length > 0) {
    alerts.push({
      icon: "✓",
      message: `SAFE ROUTE: ${results.path_length} steps`,
      level: "success",
    });
  }

  if (results.path_length === 0) {
    alerts.push({
      icon: "✗",
      message: "NO ROUTE FOUND — Manual intervention required",
      level: "danger",
    });
  }

  if (results.path_length > 500) {
    alerts.push({
      icon: "⚠",
      message: "LONG ROUTE — Consider alternative entry",
      level: "warning",
    });
  }

  return (
    <div className="space-y-2">
      <div className="font-display text-[10px] tracking-widest text-text-secondary uppercase">
        ALERT LOG
      </div>
      <div className="space-y-1.5">
        {alerts.map((alert, i) => {
          const colorMap = {
            success: { bg: "rgba(0,255,136,0.08)", border: "rgba(0,255,136,0.25)", text: "#00ff88" },
            warning: { bg: "rgba(255,170,0,0.08)", border: "rgba(255,170,0,0.25)", text: "#ffaa00" },
            danger: { bg: "rgba(255,68,68,0.08)", border: "rgba(255,68,68,0.25)", text: "#ff4444" },
          };
          const c = colorMap[alert.level];
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.15 }}
              className="flex items-start gap-2 px-3 py-2 rounded font-mono text-[11px]"
              style={{
                backgroundColor: c.bg,
                border: `1px solid ${c.border}`,
                color: c.text,
              }}
            >
              <span>{alert.icon}</span>
              <span>{alert.message}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
