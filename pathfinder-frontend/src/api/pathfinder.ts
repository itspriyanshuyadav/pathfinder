import apiClient from "./client";
import type { AnalyzeResponse, SegmentOnlyResponse, HealthResponse } from "../types";

export async function analyzeImage(base64: string): Promise<AnalyzeResponse> {
  try {
    const response = await apiClient.post<AnalyzeResponse>("/api/analyze", {
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
    const response = await apiClient.post<SegmentOnlyResponse>("/api/segment-only", {
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
    const response = await apiClient.get<HealthResponse>("/api/health");
    return response.data;
  } catch (error) {
    if (error instanceof Error && error.message === "API_OFFLINE") {
      return { status: "error", model_loaded: false };
    }
    return { status: "error", model_loaded: false };
  }
}
