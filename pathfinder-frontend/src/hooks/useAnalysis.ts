import { useState, useCallback } from "react";
import { useMission } from "../context/MissionContext";
import { analyzeImage, segmentOnly } from "../api/pathfinder";

interface UseAnalysisReturn {
  run: () => Promise<void>;
  isLoading: boolean;
}

export function useAnalysis(): UseAnalysisReturn {
  const { state, dispatch } = useMission();
  const [isLoading, setIsLoading] = useState(false);

  const run = useCallback(async () => {
    if (!state.uploadedImageBase64) return;

    setIsLoading(true);
    dispatch({ type: "SET_PROCESSING" });

    try {
      if (state.mode === "full") {
        const results = await analyzeImage(state.uploadedImageBase64);
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
  }, [state.uploadedImageBase64, state.mode, dispatch]);

  return { run, isLoading };
}
