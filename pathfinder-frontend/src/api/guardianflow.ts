import client from "./client";
import type { AnalyzeResponse, SegmentOnlyResponse, HealthResponse } from "../types";

export async function analyzeImage(base64: string): Promise<AnalyzeResponse> {
  try {
    const response = await client.post<AnalyzeResponse>("/api/analyze", {
      image_base64: base64,
    });
    return response.data;
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error("Unknown error during analysis");
  }
}

export async function segmentOnly(base64: string): Promise<SegmentOnlyResponse> {
  try {
    const response = await client.post<SegmentOnlyResponse>("/api/segment-only", {
      image_base64: base64,
    });
    return response.data;
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error("Unknown error during segmentation");
  }
}

export async function checkHealth(): Promise<HealthResponse> {
  try {
    const response = await client.get<HealthResponse>("/api/health");
    return response.data;
  } catch (error) {
    if (error instanceof Error && error.message === "API_OFFLINE") {
      return { status: "error", model_loaded: false };
    }
    return { status: "error", model_loaded: false };
  }
}

export async function manualPath(
  base64:      string,
  start_point: [number, number],
  goal_point:  [number, number]
) {
  const response = await client.post("/api/manual-path", {
    image_base64: base64,
    start_point,
    goal_point,
  });
  return response.data;
}
