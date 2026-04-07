import { Link, useLocation } from "react-router-dom";
import { Radar, Shield } from "lucide-react";
import StatusPill from "../ui/StatusPill";
import { useMission } from "../../context/MissionContext";

export default function Navbar() {
  const { state } = useMission();
  const location = useLocation();

  const navLinks = [
    { to: "/", label: "HOME" },
    { to: "/dashboard", label: "CONSOLE" },
    { to: "/results", label: "REPORT" },
    { to: "/about", label: "ABOUT" },
  ];

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 h-14"
      style={{
        backgroundColor: "rgba(10, 15, 30, 0.9)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border-default)",
      }}
    >
      <Link to="/" className="flex items-center gap-2.5 no-underline">
        <Shield className="w-5 h-5 text-accent-cyan" />
        <span className="font-display text-sm tracking-[0.25em] text-accent-cyan font-bold">
          PATHFINDER
        </span>
      </Link>

      <div className="flex items-center gap-6">
        {navLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`
              font-display text-[10px] tracking-widest no-underline transition-colors duration-200
              ${
                location.pathname === link.to
                  ? "text-accent-cyan"
                  : "text-text-secondary hover:text-text-primary"
              }
            `}
          >
            {link.label}
          </Link>
        ))}

        <div className="flex items-center gap-3 ml-4 pl-4 border-l border-border-default">
          <StatusPill online={state.apiOnline} label={state.apiOnline ? "API ONLINE" : "API OFFLINE"} />
          {state.apiOnline && (
            <div className="flex items-center gap-1.5">
              <Radar className="w-3.5 h-3.5 text-text-secondary" />
              <span
                className="text-[10px] font-mono"
                style={{
                  color: state.modelLoaded
                    ? "var(--accent-green)"
                    : "var(--accent-amber)",
                }}
              >
                {state.modelLoaded ? "MODEL READY" : "MOCK MODE"}
              </span>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
