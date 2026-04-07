import { motion } from "framer-motion";
import PageWrapper from "../components/layout/PageWrapper";
import { useApiHealth } from "../hooks/useApiHealth";

const pipelineSteps = [
  { num: "01", label: "SATELLITE INPUT", desc: "Upload high-res satellite image" },
  { num: "02", label: "PREPROCESSING", desc: "Normalize, resize, tensor conversion" },
  { num: "03", label: "U-NET INFERENCE", desc: "Semantic segmentation with encoder-decoder" },
  { num: "04", label: "MASK GENERATION", desc: "Multi-class terrain classification" },
  { num: "05", label: "RESCUE DETECTION", desc: "Identify target zones from mask" },
  { num: "06", label: "COST MAP", desc: "Terrain-aware traversal cost matrix" },
  { num: "07", label: "A* PATHFINDING", desc: "Optimal route computation" },
  { num: "08", label: "VISUALIZATION", desc: "Overlay results on original image" },
];

const techStack = [
  { name: "Python", color: "#3776ab" },
  { name: "PyTorch", color: "#ee4c2c" },
  { name: "FastAPI", color: "#009688" },
  { name: "React", color: "#61dafb" },
  { name: "TypeScript", color: "#3178c6" },
  { name: "Tailwind CSS", color: "#06b6d4" },
  { name: "Vite", color: "#646cff" },
  { name: "NumPy", color: "#4dabcf" },
];

export default function AboutPage() {
  useApiHealth();

  return (
    <PageWrapper>
      <div className="max-w-5xl mx-auto px-6 py-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <h1 className="font-display text-3xl tracking-[0.3em] text-accent-cyan glow-text mb-4">
            ABOUT PATHFINDER
          </h1>
          <p className="font-mono text-sm text-text-secondary max-w-2xl mx-auto leading-relaxed">
            PathFinder is an AI-powered disaster response system that analyzes
            satellite imagery to identify terrain types, locate rescue targets,
            and compute optimal rescue routes through hazardous environments.
          </p>
        </motion.div>

        {/* Pipeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-16"
        >
          <h2 className="font-display text-sm tracking-widest text-text-secondary mb-6 text-center">
            PROCESSING PIPELINE
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {pipelineSteps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }}
                className="card-frame p-4 relative"
              >
                <div className="font-display text-lg text-accent-cyan/30 font-bold mb-1">
                  {step.num}
                </div>
                <div className="font-display text-[10px] tracking-widest text-text-primary mb-1">
                  {step.label}
                </div>
                <p className="font-mono text-[10px] text-text-secondary leading-relaxed">
                  {step.desc}
                </p>
                {/* Arrow connector */}
                {i < pipelineSteps.length - 1 && i % 4 !== 3 && (
                  <div
                    className="absolute top-1/2 -right-2 w-3 text-accent-cyan/30 font-mono hidden md:block"
                    style={{ transform: "translateY(-50%)" }}
                  >
                    →
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Tech Stack */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="font-display text-sm tracking-widest text-text-secondary mb-6 text-center">
            TECH STACK
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {techStack.map((tech, i) => (
              <motion.div
                key={tech.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + i * 0.06 }}
                className="px-4 py-2 rounded card-frame font-mono text-xs tracking-wider"
                style={{
                  borderColor: tech.color + "40",
                  color: tech.color,
                }}
              >
                {tech.name}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Footer note */}
        <div className="mt-16 text-center">
          <p className="font-mono text-[11px] text-text-secondary/40">
            Built for rapid disaster response coordination
          </p>
        </div>
      </div>
    </PageWrapper>
  );
}
