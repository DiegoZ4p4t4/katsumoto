import { useState } from "react";

const PLACEHOLDER_PALETTES = [
  { bg: "from-orange-100 to-amber-50", text: "text-orange-400" },
  { bg: "from-sky-100 to-blue-50", text: "text-sky-400" },
  { bg: "from-violet-100 to-purple-50", text: "text-violet-400" },
  { bg: "from-amber-100 to-yellow-50", text: "text-amber-400" },
  { bg: "from-rose-100 to-pink-50", text: "text-rose-400" },
  { bg: "from-teal-100 to-cyan-50", text: "text-teal-400" },
  { bg: "from-indigo-100 to-blue-50", text: "text-indigo-400" },
  { bg: "from-orange-100 to-red-50", text: "text-orange-400" },
  { bg: "from-fuchsia-100 to-pink-50", text: "text-fuchsia-400" },
  { bg: "from-lime-100 to-green-50", text: "text-lime-500" },
];

function getColorIndex(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % PLACEHOLDER_PALETTES.length;
}

function getInitials(name: string): string {
  const words = name.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ]/g, " ").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

interface ProductImageProps {
  src: string | null;
  name: string;
  className?: string;
  fallbackIcon?: React.ReactNode;
}

export function ProductImage({ src, name, className = "", fallbackIcon }: ProductImageProps) {
  const [hasError, setHasError] = useState(false);

  if (src && !hasError) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setHasError(true)}
        className={`object-cover ${className}`}
        loading="lazy"
      />
    );
  }

  const palette = PLACEHOLDER_PALETTES[getColorIndex(name)];
  const initials = getInitials(name);

  return (
    <div
      className={`bg-gradient-to-br ${palette.bg} flex items-center justify-center ${className}`}
    >
      {fallbackIcon ? (
        fallbackIcon
      ) : (
        <span className={`text-xl font-bold ${palette.text} opacity-50 select-none`}>
          {initials}
        </span>
      )}
    </div>
  );
}