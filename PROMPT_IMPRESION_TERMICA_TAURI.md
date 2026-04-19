# PROMPT: Impresión Térmica + App Desktop Tauri

## Contexto

Katsumoto POS (React 19 + Supabase) necesita impresión térmica nativa. Ya se completó la Fase 1+2: motor ESC/POS (`src/lib/printing/thermal/escpos-commands.ts`) y receipt builder SUNAT-compliant (`src/lib/printing/thermal/receipt-builder.ts`). Ahora se implementa la app desktop con Tauri que envuelve la web app existente para acceso nativo a impresoras USB/serial/TCP. La web mantiene impresión PDF como fallback.

## Instrucción

Lee el archivo `PLAN_IMPRESION_TERMICA_TAURI.md` que contiene el plan completo con 6 fases, código de referencia, interfaces, comandos Rust, estructura de archivos, y orden de ejecución. Comienza con la **Fase 0: Arquitectura de Adaptadores** creando `src/lib/platform/` con detector de plataforma, interfaces PrinterAdapter/HardwareAdapter, WebPrinterAdapter (PDF fallback), y PlatformProvider context. Sigue el orden: Fase 0 → Fase 3 (hook usePrinter) → Fase 1 (Tauri Rust) → Fase 2 (UI) → Fase 4 (integración POS) → Fase 5 (CI). Verifica con `pnpm build` después de cada fase.
