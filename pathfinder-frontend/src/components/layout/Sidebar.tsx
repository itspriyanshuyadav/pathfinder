import { useMission } from "../../context/MissionContext";
import DropZone from "../upload/DropZone";
import ImagePreview from "../upload/ImagePreview";
import GlowButton from "../ui/GlowButton";
import { useAnalysis } from "../../hooks/useAnalysis";
import { Scan, Layers, Wifi, WifiOff, Cpu } from "lucide-react";

export default function Sidebar() {
  const { state, dispatch } = useMission();
  const { run, isLoading } = useAnalysis();

  const canAnalyze =
    state.uploadedImageBase64 !== null &&
    state.status !== "processing" &&
    state.apiOnline;

  return (
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
        onClick={run}
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
  );
}
