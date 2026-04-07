import { useState, useCallback } from "react";
import { useMission } from "../context/MissionContext";
import { fileToBase64 } from "../utils/imageUtils";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/tiff"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

interface UseImageUploadReturn {
  upload: (file: File) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useImageUpload(): UseImageUploadReturn {
  const { dispatch } = useMission();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(
    async (file: File) => {
      setError(null);

      if (!ALLOWED_TYPES.includes(file.type)) {
        setError("Invalid file type. Use PNG, JPEG, or TIFF.");
        return;
      }

      if (file.size > MAX_SIZE) {
        setError("File too large. Maximum size is 10 MB.");
        return;
      }

      setIsLoading(true);
      try {
        const base64 = await fileToBase64(file);
        dispatch({ type: "SET_FILE", payload: { file, base64 } });
      } catch {
        setError("Failed to process the image file.");
      } finally {
        setIsLoading(false);
      }
    },
    [dispatch]
  );

  return { upload, isLoading, error };
}
