import { useEffect, useRef } from "react";
import { checkHealth } from "../api/pathfinder";
import { useMission } from "../context/MissionContext";

export function useApiHealth(): void {
  const { dispatch } = useMission();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    async function poll() {
      try {
        const health = await checkHealth();
        dispatch({
          type: "SET_API_STATUS",
          payload: {
            apiOnline: health.status === "ok",
            modelLoaded: health.model_loaded,
          },
        });
      } catch {
        dispatch({
          type: "SET_API_STATUS",
          payload: { apiOnline: false, modelLoaded: false },
        });
      }
    }

    poll();
    intervalRef.current = setInterval(poll, 30000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [dispatch]);
}
