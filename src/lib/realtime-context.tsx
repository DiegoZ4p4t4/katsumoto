import { createContext, useContext, useState, type ReactNode } from "react";

type RealtimeStatus = "connected" | "reconnecting" | "disconnected";

interface RealtimeContextType {
  status: RealtimeStatus;
  setStatus: (status: RealtimeStatus) => void;
}

const RealtimeContext = createContext<RealtimeContextType | null>(null);

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<RealtimeStatus>("disconnected");

  return (
    <RealtimeContext.Provider value={{ status, setStatus }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtimeStatus() {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error("useRealtimeStatus debe usarse dentro de RealtimeProvider");
  }
  return context;
}
