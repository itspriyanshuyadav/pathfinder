export interface AnalyzeRequest {
  image_base64: string;
}

export interface CostMapStats {
  min_cost: number;
  max_cost: number;
  avg_path_cost: number;
}

export interface AnalyzeResponse {
  status: "success" | "error";
  start_point: [number, number];
  goal_point: [number, number];
  path_length: number;
  path_coordinates: [number, number][];
  result_image_base64: string;
  segmentation_mask_base64: string;
  cost_map_stats: CostMapStats;
  processing_time_ms: number;
  message?: string;
}

export interface SegmentOnlyResponse {
  status: "success" | "error";
  mask_base64: string;
  class_distribution: {
    water: number;
    road: number;
    building: number;
    background: number;
  };
}

export interface HealthResponse {
  status: "ok" | "error";
  model_loaded: boolean;
}

export type AnalysisMode = "full" | "segment-only";

export type MissionStatus =
  | "idle"
  | "uploading"
  | "processing"
  | "success"
  | "error";

export interface MissionState {
  status: MissionStatus;
  mode: AnalysisMode;
  uploadedFile: File | null;
  uploadedImageBase64: string | null;
  results: AnalyzeResponse | null;
  segmentResults: SegmentOnlyResponse | null;
  apiOnline: boolean;
  modelLoaded: boolean;
  errorMessage: string | null;
  activeTab: "original" | "segmentation" | "rescue" | "path";
}

export type MissionAction =
  | { type: "SET_FILE"; payload: { file: File; base64: string } }
  | { type: "SET_MODE"; payload: AnalysisMode }
  | { type: "SET_PROCESSING" }
  | { type: "SET_RESULTS"; payload: AnalyzeResponse }
  | { type: "SET_SEGMENT_RESULTS"; payload: SegmentOnlyResponse }
  | { type: "SET_ERROR"; payload: string }
  | { type: "SET_API_STATUS"; payload: { apiOnline: boolean; modelLoaded: boolean } }
  | { type: "SET_ACTIVE_TAB"; payload: MissionState["activeTab"] }
  | { type: "RESET" };
