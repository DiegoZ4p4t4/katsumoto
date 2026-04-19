import { useState, useEffect, useCallback } from "react";
import { usePlatform } from "@/lib/platform";

export interface UpdateInfo {
  version: string;
  date: string;
  body: string;
}

export interface UseAutoUpdateReturn {
  updateAvailable: boolean;
  updateInfo: UpdateInfo | null;
  downloading: boolean;
  progress: number;
  error: string | null;
  checkForUpdates: () => Promise<void>;
  downloadAndInstall: () => Promise<void>;
  lastChecked: Date | null;
}

export function useAutoUpdate(): UseAutoUpdateReturn {
  const { isTauri } = usePlatform();
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkForUpdates = useCallback(async () => {
    if (!isTauri) return;
    setError(null);

    try {
      const { check } = await import("@tauri-apps/plugin-updater");
      const update = await check();

      if (update) {
        setUpdateAvailable(true);
        setUpdateInfo({
          version: update.version,
          date: update.date ?? "",
          body: update.body ?? "",
        });
      } else {
        setUpdateAvailable(false);
        setUpdateInfo(null);
      }
      setLastChecked(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error verificando actualizaciones");
    }
  }, [isTauri]);

  const downloadAndInstall = useCallback(async () => {
    if (!isTauri || !updateAvailable) return;
    setDownloading(true);
    setProgress(0);
    setError(null);

    try {
      const { check } = await import("@tauri-apps/plugin-updater");
      const { relaunch } = await import("@tauri-apps/plugin-process");

      const update = await check();
      if (!update) {
        setDownloading(false);
        return;
      }

      let totalBytes = 0;
      let downloadedBytes = 0;
      await update.downloadAndInstall((ev: { event: string; data: Record<string, unknown> }) => {
        if (ev.event === "Started" && ev.data.contentLength) {
          totalBytes = ev.data.contentLength as number;
          setProgress(5);
        } else if (ev.event === "Progress" && totalBytes > 0) {
          downloadedBytes += (ev.data.chunkLength as number) || 0;
          setProgress(Math.round((downloadedBytes / totalBytes) * 100));
        } else if (ev.event === "Finished") {
          setProgress(100);
        }
      });

      await relaunch();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error instalando actualización");
      setDownloading(false);
    }
  }, [isTauri, updateAvailable]);

  useEffect(() => {
    if (isTauri) {
      const timer = setTimeout(() => {
        checkForUpdates();
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [isTauri, checkForUpdates]);

  return {
    updateAvailable,
    updateInfo,
    downloading,
    progress,
    error,
    checkForUpdates,
    downloadAndInstall,
    lastChecked,
  };
}
