# PLAN: Impresión Térmica + App Desktop Tauri

## Estado: PENDIENTE
## Fecha: 18/04/2026
## Prerequisitos: Fase 1+2 completadas (ESC/POS builder + receipt builder en `src/lib/printing/thermal/`)

---

## Resumen

Implementar impresión térmica nativa para el POS de Katsumoto mediante una app desktop Tauri que envuelve la web app existente. La versión web mantiene impresión vía PDF como fallback. La versión desktop obtiene acceso directo a impresoras USB/serial/TCP, cajón de dinero, y auto-print.

---

## Principio: Progressive Capability

```
                    ┌─────────────────────────┐
                    │    React App (compartida) │
                    │    POS / Invoices / etc   │
                    └────────────┬──────────────┘
                                 │
                    ┌────────────▼──────────────┐
                    │    Adapter Interface       │
                    │    printer.print(escpos)   │
                    │    drawer.open()           │
                    └────┬──────────────┬────────┘
                         │              │
              ┌──────────▼──┐    ┌──────▼──────────┐
              │  Web Adapter │    │  Tauri Adapter   │
              │  PDF + print │    │  Serial + TCP    │
              │  dialog      │    │  ESC/POS directo │
              └──────────────┘    └──────────────────┘
```

---

## Comportamiento por Plataforma

| Funcionalidad | Web (browser) | Desktop (Tauri) |
|---|---|---|
| POS - ventas | Completo | Completo |
| Inventario | Completo | Completo |
| Facturación SUNAT | Completo | Completo |
| Reportes | Completo | Completo |
| Impresión ticket | PDF 80mm + `window.print()` | ESC/POS directo a impresora |
| Auto-print | No disponible | Disponible |
| Cajón de dinero | No disponible | Disponible |
| Escáner código barras | Solo campo input | Listener nativo (HID/serial) |
| Impresora red (TCP) | No disponible | Disponible |
| Configurar impresora | Solo diálogo OS | Detección automática USB |
| Velocidad impresión | ~5-8 seg (PDF→diálogo) | ~1-2 seg (directo) |

La versión web **NO deshabilita impresión** — degrada elegantemente:
- Siempre puede imprimir vía PDF + diálogo del browser
- Se muestra banner: "Para impresión térmica directa, instala la versión desktop"
- Botones de auto-print/cajón aparecen grises (disabled) con tooltip explicativo

---

## Compatibilidad de Impresoras (ESC/POS = estándar universal)

| Marca | Modelos típicos | Protocolo | Nota |
|---|---|---|---|
| Epson | TM-T20X, TM-T82, TM-T88VI | ESC/POS nativo | Creador del estándar |
| Star | TSP143, mC-Print3 | ESC/POS + StarPRNT | Modo ESC/POS funciona |
| Bixolon | SRP-350III, SRP-380 | ESC/POS nativo | Excelente compat |
| Xprinter | XP-58IIH, XP-80C | ESC/POS nativo | Económica, popular en PERÚ |
| POS-58/80 genéricas | Cualquier "POS-5890" | ESC/POS nativo | LATAM standard |
| Zonerich | AB-88K, AB-58K | ESC/POS nativo | Común en Perú |
| Daruma | DR700, DR800 | ESC/POS nativo | Mercado brasileño |

---

## Fases de Implementación

### FASE 0: Arquitectura de Adaptadores (~1 día)

Crear la capa de abstracción para que React no sepa si corre en web o desktop.

**Archivos nuevos:**

```
src/lib/platform/
  ├── types.ts              # Interfaces: PrinterAdapter, HardwareAdapter
  ├── detector.ts           # Detecta Tauri vs browser
  ├── platform-context.tsx  # React context provee adapters
  ├── adapters/
  │   ├── web-printer.ts    # PDF + window.print() (refactor del existente)
  │   └── tauri-printer.ts  # invoke() comandos Rust via IPC
  └── index.ts
```

**Interface clave:**

```typescript
// types.ts
export type PlatformType = "tauri" | "web";

export interface PrinterConfig {
  enabled: boolean;
  connectionType: "usb-serial" | "network-tcp" | "browser-pdf";
  paperWidth: 80 | 58;
  charsPerLine: 48 | 32 | 36;
  baudRate: 9600 | 19200 | 38400;
  serialPortName?: string;         // ej: "COM3", "/dev/ttyUSB0"
  networkIp?: string;              // ej: "192.168.1.50"
  networkPort?: number;            // default 9100
  autoPrint: boolean;
  autoCut: boolean;
  openDrawer: boolean;
  copies: 1 | 2 | 3;
}

export interface PrinterAdapter {
  readonly type: "native" | "pdf";
  readonly supportsAutoPrint: boolean;
  readonly supportsCashDrawer: boolean;
  readonly supportsNetworkPrinter: boolean;
  printReceipt(escpos: Uint8Array): Promise<void>;
  printTest(): Promise<void>;
  openCashDrawer(): Promise<void>;
  getStatus(): Promise<"ready" | "disconnected" | "error" | "no-config">;
}

export interface HardwareAdapter {
  printer: PrinterAdapter;
  platform: PlatformType;
  isTauri: boolean;
}
```

**Detector:**

```typescript
// detector.ts
export function detectPlatform(): PlatformType {
  return "__TAURI_INTERNALS__" in window ? "tauri" : "web";
}
```

**Web Adapter (refactor del existente):**

```typescript
// adapters/web-printer.ts
export class WebPrinterAdapter implements PrinterAdapter {
  readonly type = "pdf" as const;
  readonly supportsAutoPrint = false;
  readonly supportsCashDrawer = false;
  readonly supportsNetworkPrinter = false;

  async printReceipt(escpos: Uint8Array): Promise<void> {
    // Fallback: generar PDF térmico con el módulo existente
    // No se puede enviar ESC/POS directo, se usa thermal-ticket.ts
  }

  async printTest(): Promise<void> {
    // Generar PDF de prueba con window.print()
  }

  async openCashDrawer(): Promise<void> {
    console.warn("Cash drawer no disponible en modo web");
  }

  async getStatus(): Promise<"ready" | "no-config"> {
    return "no-config"; // En web siempre es "no-config" para impresión nativa
  }
}
```

**Tauri Adapter:**

```typescript
// adapters/tauri-printer.ts
import { invoke } from "@tauri-apps/api/core";

export class TauriPrinterAdapter implements PrinterAdapter {
  readonly type = "native" as const;
  readonly supportsAutoPrint = true;
  readonly supportsCashDrawer = true;
  readonly supportsNetworkPrinter = true;

  async printReceipt(escpos: Uint8Array): Promise<void> {
    const config = loadPrinterConfig();
    if (config.connectionType === "usb-serial") {
      await invoke("print_escpos", {
        portName: config.serialPortName,
        baudRate: config.baudRate,
        data: Array.from(escpos),
      });
    } else if (config.connectionType === "network-tcp") {
      await invoke("print_tcp", {
        host: config.networkIp,
        port: config.networkPort,
        data: Array.from(escpos),
      });
    }
  }

  async printTest(): Promise<void> {
    const { buildTestReceipt } = await import("@/lib/printing/thermal");
    const result = buildTestReceipt(loadPrinterConfig().paperWidth);
    await this.printReceipt(result.escpos);
  }

  async openCashDrawer(): Promise<void> {
    const config = loadPrinterConfig();
    if (config.connectionType === "usb-serial") {
      await invoke("open_cash_drawer", {
        portName: config.serialPortName,
        baudRate: config.baudRate,
      });
    }
  }

  async getStatus(): Promise<"ready" | "disconnected" | "no-config"> {
    const config = loadPrinterConfig();
    if (!config.enabled || config.connectionType === "browser-pdf") return "no-config";
    try {
      return await invoke("check_printer_status", { portName: config.serialPortName });
    } catch {
      return "disconnected";
    }
  }
}
```

**Platform Context:**

```typescript
// platform-context.tsx
const PlatformContext = createContext<HardwareAdapter | null>(null);

export function PlatformProvider({ children }: { children: ReactNode }) {
  const adapter = useMemo(() => {
    const platform = detectPlatform();
    const printer = platform === "tauri"
      ? new TauriPrinterAdapter()
      : new WebPrinterAdapter();
    return { printer, platform, isTauri: platform === "tauri" };
  }, []);

  return (
    <PlatformContext.Provider value={adapter}>
      {children}
    </PlatformContext.Provider>
  );
}

export function usePlatform() {
  return useContext(PlatformContext)!;
}
```

**Persistencia de config:**

```typescript
// En platform/adapters/ o en printer-config.ts
const STORAGE_KEY = "katsumoto-printer-config";

export function loadPrinterConfig(): PrinterConfig {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return JSON.parse(stored);
  return {
    enabled: false,
    connectionType: "browser-pdf",
    paperWidth: 80,
    charsPerLine: 48,
    baudRate: 9600,
    autoPrint: false,
    autoCut: true,
    openDrawer: false,
    copies: 1,
  };
}

export function savePrinterConfig(config: PrinterConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}
```

---

### FASE 1: Proyecto Tauri (~1 día)

**Inicializar Tauri v2 dentro del repo actual:**

```bash
pnpm add -D @tauri-apps/cli@latest
pnpm tauri init
```

**Estructura generada:**

```
src-tauri/
  ├── Cargo.toml              # Dependencias Rust
  ├── tauri.conf.json         # Config ventana, bundle, updater, permissions
  ├── capabilities/
  │   └── default.json        # Permisos: serialport, network, fs
  ├── icons/
  │   ├── icon.ico            # Windows
  │   ├── icon.icns           # macOS
  │   └── icon.png            # Linux / fallback
  └── src/
      ├── main.rs             # Entry point
      └── commands/
          ├── mod.rs
          ├── printer.rs      # Serial + TCP printer commands
          └── hardware.rs     # Cash drawer, status check
```

**Dependencias Rust (Cargo.toml):**

```toml
[dependencies]
tauri = { version = "2", features = [] }
tauri-plugin-shell = "2"
tauri-plugin-updater = "2"
tauri-plugin-process = "2"
serialport = "4"
tokio = { version = "1", features = ["full"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
```

**Comandos Rust (src-tauri/src/commands/printer.rs):**

```rust
use serialport::SerialPort;
use std::io::Write;
use std::net::TcpStream;
use tauri::command;

#[command]
pub async fn print_escpos(
    port_name: String,
    baud_rate: u32,
    data: Vec<u8>,
) -> Result<(), String> {
    let mut port = serialport::new(&port_name, baud_rate)
        .timeout(std::time::Duration::from_secs(5))
        .open()
        .map_err(|e| format!("Error abriendo puerto {}: {}", port_name, e))?;

    port.write_all(&data)
        .map_err(|e| format!("Error escribiendo en puerto: {}", e))?;

    port.flush()
        .map_err(|e| format!("Error flushing: {}", e))?;

    Ok(())
}

#[command]
pub async fn print_tcp(
    host: String,
    port: u16,
    data: Vec<u8>,
) -> Result<(), String> {
    let addr = format!("{}:{}", host, port);
    let mut stream = TcpStream::connect_timeout(
        &addr.parse().map_err(|e| format!("Dirección inválida: {}", e))?,
        std::time::Duration::from_secs(5),
    )
    .map_err(|e| format!("Error conectando a {}: {}", addr, e))?;

    stream.write_all(&data)
        .map_err(|e| format!("Error enviando datos: {}", e))?;

    Ok(())
}

#[command]
pub async fn list_serial_ports() -> Result<Vec<String>, String> {
    serialport::available_ports()
        .map(|ports| ports.iter().map(|p| p.port_name.clone()).collect())
        .map_err(|e| format!("Error listando puertos: {}", e))
}

#[command]
pub async fn open_cash_drawer(
    port_name: String,
    baud_rate: u32,
) -> Result<(), String> {
    let esc_drawer: [u8; 5] = [0x1b, 0x70, 0x00, 0x19, 0xfa];
    let mut port = serialport::new(&port_name, baud_rate)
        .timeout(std::time::Duration::from_secs(2))
        .open()
        .map_err(|e| format!("Error abriendo puerto: {}", e))?;

    port.write_all(&esc_drawer)
        .map_err(|e| format!("Error enviando comando cajón: {}", e))?;

    Ok(())
}

#[command]
pub async fn open_cash_drawer_tcp(
    host: String,
    port: u16,
) -> Result<(), String> {
    let esc_drawer: [u8; 5] = [0x1b, 0x70, 0x00, 0x19, 0xfa];
    let addr = format!("{}:{}", host, port);
    let mut stream = TcpStream::connect_timeout(
        &addr.parse().map_err(|e| format!("Dirección inválida: {}", e))?,
        std::time::Duration::from_secs(5),
    )
    .map_err(|e| format!("Error conectando: {}", e))?;

    stream.write_all(&esc_drawer)
        .map_err(|e| format!("Error enviando comando cajón: {}", e))?;

    Ok(())
}

#[command]
pub async fn check_printer_status(
    port_name: String,
    baud_rate: u32,
) -> Result<String, String> {
    let port = serialport::new(&port_name, baud_rate)
        .timeout(std::time::Duration::from_secs(2))
        .open()
        .map_err(|_| "disconnected".to_string())?;
    drop(port);
    Ok("ready".to_string())
}
```

**Comandos Rust (src-tauri/src/commands/hardware.rs):**

```rust
// Futuro: barcode scanner HID listener
// Por ahora placeholder
```

**Entry point (src-tauri/src/main.rs):**

```rust
mod commands;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![
            commands::printer::print_escpos,
            commands::printer::print_tcp,
            commands::printer::list_serial_ports,
            commands::printer::open_cash_drawer,
            commands::printer::open_cash_drawer_tcp,
            commands::printer::check_printer_status,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**Config Tauri (tauri.conf.json) — aspectos clave:**

```json
{
  "productName": "Katsumoto POS",
  "version": "2.0.0",
  "identifier": "com.katsumoto.pos",
  "app": {
    "windows": [{
      "title": "Katsumoto POS - United Parts Group",
      "width": 1280,
      "height": 800,
      "minWidth": 1024,
      "minHeight": 600,
      "fullscreen": false,
      "resizable": true
    }],
    "security": {
      "csp": null
    }
  },
  "bundle": {
    "active": true,
    "targets": ["msi", "nsis", "dmg", "appimage", "deb"],
    "icon": ["icons/icon.icns", "icons/icon.ico", "icons/icon.png"],
    "windows": {
      "certificateThumbprint": null,
      "digestAlgorithm": "sha256",
      "timestampUrl": ""
    }
  },
  "plugins": {
    "updater": {
      "pubkey": "",
      "endpoints": ["https://katsumoto.vercel.app/updates/{{target}}/{{arch}}/{{current_version}}"]
    }
  }
}
```

**Scripts package.json:**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build",
    "tauri:build:win": "tauri build --target x86_64-pc-windows-msvc",
    "tauri:build:mac": "tauri build --target aarch64-apple-darwin",
    "lint": "eslint ."
  }
}
```

---

### FASE 2: Configuración de Impresora — UI (~1 día)

**Archivo nuevo: `src/components/settings/PrinterSettings.tsx`**

Pantalla de configuración compartida. Se adapta según plataforma:

**En Tauri (desktop):**
- Pestaña USB Serial: botón "Detectar puertos" → lista COM/tty disponibles → seleccionar → test
- Pestaña TCP/IP: campos IP + puerto (default 9100) → botón "Test conexión"
- Ancho papel: 80mm / 58mm
- Opciones: auto-print, auto-cut, abrir cajón, copias (1-3)
- Baud rate: 9600 / 19200 / 38400
- Botón "Imprimir prueba" → envía ticket de prueba ESC/POS
- Indicador de estado: 🟢 conectada / 🔴 desconectada / ⚪ sin configurar

**En Web (browser):**
- Mensaje informativo: "La impresión térmica directa requiere la versión desktop"
- Botón "Descargar Katsumoto POS Desktop" (link a releases)
- Opción: papel térmico 80mm (para el PDF actual)
- El resto de opciones deshabilitadas con tooltip

**Ubicación en navegación:**
- Agregar item "Impresora" en Settings → sidebar
- O accesible desde POS → icono impresora en toolbar

**Guardar en:** `localStorage` key `katsumoto-printer-config` (por branch si es multi-sucursal)

---

### FASE 3: Hook `usePrinter` (~medio día)

**Archivo nuevo: `src/hooks/usePrinter.ts`**

```typescript
// API pública:
interface UsePrinterReturn {
  printReceipt: (invoice: Invoice, sellerInfo: SellerInfo, opts?: Partial<ReceiptOptions>) => Promise<void>;
  reprintReceipt: (invoice: Invoice, sellerInfo: SellerInfo) => Promise<void>;
  printTest: () => Promise<void>;
  openCashDrawer: () => Promise<void>;
  isReady: boolean;
  isTauri: boolean;
  isPrinting: boolean;
  status: "ready" | "disconnected" | "no-config" | "web-only";
  config: PrinterConfig;
  updateConfig: (config: Partial<PrinterConfig>) => void;
}
```

**Comportamiento:**

```
printReceipt(invoice, sellerInfo):
  1. buildEscposReceipt(invoice, sellerInfo, config) → Uint8Array
  2. Si Tauri:
     a. adapter.printReceipt(escpos) → invoke("print_escpos", ...)
     b. Si openDrawer → adapter.openCashDrawer()
  3. Si Web:
     a. Generar PDF térmico con thermal-ticket.ts existente
     b. Abrir window.print()

reprintReceipt():
  - Igual que printReceipt pero con isReprint: true
  - El ticket muestra "*** REIMPRESION ***"
```

---

### FASE 4: Integración en POS (~medio día)

**Archivos a modificar:**

1. **`src/hooks/usePosInvoice.ts`**
   - Importar `usePrinter`
   - `handleConfirmPayment()`: al éxito → si `autoPrint` → `printer.printReceipt()` automático
   - `handlePrintTicket()`: usar `printer.printReceipt()` (Tauri) o PDF fallback (web)

2. **`src/components/pos/PosPaymentDialog.tsx`**
   - Recibir props del printer status
   - Si Tauri + autoPrint: mostrar "✓ Impreso automáticamente"
   - Si Web: mostrar botones manuales + hint desktop
   - Botón re-imprimir disponible siempre
   - Indicador de estado de impresora (icono en toolbar)

3. **`src/pages/POS.tsx`**
   - Agregar `PlatformProvider` en el árbol (o en App.tsx)
   - Icono de impresora en toolbar con status tooltip

**Flujo de auto-print en Tauri:**

```
Usuario → Confirmar Venta
  → createInvoice (Supabase RPC)
  → registerTransaction (caja)
  → sendToSunat (si es factura) [async, no bloquea]
  → auto-print si config.autoPrint:
      buildEscposReceipt(invoice, sellerInfo, config)
      invoke("print_escpos", { data })
      invoke("open_cash_drawer") si config.openDrawer
  → Mostrar "✓ Venta exitosa — F001-123 — Impreso"
  → Si falla impresión: mostrar error + botón reintentar
```

---

### FASE 5: Build, CI/CD y Distribución (~1 día)

**GitHub Actions (.github/workflows/release.yml):**

```yaml
name: Release
on:
  push:
    tags: ["v*"]

jobs:
  build:
    strategy:
      matrix:
        include:
          - platform: windows-latest
            target: x86_64-pc-windows-msvc
          - platform: macos-latest
            target: aarch64-apple-darwin
          - platform: macos-latest
            target: x86_64-apple-darwin
          - platform: ubuntu-22.04
            target: x86_64-unknown-linux-gnu
    runs-on: ${{ matrix.platform }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - uses: dtolnay/rust-toolchain@stable
      - run: pnpm install
      - run: pnpm tauri build --target ${{ matrix.target }}
      - uses: actions/upload-artifact@v4
        with:
          name: katsumoto-${{ matrix.target }}
          path: src-tauri/target/release/bundle/*
```

**Output por plataforma:**

| Plataforma | Output | Tamaño aprox |
|---|---|---|
| Windows | `.msi` + `.exe` (NSIS installer) | ~8-12 MB |
| macOS (Apple Silicon) | `.dmg` | ~12-15 MB |
| macOS (Intel) | `.dmg` | ~12-15 MB |
| Linux | `.AppImage` + `.deb` | ~8-12 MB |

**Auto-update:**
- Tauri updater integrado con endpoint en Vercel
- Al publicar nuevo tag `v2.x.x`, el desktop app detecta y actualiza
- Configurar pubkey/signing en `tauri.conf.json`

---

## Estructura Final del Repo

```
Katsumoto/
  ├── src/                              # 100% compartido web + desktop
  │   ├── components/
  │   │   ├── pos/
  │   │   │   ├── PosPaymentDialog.tsx      # MODIFICADO: auto-print + printer status
  │   │   │   ├── PosCart.tsx
  │   │   │   └── PosProductGrid.tsx
  │   │   ├── invoices/
  │   │   ├── settings/
  │   │   │   └── PrinterSettings.tsx       # NUEVO
  │   │   └── ui/
  │   ├── hooks/
  │   │   ├── usePrinter.ts                 # NUEVO
  │   │   ├── usePosInvoice.ts              # MODIFICADO
  │   │   └── ...
  │   ├── lib/
  │   │   ├── platform/                     # NUEVO
  │   │   │   ├── types.ts
  │   │   │   ├── detector.ts
  │   │   │   ├── platform-context.tsx
  │   │   │   ├── adapters/
  │   │   │   │   ├── web-printer.ts
  │   │   │   │   └── tauri-printer.ts
  │   │   │   └── index.ts
  │   │   ├── printing/
  │   │   │   ├── thermal/                  # COMPLETADO (Fase 1+2)
  │   │   │   │   ├── escpos-commands.ts    # EscposBuilder
  │   │   │   │   ├── receipt-builder.ts    # buildTextReceipt + buildEscposReceipt
  │   │   │   │   └── index.ts
  │   │   │   ├── formats/
  │   │   │   │   └── thermal-ticket.ts     # PDF 80mm (web fallback)
  │   │   │   ├── generate.ts
  │   │   │   └── seller-info.ts
  │   │   └── ...
  │   └── pages/
  │       ├── POS.tsx                       # MODIFICADO: PlatformProvider
  │       └── ...
  ├── src-tauri/                            # NUEVO
  │   ├── Cargo.toml
  │   ├── tauri.conf.json
  │   ├── capabilities/
  │   │   └── default.json
  │   ├── icons/
  │   └── src/
  │       ├── main.rs
  │       └── commands/
  │           ├── mod.rs
  │           └── printer.rs
  ├── .github/
  │   └── workflows/
  │       └── release.yml                   # NUEVO
  ├── supabase/
  │   └── functions/
  ├── package.json                         # MODIFICADO: +tauri scripts
  └── vite.config.ts                       # Sin cambios
```

---

## Resumen de Esfuerzo

| Fase | Duración | Archivos nuevos | Archivos modificados |
|---|---|---|---|
| 0: Adaptadores platform | 1 día | 6 | 0 |
| 1: Proyecto Tauri (Rust) | 1 día | 5 (Rust) + configs | 1 (package.json) |
| 2: UI PrinterSettings | 1 día | 1 | 0 |
| 3: Hook usePrinter | 0.5 día | 1 | 0 |
| 4: Integración POS | 0.5 día | 0 | 3 |
| 5: Build/CI | 1 día | 1 (CI) | 1 (tauri.conf) |
| **Total** | **~5 días** | **~14 nuevos** | **~5 modificados** |

---

## Riesgos y Mitigaciones

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| Tauri v2 breaking changes | Media | Lock version en Cargo.toml, seguir changelog |
| serialport crate no compila en cross-compile | Baja | Usar CI matrix con nativo por plataforma |
| Permisos USB en macOS | Media | Documentar: System Preferences → Security |
| Instalador Windows SmartScreen | Alta | Firmar con certificate (evitar warning) |
| Impresora USB no detectada | Media | Listar puertos + fallback a TCP/IP |
| Web Serial API no disponible | Alta (Firefox/Safari) | PDF fallback siempre disponible |

---

## No Cambia

- Supabase (backend, auth, DB, edge functions, realtime)
- Vercel (deploy web en katsumoto.vercel.app)
- SUNAT billing (edge functions sin cambios)
- El ESC/POS builder ya creado (`src/lib/printing/thermal/`) se reutiliza al 100%
- El PDF térmico existente (`thermal-ticket.ts`) se usa como fallback web

---

## Orden de Ejecución Recomendado

1. **Fase 0** primero — es la base, sin riesgo, no toca nada existente
2. **Fase 3** (hook) — se puede hacer en paralelo con fase 1
3. **Fase 1** (Tauri) — setup del proyecto Rust
4. **Fase 2** (UI) — depende de fase 0
5. **Fase 4** (integración) — depende de 0+1+3
6. **Fase 5** (CI) — al final, cuando todo funciona local
