interface StatusPillProps {
  online: boolean;
  label?: string;
}

export default function StatusPill({ online, label }: StatusPillProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-border-default bg-card text-xs font-mono tracking-wider">
      <span
        className="w-2 h-2 rounded-full"
        style={{
          backgroundColor: online ? "#00ff88" : "#ff4444",
          boxShadow: online
            ? "0 0 8px rgba(0,255,136,0.6)"
            : "0 0 8px rgba(255,68,68,0.6)",
        }}
      />
      <span className={online ? "text-accent-green" : "text-accent-red"}>
        {label || (online ? "ONLINE" : "OFFLINE")}
      </span>
    </div>
  );
}
