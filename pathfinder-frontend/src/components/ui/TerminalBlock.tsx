import { useEffect, useRef } from "react";

interface TerminalBlockProps {
  lines: string[];
  title?: string;
}

export default function TerminalBlock({ lines, title }: TerminalBlockProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  return (
    <div className="rounded border border-border-default overflow-hidden">
      {title && (
        <div className="px-3 py-1.5 bg-card border-b border-border-default">
          <span className="font-display text-[10px] tracking-widest text-text-secondary uppercase">
            {title}
          </span>
        </div>
      )}
      <div
        ref={scrollRef}
        className="p-3 overflow-y-auto font-mono text-xs leading-relaxed"
        style={{
          backgroundColor: "#0a0f1e",
          color: "#7fdbca",
          maxHeight: "200px",
        }}
      >
        {lines.map((line, i) => (
          <div key={i} className="flex gap-2">
            <span className="text-text-secondary select-none">
              {String(i + 1).padStart(3, "0")}
            </span>
            <span>{line}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
