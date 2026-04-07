export default function LoadingRadar() {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div
        className="relative rounded-full"
        style={{
          width: 120,
          height: 120,
          border: "1px solid var(--border-default)",
          background: "var(--bg-card)",
          overflow: "hidden",
        }}
      >
        {/* Grid lines */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,229,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.08) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        {/* Cross hairs */}
        <div
          className="absolute top-0 left-1/2 w-px h-full"
          style={{ background: "rgba(0,229,255,0.15)" }}
        />
        <div
          className="absolute left-0 top-1/2 w-full h-px"
          style={{ background: "rgba(0,229,255,0.15)" }}
        />
        {/* Sweeping sector */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "conic-gradient(from 0deg, transparent 0deg, rgba(0,229,255,0.3) 0deg, transparent 60deg)",
            animation: "radarSweep 2s linear infinite",
          }}
        />
        {/* Center dot */}
        <div
          className="absolute rounded-full"
          style={{
            width: 6,
            height: 6,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "#00e5ff",
            boxShadow: "0 0 10px rgba(0,229,255,0.8)",
            animation: "pulse 2s ease-in-out infinite",
          }}
        />
      </div>
    </div>
  );
}
