import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import type { ReactNode, MouseEventHandler } from "react";

interface GlowButtonProps {
  children: ReactNode;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  variant?: "primary" | "danger";
  className?: string;
}

export default function GlowButton({
  children,
  onClick,
  disabled = false,
  loading = false,
  loadingText,
  variant = "primary",
  className = "",
}: GlowButtonProps) {
  const isPrimary = variant === "primary";
  const borderColor = isPrimary ? "border-accent-cyan" : "border-accent-red";
  const glowShadow = isPrimary ? "shadow-glow-cyan" : "shadow-glow-red";
  const textColor = isPrimary ? "text-accent-cyan" : "text-accent-red";

  return (
    <motion.button
      whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        relative px-6 py-3 font-display text-xs tracking-widest uppercase
        bg-base border ${borderColor} rounded ${textColor}
        transition-all duration-300
        ${!disabled && !loading ? `hover:${glowShadow} hover:bg-opacity-80` : ""}
        ${disabled || loading ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
        ${className}
      `}
      style={{
        boxShadow:
          !disabled && !loading
            ? undefined
            : undefined,
      }}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          (e.currentTarget as HTMLButtonElement).style.boxShadow = isPrimary
            ? "0 0 12px rgba(0,229,255,0.45)"
            : "0 0 12px rgba(255,68,68,0.45)";
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
      }}
    >
      <span className="flex items-center justify-center gap-2">
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {loading ? loadingText || children : children}
      </span>
    </motion.button>
  );
}
