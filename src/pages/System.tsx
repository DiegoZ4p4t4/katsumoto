import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSystemInfo } from "@/hooks/useSystemInfo";
import { useAutoUpdate } from "@/hooks/useAutoUpdate";
import { usePlatform } from "@/lib/platform";
import {
  Monitor,
  Building2,
  RefreshCw,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";

export default function System() {
  const info = useSystemInfo();
  const { isTauri } = usePlatform();
  const {
    updateAvailable,
    updateInfo,
    downloadStatus,
    progress,
    error,
    checkForUpdates,
    downloadUpdate,
    installAndRestart,
    lastChecked,
  } = useAutoUpdate();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Sistema</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            Informacion del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
            <dt className="text-muted-foreground">Version</dt>
            <dd className="font-mono font-medium">{info.version}</dd>

            <dt className="text-muted-foreground">Plataforma</dt>
            <dd>{info.platform} ({info.arch})</dd>

            <dt className="text-muted-foreground flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" /> Empresa
            </dt>
            <dd>{info.companyName}</dd>

            <dt className="text-muted-foreground">RUC</dt>
            <dd>{info.ruc}</dd>

            <dt className="text-muted-foreground">Modo SUNAT</dt>
            <dd>
              <Badge variant={info.sunatMode === "Beta" ? "secondary" : "default"}>
                {info.sunatMode}
              </Badge>
            </dd>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Actualizaciones
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isTauri && (
            <p className="text-sm text-muted-foreground">
              Las actualizaciones solo estan disponibles en la app de escritorio.
            </p>
          )}

          {isTauri && (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {downloadStatus === "checking" ? (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  ) : downloadStatus === "error" ? (
                    <AlertCircle className="w-4 h-4 text-destructive" />
                  ) : updateAvailable ? (
                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                  ) : lastChecked ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : null}
                  {downloadStatus === "checking"
                    ? "Verificando..."
                    : downloadStatus === "error"
                      ? "Error al verificar"
                      : updateAvailable
                        ? `Version ${updateInfo?.version} disponible`
                        : lastChecked
                          ? "Estas en la ultima version"
                          : "Sin verificar"}
                </div>
                {lastChecked && (
                  <span className="text-xs text-muted-foreground">
                    Verificado: {lastChecked.toLocaleTimeString()}
                  </span>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg p-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="font-mono text-xs">{error}</span>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={checkForUpdates}
                  disabled={downloadStatus === "checking"}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${downloadStatus === "checking" ? "animate-spin" : ""}`} />
                  Buscar actualizaciones
                </Button>

                {updateAvailable && (
                  <Button
                    size="sm"
                    onClick={() => window.open("https://github.com/DiegoZ4p4t4/katsumoto/releases/latest", "_blank")}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Descargar v{updateInfo?.version}
                  </Button>
                )}
              </div>

              {updateAvailable && (
                <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                  <p>Se abrira la pagina de descargas en tu navegador.</p>
                  <p>Descarga el archivo <strong>.dmg</strong>, abrilo y arrastra Katsumoto a Aplicaciones.</p>
                </div>
              )}

              {updateInfo?.body && updateAvailable && (
                <div className="text-sm">
                  <p className="font-medium mb-1">Cambios en v{updateInfo.version}:</p>
                  <pre className="whitespace-pre-wrap text-muted-foreground bg-muted/50 rounded-lg p-3 text-xs">
                    {updateInfo.body}
                  </pre>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
