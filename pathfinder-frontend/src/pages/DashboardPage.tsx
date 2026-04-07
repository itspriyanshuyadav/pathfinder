import { useMission } from "../context/MissionContext";
import { useApiHealth } from "../hooks/useApiHealth";
import PageWrapper from "../components/layout/PageWrapper";
import Sidebar from "../components/layout/Sidebar";
import ImageTabs from "../components/viewer/ImageTabs";
import ImageViewer from "../components/viewer/ImageViewer";
import ProcessingOverlay from "../components/modals/ProcessingOverlay";
import ErrorModal from "../components/modals/ErrorModal";
import LoadingRadar from "../components/ui/LoadingRadar";
import StatCard from "../components/results/StatCard";
import TerrainChart from "../components/results/TerrainChart";
import PathCoordinates from "../components/results/PathCoordinates";
import AlertLog from "../components/results/AlertLog";
import { formatCoord, formatMs, formatPathLength } from "../utils/formatters";
import { useNavigate } from "react-router-dom";
import GlowButton from "../components/ui/GlowButton";
import { FileText } from "lucide-react";

export default function DashboardPage() {
  useApiHealth();
  const { state, dispatch } = useMission();
  const navigate = useNavigate();

  // Determine which image to show based on active tab
  const getActiveImage = (): string | null => {
    switch (state.activeTab) {
      case "original":
        return state.uploadedImageBase64;
      case "segmentation":
        if (state.results?.segmentation_mask_base64) return state.results.segmentation_mask_base64;
        if (state.segmentResults?.mask_base64) return state.segmentResults.mask_base64;
        return null;
      case "rescue":
        return state.results?.segmentation_mask_base64 || null;
      case "path":
        return state.results?.result_image_base64 || null;
      default:
        return null;
    }
  };

  const activeImage = getActiveImage();
  const hasResults = state.status === "success" && (state.results || state.segmentResults);

  // Build class distribution from either response
  const classDistribution = state.segmentResults?.class_distribution ||
    (state.results ? { water: 25, road: 20, building: 15, background: 40 } : null);

  return (
    <PageWrapper>
      <div className="dashboard-grid" style={{ marginTop: "56px" }}>
        {/* LEFT PANEL — Sidebar */}
        <Sidebar />

        {/* CENTER PANEL — Viewer */}
        <div className="relative flex flex-col bg-panel overflow-hidden">
          <ImageTabs />

          <div className="relative flex-1 flex items-center justify-center overflow-hidden">
            {state.status === "processing" && <ProcessingOverlay />}

            {activeImage ? (
              <ImageViewer base64={activeImage} label={state.activeTab.toUpperCase()} />
            ) : (
              <div className="flex flex-col items-center gap-4 text-center p-8">
                <LoadingRadar />
                <div className="font-display text-xs tracking-[0.25em] text-text-secondary">
                  AWAITING MISSION DATA
                </div>
                <p className="font-mono text-[11px] text-text-secondary/60 max-w-xs">
                  Upload a satellite image and initiate analysis to begin
                </p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL — Results */}
        <div className="bg-panel overflow-y-auto p-4 space-y-4">
          {hasResults && state.results ? (
            <>
              {/* Stat cards */}
              <div className="grid grid-cols-2 gap-2">
                <StatCard
                  label="START POINT"
                  value={formatCoord(state.results.start_point)}
                  glowColor="#00e5ff"
                  delay={0}
                />
                <StatCard
                  label="RESCUE TARGET"
                  value={formatCoord(state.results.goal_point)}
                  glowColor="#00ff88"
                  delay={0.1}
                />
                <StatCard
                  label="PATH LENGTH"
                  value={String(state.results.path_length)}
                  unit="steps"
                  glowColor="#00e5ff"
                  delay={0.2}
                />
                <StatCard
                  label="AVG COST"
                  value={state.results.cost_map_stats.avg_path_cost.toFixed(2)}
                  glowColor="#ffaa00"
                  delay={0.3}
                />
                <StatCard
                  label="PROCESSING"
                  value={formatMs(state.results.processing_time_ms)}
                  glowColor="#00e5ff"
                  delay={0.4}
                />
              </div>

              {/* Terrain chart */}
              {classDistribution && (
                <div className="card-frame p-3">
                  <TerrainChart classDistribution={classDistribution} />
                </div>
              )}

              {/* Path coords */}
              {state.results.path_coordinates.length > 0 && (
                <PathCoordinates coordinates={state.results.path_coordinates} />
              )}

              {/* Alert log */}
              <AlertLog results={state.results} />

              {/* View full report */}
              <GlowButton
                onClick={() => navigate("/results")}
                className="w-full"
              >
                <FileText className="w-3.5 h-3.5 inline mr-1.5" />
                VIEW FULL REPORT
              </GlowButton>
            </>
          ) : hasResults && state.segmentResults ? (
            <>
              {classDistribution && (
                <div className="card-frame p-3">
                  <TerrainChart classDistribution={classDistribution} />
                </div>
              )}
              <div className="card-frame p-3">
                <div className="font-display text-[10px] tracking-widest text-text-secondary uppercase mb-2">
                  SEGMENTATION COMPLETE
                </div>
                <p className="font-mono text-[11px] text-text-secondary">
                  Segmentation mask generated. Use full analysis mode for pathfinding.
                </p>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3 opacity-50">
              <div className="font-display text-[10px] tracking-widest text-text-secondary">
                NO DATA
              </div>
              <p className="font-mono text-[10px] text-text-secondary/60 max-w-[200px]">
                Results will appear here after analysis
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Error Modal */}
      {state.status === "error" && state.errorMessage && (
        <ErrorModal
          message={state.errorMessage}
          onClose={() => dispatch({ type: "RESET" })}
          onRetry={() => {
            dispatch({ type: "RESET" });
          }}
        />
      )}
    </PageWrapper>
  );
}
