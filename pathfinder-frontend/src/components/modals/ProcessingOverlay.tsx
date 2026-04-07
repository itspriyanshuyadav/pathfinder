import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import LoadingRadar from "../ui/LoadingRadar";

const STEPS = [
  "IMAGE RECEIVED",
  "RUNNING PREPROCESSING",
  "U-NET INFERENCE IN PROGRESS",
  "DETECTING RESCUE ZONES",
  "GENERATING COST MAP",
  "COMPUTING A* ROUTE",
  "RENDERING VISUALIZATION",
];

export default function ProcessingOverlay() {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (currentStep < STEPS.length - 1) {
      const timer = setTimeout(() => setCurrentStep((s) => s + 1), 600);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-6"
        style={{
          backgroundColor: "rgba(10, 15, 30, 0.92)",
          backdropFilter: "blur(4px)",
        }}
      >
        <LoadingRadar />

        <div className="font-display text-sm tracking-[0.3em] text-accent-cyan glow-text">
          PROCESSING MISSION DATA
        </div>

        <div className="space-y-2 w-64">
          {STEPS.map((step, i) => {
            const isActive = i === currentStep;
            const isCompleted = i < currentStep;
            const isHidden = i > currentStep;

            return (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: -10 }}
                animate={
                  isHidden
                    ? { opacity: 0, x: -10 }
                    : { opacity: 1, x: 0 }
                }
                transition={{ duration: 0.3 }}
                className="flex items-center gap-2 font-mono text-[11px]"
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-accent-green flex-shrink-0" />
                ) : (
                  <div
                    className="w-3.5 h-3.5 rounded-full border flex-shrink-0"
                    style={{
                      borderColor: isActive
                        ? "var(--accent-cyan)"
                        : "var(--border-default)",
                      boxShadow: isActive
                        ? "0 0 8px rgba(0,229,255,0.5)"
                        : undefined,
                    }}
                  />
                )}
                <span
                  style={{
                    color: isCompleted
                      ? "#00ff88"
                      : isActive
                      ? "#00e5ff"
                      : "var(--text-secondary)",
                  }}
                >
                  {step}
                </span>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
