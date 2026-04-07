import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Layers, Target, Route } from "lucide-react";
import PageWrapper from "../components/layout/PageWrapper";
import GlowButton from "../components/ui/GlowButton";
import { useApiHealth } from "../hooks/useApiHealth";

const features = [
  {
    icon: Layers,
    title: "TERRAIN SEGMENTATION",
    description: "U-Net deep learning model classifies water, roads, buildings, and open ground.",
  },
  {
    icon: Target,
    title: "RESCUE DETECTION",
    description: "Automated identification of rescue zones and optimal deployment targets.",
  },
  {
    icon: Route,
    title: "A* PATHFINDING",
    description: "Cost-aware route planning through hazardous terrain for first responders.",
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  useApiHealth();

  return (
    <PageWrapper fullHeight>
      <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
        {/* Grid background */}
        <div className="grid-bg absolute inset-0 z-0" />

        {/* Hero content */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 flex flex-col items-center text-center px-4 pt-20"
        >
          <h1
            className="font-display font-black text-5xl md:text-7xl tracking-[0.3em] glow-text mb-4"
            style={{ color: "var(--accent-cyan)" }}
          >
            PATHFINDER
          </h1>
          <p className="font-mono text-sm md:text-base text-text-secondary max-w-xl leading-relaxed mb-2">
            AI-POWERED DISASTER RESPONSE &amp; RESCUE PATHFINDING SYSTEM
          </p>
          <p className="font-mono text-xs text-text-secondary/60 mb-10">
            Satellite imagery analysis • Terrain segmentation • Optimal route computation
          </p>

          <GlowButton onClick={() => navigate("/dashboard")} className="text-sm !px-10 !py-4">
            LAUNCH MISSION CONSOLE
          </GlowButton>
        </motion.div>

        {/* Feature cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl w-full px-6 mt-16 mb-12"
        >
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.15 }}
              className="card-frame p-5 group cursor-default hover:border-accent-cyan/40 transition-all duration-300"
              style={{
                transition: "box-shadow 0.3s, border-color 0.3s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow =
                  "0 0 20px rgba(0,229,255,0.15)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
              }}
            >
              <feature.icon className="w-8 h-8 text-accent-cyan mb-3" />
              <h3 className="font-display text-[11px] tracking-widest text-text-primary mb-2">
                {feature.title}
              </h3>
              <p className="font-mono text-[11px] text-text-secondary leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </PageWrapper>
  );
}
