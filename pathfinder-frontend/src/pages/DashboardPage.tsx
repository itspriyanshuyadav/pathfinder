import { useState } from "react";
import { useMission } from "../context/MissionContext";
import { useApiHealth } from "../hooks/useApiHealth";
import PageWrapper from "../components/layout/PageWrapper";
import ImageTabs from "../components/viewer/ImageTabs";
import ImageViewer from "../components/viewer/ImageViewer";
import ProcessingOverlay from "../components/modals/ProcessingOverlay";
import ErrorModal from "../components/modals/ErrorModal";
import LoadingRadar from "../components/ui/LoadingRadar";
import StatCard from "../components/results/StatCard";
import TerrainChart from "../components/results/TerrainChart";
import PathCoordinates from "../components/results/PathCoordinates";
import AlertLog from "../components/results/AlertLog";
import { formatCoord, formatMs } from "../utils/formatters";
import { useNavigate } from "react-router-dom";
import GlowButton from "../components/ui/GlowButton";
import { FileText, Scan, Layers, Wifi, WifiOff, Cpu } from "lucide-react";

import DropZone from "../components/upload/DropZone";
import ImagePreview from "../components/upload/ImagePreview";
import ClickableImage from "../components/viewer/ClickableImage";
import { manualPath, analyzeImage, segmentOnly } from "../api/guardianflow";
import type { PointSelectionMode } from "../types";

export default function DashboardPage() {
  useApiHealth();
  const { state, dispatch } = useMission();
  const navigate = useNavigate();

  // Selection states
  const [selectionMode, setSelectionMode] =
    useState<PointSelectionMode>("none");
  const [manualStart, setManualStart] =
    useState<[number, number] | null>(null);
  const [manualGoal, setManualGoal] =
    useState<[number, number] | null>(null);
  const [useManual, setUseManual] = useState(false);

  const handlePointSelect = (row: number, col: number) => {
    if (selectionMode === "start") {
      setManualStart([row, col]);
      setSelectionMode("goal");
    } else if (selectionMode === "goal") {
      setManualGoal([row, col]);
      setSelectionMode("none");
    }
  };

  const resetPoints = () => {
    setManualStart(null);
    setManualGoal(null);
    setSelectionMode("none");
  };

  const [isLoading, setIsLoading] = useState(false);

  // Analysis trigger handler
  const handleAnalyze = async () => {
    if (!state.uploadedImageBase64) return;

    setIsLoading(true);
    dispatch({ type: "SET_PROCESSING" });

    try {
      if (state.mode === "full") {
        let results;
        if (useManual && manualStart !== null && manualGoal !== null) {
          results = await manualPath(
            state.uploadedImageBase64, // base64 string
            manualStart,               // [number, number] -> [row, col]
            manualGoal                 // [number, number] -> [row, col]
          );
        } else {
          results = await analyzeImage(state.uploadedImageBase64);
        }
        if (results.status === "error") {
          dispatch({
            type: "SET_ERROR",
            payload: results.message || "Analysis failed",
          });
        } else {
          dispatch({ type: "SET_RESULTS", payload: results });
        }
      } else {
        const results = await segmentOnly(state.uploadedImageBase64);
        if (results.status === "error") {
          dispatch({ type: "SET_ERROR", payload: "Segmentation failed" });
        } else {
          dispatch({ type: "SET_SEGMENT_RESULTS", payload: results });
        }
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An unknown error occurred";
      dispatch({ type: "SET_ERROR", payload: message });
    } finally {
      setIsLoading(false);
    }
  };

  const canAnalyze =
    state.uploadedImageBase64 !== null &&
    state.status !== "processing" &&
    state.apiOnline &&
    (!useManual || (manualStart !== null && manualGoal !== null));

  // Determine which image to show based on active tab
  const getActiveImage = (): string | null => {
    switch (state.activeTab) {
      case "original":
        return state.uploadedImageBase64;
      case "segmentation":
        if (state.results?.segmentation_mask_base64)
          return state.results.segmentation_mask_base64;
        if (state.segmentResults?.mask_base64)
          return state.segmentResults.mask_base64;
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
  const hasResults =
    state.status === "success" && (state.results || state.segmentResults);

  // Build class distribution from either response
  const classDistribution =
    state.segmentResults?.class_distribution ||
    (state.results
      ? { water: 25, road: 20, building: 15, background: 40 }
      : null);

  // Styling helper variables
  const startBtnBg =
    selectionMode === "start"
      ? "rgba(0, 255, 136, 0.15)"
      : manualStart
      ? "rgba(0, 255, 136, 0.08)"
      : "transparent";

  const startBtnShadow =
    selectionMode === "start" ? "0 0 8px rgba(0, 255, 136, 0.4)" : "none";

  const isGoalDisabled = manualStart === null;

  const goalBtnBg =
    selectionMode === "goal"
      ? "rgba(255, 68, 68, 0.15)"
      : manualGoal
      ? "rgba(255, 68, 68, 0.08)"
      : "transparent";

  const goalBtnShadow =
    selectionMode === "goal" ? "0 0 8px rgba(255, 68, 68, 0.4)" : "none";

  return (
    <PageWrapper>
      <div className="dashboard-grid" style={{ marginTop: "56px" }}>
        {/* LEFT PANEL — Sidebar */}
        <div className="flex flex-col gap-4 p-4 bg-panel h-full overflow-y-auto">
          {/* Header */}
          <div className="font-display text-[10px] tracking-widest text-text-secondary uppercase border-b border-border-default pb-2">
            MISSION CONTROL
          </div>

          {/* Upload */}
          <DropZone />

          {/* Preview */}
          {state.uploadedImageBase64 && (
            <ImagePreview
              base64={state.uploadedImageBase64}
              fileName={state.uploadedFile?.name}
            />
          )}

          {/* MANUAL POINTS PANEL */}
          <div
            style={{
              border: "1px solid var(--border-default)",
              borderRadius: "4px",
              padding: "12px",
              background: "var(--bg-card)",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              transition: "all 0.2s ease",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  color: "var(--text-secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                MANUAL POINTS
              </span>
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    color: "var(--text-secondary)",
                  }}
                >
                  {useManual ? "ON" : "OFF"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !useManual;
                    setUseManual(nextVal);
                    if (!nextVal) {
                      resetPoints();
                    }
                  }}
                  style={{
                    width: "36px",
                    height: "20px",
                    borderRadius: "10px",
                    backgroundColor: useManual
                      ? "var(--accent-cyan)"
                      : "var(--border-default)",
                    position: "relative",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    transition: "background-color 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      width: "14px",
                      height: "14px",
                      borderRadius: "50%",
                      backgroundColor: "#ffffff",
                      position: "absolute",
                      left: useManual ? "19px" : "3px",
                      transition: "left 0.2s ease",
                    }}
                  />
                </button>
              </div>
            </div>

            {useManual && (
              <div
                style={{ display: "flex", flexDirection: "column", gap: "10px" }}
              >
                <button
                  onClick={() => setSelectionMode("start")}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #00ff88",
                    color: "#00ff88",
                    background: startBtnBg,
                    boxShadow: startBtnShadow,
                    borderRadius: "4px",
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    textAlign: "left",
                  }}
                >
                  {selectionMode === "start"
                    ? "⊕ CLICK IMAGE TO SET..."
                    : manualStart
                    ? `✅ START  [${manualStart[0]}, ${manualStart[1]}]`
                    : "📍 SET START POINT"}
                </button>

                <button
                  disabled={isGoalDisabled}
                  onClick={() => {
                    if (!isGoalDisabled) {
                      setSelectionMode("goal");
                    }
                  }}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #ff4444",
                    color: "#ff4444",
                    background: goalBtnBg,
                    boxShadow: goalBtnShadow,
                    borderRadius: "4px",
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    cursor: isGoalDisabled ? "not-allowed" : "pointer",
                    opacity: isGoalDisabled ? 0.4 : 1,
                    transition: "all 0.2s ease",
                    textAlign: "left",
                  }}
                >
                  {selectionMode === "goal"
                    ? "⊕ CLICK IMAGE TO SET..."
                    : manualGoal
                    ? `✅ GOAL   [${manualGoal[0]}, ${manualGoal[1]}]`
                    : "🎯 SET RESCUE TARGET"}
                </button>

                {manualStart === null && (
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Set start point first
                  </div>
                )}

                {manualStart !== null &&
                  manualGoal === null &&
                  selectionMode === "none" && (
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "10px",
                        color: "#ffaa00",
                      }}
                    >
                      ⚠ Now set the rescue target
                    </div>
                  )}

                {manualStart !== null && manualGoal !== null && (
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      color: "#00ff88",
                    }}
                  >
                    ✅ Both points set — ready to analyze
                  </div>
                )}

                {(manualStart !== null || manualGoal !== null) && (
                  <button
                    onClick={resetPoints}
                    style={{
                      width: "100%",
                      padding: "10px",
                      background: "transparent",
                      border: "1px solid var(--border-default)",
                      color: "var(--text-secondary)",
                      borderRadius: "4px",
                      fontFamily: "var(--font-mono)",
                      fontSize: "11px",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      marginTop: "4px",
                    }}
                  >
                    ↺ RESET POINTS
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Mode Toggle */}
          <div className="space-y-2">
            <div className="font-display text-[10px] tracking-widest text-text-secondary uppercase">
              ANALYSIS MODE
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => dispatch({ type: "SET_MODE", payload: "full" })}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded text-[10px] font-display tracking-wider transition-all border cursor-pointer ${
                  state.mode === "full"
                    ? "border-accent-cyan text-accent-cyan bg-accent-cyan/10"
                    : "border-border-default text-text-secondary hover:border-text-secondary"
                }`}
              >
                <Scan className="w-3 h-3" />
                FULL
              </button>
              <button
                onClick={() =>
                  dispatch({ type: "SET_MODE", payload: "segment-only" })
                }
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded text-[10px] font-display tracking-wider transition-all border cursor-pointer ${
                  state.mode === "segment-only"
                    ? "border-accent-cyan text-accent-cyan bg-accent-cyan/10"
                    : "border-border-default text-text-secondary hover:border-text-secondary"
                }`}
              >
                <Layers className="w-3 h-3" />
                SEGMENT
              </button>
            </div>
          </div>

          {/* Analyze Button */}
          <GlowButton
            onClick={handleAnalyze}
            disabled={!canAnalyze}
            loading={isLoading}
            loadingText="ANALYZING..."
            className="w-full"
          >
            INITIATE ANALYSIS
          </GlowButton>

          {/* API Offline Banner */}
          {!state.apiOnline && (
            <div className="flex items-center gap-2 px-3 py-2 rounded bg-accent-red/10 border border-accent-red/30">
              <WifiOff className="w-3.5 h-3.5 text-accent-red flex-shrink-0" />
              <span className="text-[10px] text-accent-red font-mono">
                Backend not reachable — start FastAPI server
              </span>
            </div>
          )}

          {/* System Status */}
          <div className="mt-auto space-y-2 pt-4 border-t border-border-default">
            <div className="font-display text-[10px] tracking-widest text-text-secondary uppercase">
              SYSTEM STATUS
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 font-mono text-[11px]">
                {state.apiOnline ? (
                  <Wifi className="w-3 h-3 text-accent-green" />
                ) : (
                  <WifiOff className="w-3 h-3 text-accent-red" />
                )}
                <span
                  className={
                    state.apiOnline ? "text-accent-green" : "text-accent-red"
                  }
                >
                  API: {state.apiOnline ? "CONNECTED" : "OFFLINE"}
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <Cpu className="w-3 h-3 text-text-secondary" />
                <span
                  style={{
                    color: state.modelLoaded
                      ? "var(--accent-green)"
                      : "var(--accent-amber)",
                  }}
                >
                  MODEL: {state.modelLoaded ? "LOADED" : "NOT LOADED"}
                </span>
              </div>
              {state.apiOnline && !state.modelLoaded && (
                <div className="text-[10px] text-accent-amber font-mono px-2 py-1 rounded bg-accent-amber/10 border border-accent-amber/20">
                  Model checkpoint not found — running in mock mode
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CENTER PANEL — Viewer */}
        <div className="relative flex flex-col bg-panel overflow-hidden">
          <ImageTabs />

          <div className="relative flex-1 flex items-center justify-center overflow-hidden">
            {state.status === "processing" && <ProcessingOverlay />}

            {state.activeTab === "original" ? (
              state.uploadedImageBase64 ? (
                <div style={{ width: "100%", height: "500px", position: "relative" }}>
                  <ClickableImage
                    imageSrc={state.uploadedImageBase64}
                    selectionMode={selectionMode}
                    startPoint={manualStart}
                    goalPoint={manualGoal}
                    onPointSelect={handlePointSelect}
                  />
                </div>
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
              )
            ) : activeImage ? (
              <ImageViewer
                base64={activeImage}
                label={state.activeTab.toUpperCase()}
              />
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
                  Segmentation mask generated. Use full analysis mode for
                  pathfinding.
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
