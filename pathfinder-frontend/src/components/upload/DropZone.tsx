import { useCallback, useState, useRef } from "react";
import { Upload, FileImage, AlertCircle } from "lucide-react";
import { useImageUpload } from "../../hooks/useImageUpload";
import { formatFileSize } from "../../utils/formatters";

export default function DropZone() {
  const { upload, isLoading, error } = useImageUpload();
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      setFileName(file.name);
      setFileSize(file.size);
      upload(file);
    },
    [upload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleClick = () => inputRef.current?.click();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-2">
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative flex flex-col items-center justify-center gap-3
          p-6 rounded border-2 border-dashed cursor-pointer
          transition-all duration-300
          ${
            isDragOver
              ? "border-accent-cyan bg-accent-cyan/5"
              : fileName
              ? "border-accent-green/50 bg-accent-green/5"
              : "border-border-default hover:border-text-secondary"
          }
        `}
        style={{
          boxShadow: isDragOver ? "inset 0 0 20px rgba(0,229,255,0.1)" : undefined,
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/tiff"
          className="hidden"
          onChange={handleChange}
        />

        {isLoading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-accent-cyan border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-text-secondary font-mono">PROCESSING...</span>
          </div>
        ) : fileName ? (
          <div className="flex flex-col items-center gap-2 text-center">
            <FileImage className="w-8 h-8 text-accent-green" />
            <span className="text-xs text-text-primary font-mono truncate max-w-full">
              {fileName}
            </span>
            <span className="text-[10px] text-text-secondary">
              {formatFileSize(fileSize)}
            </span>
          </div>
        ) : (
          <>
            <Upload
              className={`w-8 h-8 ${isDragOver ? "text-accent-cyan" : "text-text-secondary"}`}
            />
            <span className="text-xs font-display tracking-widest text-text-secondary">
              DROP SATELLITE IMAGE
            </span>
            <span className="text-[10px] text-text-secondary">
              PNG, JPEG, TIFF • Max 10 MB
            </span>
          </>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded bg-accent-red/10 border border-accent-red/30">
          <AlertCircle className="w-3.5 h-3.5 text-accent-red flex-shrink-0" />
          <span className="text-[11px] text-accent-red font-mono">{error}</span>
        </div>
      )}
    </div>
  );
}
