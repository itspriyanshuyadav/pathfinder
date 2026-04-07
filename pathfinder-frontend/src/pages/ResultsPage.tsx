import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useMission } from "../context/MissionContext";
import { useApiHealth } from "../hooks/useApiHealth";
import PageWrapper from "../components/layout/PageWrapper";
import GlowButton from "../components/ui/GlowButton";
import { base64ToImageSrc } from "../utils/imageUtils";
import {
  formatCoord,
  formatMs,
  formatPathLength,
  generateMissionId,
} from "../utils/formatters";
import { exportReportAsHtml } from "../utils/exportUtils";
import { Download, RotateCcw } from "lucide-react";

export default function ResultsPage() {
  useApiHealth();
  const { state, dispatch } = useMission();
  const navigate = useNavigate();
  const missionId = generateMissionId();

  const handleNewMission = () => {
    dispatch({ type: "RESET" });
    navigate("/dashboard");
  };

  const handleExport = () => {
    exportReportAsHtml(state);
  };

  if (!state.results) {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 pt-14">
          <div className="font-display text-sm tracking-widest text-text-secondary">
            NO MISSION DATA
          </div>
          <p className="font-mono text-xs text-text-secondary/60">
            Complete an analysis first to view the report
          </p>
          <GlowButton onClick={() => navigate("/dashboard")}>
            GO TO CONSOLE
          </GlowButton>
        </div>
      </PageWrapper>
    );
  }

  const r = state.results;

  const images = [
    { label: "ORIGINAL", src: state.uploadedImageBase64 },
    { label: "SEGMENTATION", src: r.segmentation_mask_base64 },
    { label: "RESULT", src: r.result_image_base64 },
  ].filter((img) => img.src);

  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto px-6 py-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="font-display text-2xl tracking-[0.2em] text-accent-cyan glow-text">
              MISSION REPORT
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="font-mono text-xs text-text-secondary">
                ID: {missionId}
              </span>
              <span
                className="px-2 py-0.5 rounded text-[10px] font-display tracking-wider"
                style={{
                  backgroundColor: "rgba(0,255,136,0.1)",
                  border: "1px solid rgba(0,255,136,0.3)",
                  color: "#00ff88",
                }}
              >
                SUCCESS
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            <GlowButton onClick={handleExport}>
              <Download className="w-3.5 h-3.5 inline mr-1.5" />
              EXPORT REPORT
            </GlowButton>
            <GlowButton variant="danger" onClick={handleNewMission}>
              <RotateCcw className="w-3.5 h-3.5 inline mr-1.5" />
              NEW MISSION
            </GlowButton>
          </div>
        </motion.div>

        {/* Image Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        >
          {images.map((img) => (
            <div key={img.label} className="card-frame overflow-hidden">
              <div className="px-3 py-2 border-b border-border-default">
                <span className="font-display text-[10px] tracking-widest text-text-secondary">
                  {img.label}
                </span>
              </div>
              <div className="bg-base p-2">
                <img
                  src={base64ToImageSrc(img.src!)}
                  alt={img.label}
                  className="w-full h-auto rounded"
                />
              </div>
            </div>
          ))}
        </motion.div>

        {/* Stats Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card-frame overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-border-default">
            <span className="font-display text-[10px] tracking-widest text-text-secondary">
              ANALYSIS RESULTS
            </span>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-default">
                <th className="px-4 py-2.5 text-left font-display text-[10px] tracking-widest text-text-secondary uppercase">
                  Metric
                </th>
                <th className="px-4 py-2.5 text-left font-display text-[10px] tracking-widest text-text-secondary uppercase">
                  Value
                </th>
              </tr>
            </thead>
            <tbody className="font-mono text-xs">
              <tr className="border-b border-border-default/50">
                <td className="px-4 py-2.5 text-text-secondary">Start Point</td>
                <td className="px-4 py-2.5 text-accent-cyan">{formatCoord(r.start_point)}</td>
              </tr>
              <tr className="border-b border-border-default/50">
                <td className="px-4 py-2.5 text-text-secondary">Rescue Target</td>
                <td className="px-4 py-2.5 text-accent-green">{formatCoord(r.goal_point)}</td>
              </tr>
              <tr className="border-b border-border-default/50">
                <td className="px-4 py-2.5 text-text-secondary">Path Length</td>
                <td className="px-4 py-2.5 text-text-primary">{formatPathLength(r.path_length)}</td>
              </tr>
              <tr className="border-b border-border-default/50">
                <td className="px-4 py-2.5 text-text-secondary">Avg Path Cost</td>
                <td className="px-4 py-2.5 text-accent-amber">{r.cost_map_stats.avg_path_cost.toFixed(2)}</td>
              </tr>
              <tr className="border-b border-border-default/50">
                <td className="px-4 py-2.5 text-text-secondary">Min Cost</td>
                <td className="px-4 py-2.5 text-text-primary">{r.cost_map_stats.min_cost.toFixed(2)}</td>
              </tr>
              <tr className="border-b border-border-default/50">
                <td className="px-4 py-2.5 text-text-secondary">Max Cost</td>
                <td className="px-4 py-2.5 text-text-primary">{r.cost_map_stats.max_cost.toFixed(2)}</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-text-secondary">Processing Time</td>
                <td className="px-4 py-2.5 text-accent-cyan">{formatMs(r.processing_time_ms)}</td>
              </tr>
            </tbody>
          </table>
        </motion.div>
      </div>
    </PageWrapper>
  );
}
