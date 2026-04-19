import { useAutoUpdate } from "@/hooks/useAutoUpdate";
import { Download, X, RefreshCw, AlertCircle } from "lucide-react";
import { useState } from "react";

export function UpdateNotification() {
  const {
    updateAvailable,
    updateInfo,
    downloading,
    progress,
    error,
    downloadAndInstall,
  } = useAutoUpdate();
  const [dismissed, setDismissed] = useState(false);

  if (!updateAvailable || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-4">
      <div className="bg-card border border-border rounded-xl shadow-2xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
          <Download className="w-5 h-5 text-blue-500" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
            Nueva versión {updateInfo?.version} disponible
          </p>
          {downloading && (
            <div className="mt-2 w-full bg-muted rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-blue-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
          {error && (
            <p className="text-xs text-destructive flex items-center gap-1 mt-1">
              <AlertCircle className="w-3 h-3" />
              {error}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {downloading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>{progress}%</span>
            </div>
          ) : (
            <>
              <button
                onClick={downloadAndInstall}
                className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Actualizar
              </button>
              <button
                onClick={() => setDismissed(true)}
                className="p-1.5 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
