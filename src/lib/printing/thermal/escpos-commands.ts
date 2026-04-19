// ============================================================
// ESC/POS Command Builder — Binary command generator for
// thermal receipt printers (Epson, Star, Bixolon, Xprinter, POS-58)
// ============================================================

export type Alignment = "left" | "center" | "right";
export type CutMode = "full" | "partial";
export type QRErrorLevel = "L" | "M" | "Q" | "H";
export type CodePage = 437 | 850 | 852 | 860 | 1252;

interface QRSizeRange {
  min: number;
  max: number;
}

const QR_SIZE_RANGE: QRSizeRange = { min: 1, max: 16 };

export class EscposBuilder {
  private buffer: number[] = [];

  private push(...bytes: number[]): this {
    for (const b of bytes) {
      this.buffer.push(b & 0xff);
    }
    return this;
  }

  private pushUtf8(text: string): this {
    const encoded = new TextEncoder().encode(text);
    for (const b of encoded) {
      this.buffer.push(b);
    }
    return this;
  }

  // ============================================================
  // Initialization
  // ============================================================

  init(): this {
    return this.push(0x1b, 0x40);
  }

  // ============================================================
  // Character formatting
  // ============================================================

  bold(on: boolean): this {
    return this.push(0x1b, 0x45, on ? 1 : 0);
  }

  underline(on: boolean): this {
    return this.push(0x1b, 0x2d, on ? 1 : 0);
  }

  inverse(on: boolean): this {
    return this.push(0x1d, 0x42, on ? 1 : 0);
  }

  doubleSize(on: boolean): this {
    return this.push(0x1d, 0x21, on ? 0x11 : 0x00);
  }

  doubleHeight(on: boolean): this {
    return this.push(0x1d, 0x21, on ? 0x01 : 0x00);
  }

  doubleWidth(on: boolean): this {
    return this.push(0x1d, 0x21, on ? 0x10 : 0x00);
  }

  // ============================================================
  // Alignment
  // ============================================================

  align(mode: Alignment): this {
    const code = mode === "left" ? 0 : mode === "center" ? 1 : 2;
    return this.push(0x1b, 0x61, code);
  }

  // ============================================================
  // Character spacing
  // ============================================================

  charSpacing(n: number): this {
    return this.push(0x1b, 0x20, Math.max(0, Math.min(n, 255)));
  }

  lineSpacing(n: number): this {
    return this.push(0x1b, 0x33, Math.max(0, Math.min(n, 255)));
  }

  resetLineSpacing(): this {
    return this.push(0x1b, 0x32);
  }

  // ============================================================
  // Code page (character set)
  // ============================================================

  codePage(page: CodePage): this {
    return this.push(0x1b, 0x74, page & 0xff);
  }

  // ============================================================
  // Text output
  // ============================================================

  text(text: string): this {
    return this.pushUtf8(text);
  }

  line(text: string): this {
    return this.pushUtf8(text).push(0x0a);
  }

  newline(n = 1): this {
    for (let i = 0; i < n; i++) {
      this.push(0x0a);
    }
    return this;
  }

  // ============================================================
  // Feed
  // ============================================================

  feed(lines: number): this {
    return this.push(0x1b, 0x64, Math.max(1, Math.min(lines, 255)));
  }

  feedDots(dots: number): this {
    return this.push(0x1b, 0x4a, Math.max(0, Math.min(dots, 255)));
  }

  // ============================================================
  // Paper cut
  // ============================================================

  cut(mode: CutMode = "full"): this {
    if (mode === "partial") {
      return this.push(0x1d, 0x56, 0x01);
    }
    return this.push(0x1d, 0x56, 0x00);
  }

  cutWithFeed(linesBeforeCut: number, mode: CutMode = "full"): this {
    this.feed(linesBeforeCut);
    return this.cut(mode);
  }

  // ============================================================
  // Cash drawer kick
  // ============================================================

  openCashDrawer(): this {
    return this.push(0x1b, 0x70, 0x00, 0x19, 0xfa);
  }

  openCashDrawerPin2(): this {
    return this.push(0x1b, 0x70, 0x01, 0x19, 0xfa);
  }

  // ============================================================
  // QR Code — Native ESC/POS QR (Model 2)
  // GS ( k PLC  (Epson/Star/Bixolon compatible)
  // ============================================================

  qrCode(data: string, size = 6, errorLevel: QRErrorLevel = "M"): this {
    const clampedSize = Math.max(QR_SIZE_RANGE.min, Math.min(size, QR_SIZE_RANGE.max));
    const errorBytes: Record<QRErrorLevel, number> = { L: 48, M: 49, Q: 50, H: 51 };
    const errorByte = errorBytes[errorLevel];

    const dataBytes = new TextEncoder().encode(data);
    const dataLen = dataBytes.length + 3;

    // Select QR model: Model 2
    this.push(
      0x1d, 0x28, 0x6b,
      4, 0,
      49, 65, 50, 0,
    );

    // Set QR size
    this.push(
      0x1d, 0x28, 0x6b,
      3, 0,
      49, 67, clampedSize,
    );

    // Set error correction level
    this.push(
      0x1d, 0x28, 0x6b,
      3, 0,
      49, 69, errorByte,
    );

    // Store QR data
    this.push(
      0x1d, 0x28, 0x6b,
      dataLen & 0xff, (dataLen >> 8) & 0xff,
      49, 80, 48,
    );
    for (const b of dataBytes) {
      this.push(b);
    }

    // Print QR
    this.push(
      0x1d, 0x28, 0x6b,
      3, 0,
      49, 81, 48,
    );

    return this;
  }

  // ============================================================
  // Barcode — Code128
  // ============================================================

  barcode128(data: string, height = 50, width = 2, showText = true): this {
    const dataBytes = new TextEncoder().encode(data);

    // Set barcode height
    this.push(0x1d, 0x68, height);

    // Set barcode width
    this.push(0x1d, 0x77, Math.max(1, Math.min(width, 6)));

    // Text position: below
    this.push(0x1d, 0x48, showText ? 2 : 0);

    // Print barcode: CODE128 (code 73)
    const len = dataBytes.length + 2;
    this.push(
      0x1d, 0x6b, 73,
      len & 0xff, (len >> 8) & 0xff,
      0x7b, 0x42,
    );
    for (const b of dataBytes) {
      this.push(b);
    }

    return this;
  }

  // ============================================================
  // Raster image (for logos)
  // ============================================================

  rasterImage(imageData: Uint8Array[], widthPx: number): this {
    const heightPx = imageData.length;
    if (heightPx === 0 || widthPx === 0) return this;

    const bytesPerRow = Math.ceil(widthPx / 8);

    for (let y = 0; y < heightPx; y++) {
      this.push(
        0x1b, 0x2a, 0x00,
        bytesPerRow & 0xff, (bytesPerRow >> 8) & 0xff,
      );
      for (const b of imageData[y]) {
        this.push(b);
      }
      this.push(0x0a);
    }

    return this;
  }

  // ============================================================
  // Bell (for attention sounds)
  // ============================================================

  bell(): this {
    return this.push(0x1b, 0x1c);
  }

  // ============================================================
  // Status request
  // ============================================================

  printerStatus(): this {
    return this.push(0x1b, 0x76);
  }

  offlineStatus(): this {
    return this.push(0x1b, 0x71, 0x04);
  }

  paperStatus(): this {
    return this.push(0x1d, 0x76, 0x01);
  }

  // ============================================================
  // Output
  // ============================================================

  toBytes(): Uint8Array {
    return new Uint8Array(this.buffer);
  }

  get length(): number {
    return this.buffer.length;
  }

  clear(): this {
    this.buffer = [];
    return this;
  }

  // ============================================================
  // Debug helpers
  // ============================================================

  toHexString(): string {
    return this.buffer.map((b) => b.toString(16).padStart(2, "0")).join(" ");
  }

  toDebugString(): string {
    const textDecoder = new TextDecoder("utf-8", { fatal: false });
    const bytes = this.toBytes();
    const lines: string[] = [];
    let currentLine = "";
    let i = 0;

    while (i < bytes.length) {
      if (bytes[i] === 0x0a) {
        lines.push(currentLine);
        currentLine = "";
        i++;
      } else if (bytes[i] === 0x1b || bytes[i] === 0x1d) {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = "";
        }
        const cmdStart = i;
        const cmdBytes: number[] = [];
        while (i < bytes.length && (bytes[i] === 0x1b || bytes[i] === 0x1d || cmdBytes.length < 5) && i < cmdStart + 8) {
          cmdBytes.push(bytes[i]);
          i++;
        }
        lines.push(`[CMD: ${cmdBytes.map((b) => b.toString(16).padStart(2, "0")).join(" ")}]`);
      } else if (bytes[i] >= 0x20 && bytes[i] < 0x7f) {
        currentLine += String.fromCharCode(bytes[i]);
        i++;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = "";
        }
        lines.push(`[0x${bytes[i].toString(16).padStart(2, "0")}]`);
        i++;
      }
    }
    if (currentLine) lines.push(currentLine);

    return lines.join("\n");
  }
}
