import { encodeEAN13, isValidEAN13 } from "@/lib/barcode";

interface BarcodeDisplayProps {
  code: string;
  width?: number;
  height?: number;
  showNumber?: boolean;
  className?: string;
}

export function BarcodeDisplay({
  code,
  width = 160,
  height = 64,
  showNumber = true,
  className = "",
}: BarcodeDisplayProps) {
  if (!code || code.length !== 13 || !isValidEAN13(code)) {
    return (
      <div className={`flex items-center justify-center bg-muted rounded-lg ${className}`} style={{ width, height }}>
        <span className="text-xs text-muted-foreground font-mono">Sin código</span>
      </div>
    );
  }

  const binary = encodeEAN13(code);
  const barHeight = showNumber ? height * 0.7 : height * 0.9;
  const moduleWidth = width / 95;

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <svg
        width={width}
        height={barHeight}
        viewBox={`0 0 95 ${barHeight}`}
        className="block"
      >
        {binary.split("").map((bit, i) => {
          if (bit === "0") return null;
          const isGuard = i < 3 || (i >= 45 && i < 50) || i >= 92;
          return (
            <rect
              key={i}
              x={i}
              y={0}
              width={1}
              height={isGuard ? barHeight : barHeight - 4}
              fill="#1a1a1a"
            />
          );
        })}
      </svg>
      {showNumber && (
        <div
          className="flex w-full px-1"
          style={{ fontSize: `${Math.max(8, width / 20)}px` }}
        >
          <span className="font-mono text-left" style={{ width: moduleWidth * 4 }}>
            {code[0]}
          </span>
          <span className="font-mono flex-1 text-center tracking-wider">
            {code.slice(1, 7)}
          </span>
          <span className="font-mono flex-1 text-center tracking-wider">
            {code.slice(7, 13)}
          </span>
        </div>
      )}
    </div>
  );
}

export function BarcodeCompact({ code, className = "" }: { code: string; className?: string }) {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <svg width={60} height={24} viewBox="0 0 95 30">
        {isValidEAN13(code) &&
          encodeEAN13(code)
            .split("")
            .map((bit, i) =>
              bit === "1" ? (
                <rect key={i} x={i} y={0} width={1} height={i < 3 || (i >= 45 && i < 50) || i >= 92 ? 30 : 26} fill="#333" />
              ) : null
            )}
      </svg>
      <span className="text-[9px] font-mono text-muted-foreground whitespace-nowrap">{code}</span>
    </div>
  );
}