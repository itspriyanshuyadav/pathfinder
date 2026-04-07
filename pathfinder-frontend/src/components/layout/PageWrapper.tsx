import type { ReactNode } from "react";
import Navbar from "./Navbar";

interface PageWrapperProps {
  children: ReactNode;
  fullHeight?: boolean;
}

export default function PageWrapper({
  children,
  fullHeight = false,
}: PageWrapperProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main
        className={`flex-1 ${fullHeight ? "" : "pt-14"}`}
        style={{ marginTop: fullHeight ? 0 : undefined }}
      >
        {children}
      </main>
    </div>
  );
}
