import { useState, useCallback } from "react";
import { usePlatform } from "@/lib/platform";

export interface UpdateInfo {
  version: string;
  date: string;
  body: string;
}

export type DownloadStatus = "idle" | "checking" | "downloading" | "downloaded" | "error";

export interface UseAutoUpdateReturn {
  updateAvailable: boolean;
  updateInfo: UpdateInfo | null;
  downloadStatus: DownloadStatus;
  progress: number;
  error: string | null;
  checkForUpdates: () => Promise<void>;
  downloadUpdate: () => Promise<void>;
  installAndRestart: () => Promise<void>;
  lastChecked: Date | null;
}

export function useAutoUpdate(): UseAutoUpdateReturn {
  const { isTauri } = usePlatform();
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [downloadStatus, setDownloadStatus] = useState<DownloadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkForUpdates = useCallback(async () => {
    if (!isTauri) return;
    setDownloadStatus("checking");
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
      setDownloadStatus("idle");
      setLastChecked(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error verificando actualizaciones");
      setDownloadStatus("error");
    }
  }, [isTauri]);

  const downloadUpdate = useCallback(async () => {
    if (!isTauri || !updateAvailable) return;
    setDownloadStatus("downloading");
    setProgress(0);
    setError(null);

    try {
      const { check } = await import("@tauri-apps/plugin-updater");
      const { mkdir, writeFile } = await import("@tauri-apps/plugin-fs");
      const { cacheDir } = await import("@tauri-apps/api/path");

      const update = await check();
      if (!update) {
        setDownloadStatus("idle");
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

      const cache = await cacheDir();
      const flagPath = cache + "katsumoto-pos/.post-update";
      const dir = cache + "katsumoto-pos";
      await mkdir(dir, { recursive: true });
      await writeFile(flagPath, new TextEncoder().encode("1"));

      setDownloadStatus("downloaded");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error descargando actualización");
      setDownloadStatus("error");
    }
  }, [isTauri, updateAvailable]);

  const installAndRestart = useCallback(async () => {
    if (!isTauri) return;
    try {
      const { relaunch } = await import("@tauri-apps/plugin-process");
      await relaunch();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error reiniciando la aplicación");
    }
  }, [isTauri]);

  return {
    updateAvailable,
    updateInfo,
    downloadStatus,
    progress,
    error,
    checkForUpdates,
    downloadUpdate,
    installAndRestart,
    lastChecked,
  };
}
