import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "./Sidebar";
import { BranchSelector } from "./BranchSelector";
import { ThemeToggle } from "./ThemeToggle";
import { UpdateNotification } from "./shared/UpdateNotification";
import { Menu, Wifi, WifiOff, RefreshCw } from "lucide-react";
import { useState } from "react";
import { SidebarProvider, useSidebar } from "./SidebarContext";
import { useRealtimeStatus } from "@/lib/realtime-context";
import { useAutoUpdate } from "@/hooks/useAutoUpdate";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

function RealtimeIndicator() {
  const { status } = useRealtimeStatus();

  const config = {
    connected: { color: "bg-green-500", label: "Sincronizado", Icon: Wifi },
    reconnecting: { color: "bg-yellow-500", label: "Reconectando...", Icon: Wifi },
    disconnected: { color: "bg-red-500", label: "Sin conexion", Icon: WifiOff },
  }[status];

  const { color, label, Icon } = config;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button className="p-2 hover:bg-muted rounded-lg transition-colors flex items-center gap-1.5">
          <Icon className="w-4 h-4 text-muted-foreground" />
          <span className={`w-2 h-2 rounded-full ${color}`} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  );
}

function UpdateCheckButton() {
  const { checkForUpdates, lastChecked } = useAutoUpdate();
  const [checking, setChecking] = useState(false);

  const handleCheck = async () => {
    setChecking(true);
    await checkForUpdates();
    setTimeout(() => setChecking(false), 1500);
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={handleCheck}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 text-muted-foreground ${checking ? "animate-spin" : ""}`} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>Buscar actualizaciones</p>
        {lastChecked && (
          <p className="text-[10px] text-muted-foreground">
            Ultima verificacion: {lastChecked.toLocaleTimeString()}
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

function LayoutInner({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { collapsed } = useSidebar();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <aside
        className={`hidden md:flex flex-shrink-0 transition-all duration-300 ease-in-out ${
          collapsed ? "w-[72px]" : "w-64"
        }`}
      >
        <Sidebar />
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 md:px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <button className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors">
                  <Menu className="w-5 h-5 text-foreground" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64">
                <Sidebar onClose={() => setOpen(false)} />
              </SheetContent>
            </Sheet>
            <BranchSelector />
          </div>
          <div className="flex items-center gap-1">
            <UpdateCheckButton />
            <RealtimeIndicator />
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </div>
      <UpdateNotification />
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <LayoutInner>{children}</LayoutInner>
    </SidebarProvider>
  );
}