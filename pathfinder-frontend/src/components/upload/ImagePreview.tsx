import { base64ToImageSrc } from "../../utils/imageUtils";

interface ImagePreviewProps {
  base64: string;
  fileName?: string;
}

export default function ImagePreview({ base64, fileName }: ImagePreviewProps) {
  return (
    <div className="rounded border border-border-default overflow-hidden">
      <div className="px-3 py-1.5 bg-card border-b border-border-default flex items-center justify-between">
        <span className="font-display text-[10px] tracking-widest text-text-secondary uppercase">
          PREVIEW
        </span>
        {fileName && (
          <span className="text-[10px] text-text-secondary font-mono truncate ml-2">
            {fileName}
          </span>
        )}
      </div>
      <div className="bg-base p-2">
        <img
          src={base64ToImageSrc(base64)}
          alt="Preview"
          className="w-full h-auto rounded"
          style={{ maxHeight: 150, objectFit: "contain" }}
        />
      </div>
    </div>
  );
}
