import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, RotateCcw } from "lucide-react";
import GlowButton from "../ui/GlowButton";

interface ErrorModalProps {
  message: string;
  onClose: () => void;
  onRetry?: () => void;
}

export default function ErrorModal({ message, onClose, onRetry }: ErrorModalProps) {
  let title = "SYSTEM ERROR";
  let description = message;

  if (message === "REQUEST_TIMEOUT") {
    title = "REQUEST TIMEOUT";
    description =
      "Analysis timed out — try a smaller image or check GPU availability";
  } else if (message === "API_OFFLINE") {
    title = "API OFFLINE";
    description =
      "Backend not reachable — start FastAPI server on port 8000";
  } else if (message.startsWith("SERVER_ERROR")) {
    title = "SERVER ERROR";
    description = message.replace("SERVER_ERROR: ", "");
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center px-4"
        style={{ backgroundColor: "rgba(10, 15, 30, 0.85)" }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="card-frame max-w-md w-full p-6"
          style={{ borderTopColor: "#ff4444", borderTopWidth: 2 }}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-accent-red" />
              <h3 className="font-display text-sm tracking-widest text-accent-red">
                {title}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="font-mono text-xs text-text-secondary mb-6 leading-relaxed">
            {description}
          </p>

          <div className="flex gap-3 justify-end">
            <GlowButton variant="danger" onClick={onClose}>
              DISMISS
            </GlowButton>
            {onRetry && (
              <GlowButton onClick={onRetry}>
                <RotateCcw className="w-3.5 h-3.5 inline mr-1.5" />
                RETRY
              </GlowButton>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
