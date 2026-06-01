import React, { useRef, useEffect, useState, useCallback } from "react";
import type { PointSelectionMode } from "../../types";

interface ClickableImageProps {
  imageSrc: string; // base64 image string (no data: prefix)
  selectionMode: PointSelectionMode;
  startPoint: [number, number] | null; // [row, col] in 512x512 space
  goalPoint: [number, number] | null; // [row, col] in 512x512 space
  onPointSelect: (row: number, col: number) => void;
}

export default function ClickableImage({
  imageSrc,
  selectionMode,
  startPoint,
  goalPoint,
  onPointSelect,
}: ClickableImageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // Handle programmatically loading the image and checking timing
  useEffect(() => {
    setImgLoaded(false);
    if (!imageSrc) return;

    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setImgLoaded(true);
    };
    img.onerror = () => {
      console.error("Failed to load image");
    };
    
    // Always handle both cases: with or without data prefix
    img.src = imageSrc.startsWith("data:")
      ? imageSrc
      : `data:image/jpeg;base64,${imageSrc}`;
  }, [imageSrc]);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !imgLoaded) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, 512, 512);

    // Draw the image onto the 512x512 canvas
    ctx.drawImage(img, 0, 0, 512, 512);

    // Helper to draw a point marker
    const drawMarker = (
      point: [number, number],
      color: string,
      label: string,
      labelText: string
    ) => {
      const [row, col] = point;
      const x = col;
      const y = row;

      // Draw filled circle radius 10px
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();

      // Draw outer ring stroke radius 14px, lineWidth 3
      ctx.beginPath();
      ctx.arc(x, y, 14, 0, 2 * Math.PI);
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw letter centered inside circle
      ctx.font = "bold 12px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = label === "S" ? "#000000" : "#ffffff";
      ctx.fillText(label, x, y);

      // Draw small label tag to the right
      ctx.font = "bold 10px monospace";
      const textWidth = ctx.measureText(labelText).width;
      const tagX = x + 20;
      const tagY = y - 7;
      const tagW = textWidth + 8;
      const tagH = 14;

      ctx.fillStyle = color;
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(tagX, tagY, tagW, tagH, 3);
      } else {
        ctx.rect(tagX, tagY, tagW, tagH);
      }
      ctx.fill();

      ctx.fillStyle = label === "S" ? "#000000" : "#ffffff";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(labelText, tagX + 4, tagY + tagH / 2);
    };

    if (startPoint) {
      drawMarker(startPoint, "#00ff88", "S", "START");
    }

    if (goalPoint) {
      drawMarker(goalPoint, "#ff4444", "G", "GOAL");
    }
  }, [startPoint, goalPoint, imgLoaded]);

  // Redraw when image becomes loaded or point/mode changes
  useEffect(() => {
    if (imgLoaded) {
      redraw();
    }
  }, [imgLoaded, startPoint, goalPoint, redraw]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (selectionMode === "none") return;
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = 512 / rect.width;
    const scaleY = 512 / rect.height;
    
    // Scale coordinates correctly and clamp
    const col = Math.floor((e.clientX - rect.left) * scaleX);
    const row = Math.floor((e.clientY - rect.top) * scaleY);
    
    onPointSelect(
      Math.max(0, Math.min(row, 511)),
      Math.max(0, Math.min(col, 511))
    );
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (selectionMode === "none") {
      setTooltipPos(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setTooltipPos({ x, y });
  };

  const handleMouseLeave = () => {
    setTooltipPos(null);
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <canvas
        ref={canvasRef}
        width={512}
        height={512}
        onClick={handleCanvasClick}
        style={{
          border:
            selectionMode === "start"
              ? "2px solid #00ff88"
              : selectionMode === "goal"
              ? "2px solid #ff4444"
              : "2px solid var(--border-default)",
          boxShadow:
            selectionMode === "start"
              ? "0 0 12px rgba(0, 255, 136, 0.4)"
              : selectionMode === "goal"
              ? "0 0 12px rgba(255, 68, 68, 0.4)"
              : "none",
          transition: "border-color 0.2s, box-shadow 0.2s",
          cursor: selectionMode !== "none" ? "crosshair" : "default",
          width: "100%",
          height: "100%",
          maxHeight: "100%",
          maxWidth: "100%",
          display: "block",
          objectFit: "contain",
        }}
      />

      {!imgLoaded && imageSrc && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-secondary)",
            fontFamily: "var(--font-mono)",
            fontSize: "12px",
            background: "rgba(10,15,30,0.8)",
          }}
        >
          LOADING IMAGE...
        </div>
      )}

      {selectionMode !== "none" && tooltipPos && (
        <div
          style={{
            position: "absolute",
            left: tooltipPos.x + 12,
            top: tooltipPos.y + 12,
            background: "rgba(10,15,30,0.92)",
            border: `1px solid ${selectionMode === "start" ? "#00ff88" : "#ff4444"}`,
            color: "white",
            padding: "4px 8px",
            borderRadius: "4px",
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            pointerEvents: "none",
            zIndex: 10,
            whiteSpace: "nowrap",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.5)",
          }}
        >
          {selectionMode === "start" ? "📍 Click to place START" : "🎯 Click to place GOAL"}
        </div>
      )}

      {selectionMode !== "none" && (
        <div
          style={{
            position: "absolute",
            bottom: "16px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor:
              selectionMode === "start"
                ? "rgba(0, 255, 136, 0.2)"
                : "rgba(255, 68, 68, 0.2)",
            border: `1px solid ${selectionMode === "start" ? "#00ff88" : "#ff4444"}`,
            color: selectionMode === "start" ? "#00ff88" : "#ff4444",
            padding: "6px 12px",
            borderRadius: "4px",
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            letterSpacing: "0.05em",
            pointerEvents: "none",
            zIndex: 5,
            whiteSpace: "nowrap",
            backdropFilter: "blur(4px)",
          }}
        >
          {selectionMode === "start"
            ? "▶ CLICK IMAGE TO SET START POINT"
            : "▶ CLICK IMAGE TO SET RESCUE TARGET"}
        </div>
      )}
    </div>
  );
}
