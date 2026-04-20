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
      setError(e instanceof Error ? e.message : String(e));
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

      try {
        const { invoke } = await import("@tauri-apps/api/core");
        await invoke("write_post_update_flag");
      } catch {}

      setDownloadStatus("downloaded");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
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
