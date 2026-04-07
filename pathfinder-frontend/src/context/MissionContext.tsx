import {
  createContext,
  useContext,
  useReducer,
  type ReactNode,
  type Dispatch,
} from "react";
import type { MissionState, MissionAction } from "../types";

const initialState: MissionState = {
  status: "idle",
  mode: "full",
  uploadedFile: null,
  uploadedImageBase64: null,
  results: null,
  segmentResults: null,
  apiOnline: false,
  modelLoaded: false,
  errorMessage: null,
  activeTab: "original",
};

function missionReducer(state: MissionState, action: MissionAction): MissionState {
  switch (action.type) {
    case "SET_FILE":
      return {
        ...state,
        uploadedFile: action.payload.file,
        uploadedImageBase64: action.payload.base64,
        status: "idle",
        results: null,
        segmentResults: null,
        errorMessage: null,
        activeTab: "original",
      };
    case "SET_MODE":
      return { ...state, mode: action.payload };
    case "SET_PROCESSING":
      return {
        ...state,
        status: "processing",
        results: null,
        segmentResults: null,
        errorMessage: null,
      };
    case "SET_RESULTS":
      return {
        ...state,
        status: "success",
        results: action.payload,
        activeTab: "path",
      };
    case "SET_SEGMENT_RESULTS":
      return {
        ...state,
        status: "success",
        segmentResults: action.payload,
        activeTab: "segmentation",
      };
    case "SET_ERROR":
      return { ...state, status: "error", errorMessage: action.payload };
    case "SET_API_STATUS":
      return {
        ...state,
        apiOnline: action.payload.apiOnline,
        modelLoaded: action.payload.modelLoaded,
      };
    case "SET_ACTIVE_TAB":
      return { ...state, activeTab: action.payload };
    case "RESET":
      return { ...initialState, apiOnline: state.apiOnline, modelLoaded: state.modelLoaded };
    default:
      return state;
  }
}

interface MissionContextValue {
  state: MissionState;
  dispatch: Dispatch<MissionAction>;
}

const MissionContext = createContext<MissionContextValue | null>(null);

export function MissionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(missionReducer, initialState);
  return (
    <MissionContext.Provider value={{ state, dispatch }}>
      {children}
    </MissionContext.Provider>
  );
}

export function useMission(): MissionContextValue {
  const context = useContext(MissionContext);
  if (!context) {
    throw new Error("useMission must be used within a MissionProvider");
  }
  return context;
}
