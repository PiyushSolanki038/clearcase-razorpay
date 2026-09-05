"use client";

// Shared loading state between DecisionPanel (right column, triggers "Run analysis")
// and ExtractedEvidencePanel (center column, shows a spinner while it runs) — they're
// sibling Server-Component-rendered cards, so this Context is what lets one client
// component's click state reach the other.

import { createContext, useContext, useState } from "react";

interface AnalysisContextValue {
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const AnalysisContext = createContext<AnalysisContextValue | null>(null);

export function AnalysisProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(false);
  return (
    <AnalysisContext.Provider value={{ loading, setLoading }}>
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysisLoading(): AnalysisContextValue {
  const ctx = useContext(AnalysisContext);
  if (!ctx) {
    throw new Error("useAnalysisLoading must be used within an AnalysisProvider");
  }
  return ctx;
}
