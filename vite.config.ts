import { defineConfig } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8551,
  },
  define: {
    __APP_VERSION__: JSON.stringify("2.0.0"),
  },
  plugins: [...(process.env.NODE_ENV === "development" ? [dyadComponentTagger()] : []), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          ui: [
            "@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-popover", "@radix-ui/react-select",
            "@radix-ui/react-tabs", "@radix-ui/react-tooltip",
            "@radix-ui/react-alert-dialog", "@radix-ui/react-checkbox",
            "@radix-ui/react-switch", "@radix-ui/react-scroll-area",
            "@radix-ui/react-separator", "@radix-ui/react-label",
            "@radix-ui/react-slot", "@radix-ui/react-toast",
          ],
          pdf: ["jspdf", "jspdf-autotable", "qrcode"],
          charts: ["recharts"],
          query: ["@tanstack/react-query"],
          supabase: ["@supabase/supabase-js"],
          form: ["react-hook-form", "@hookform/resolvers", "zod"],
          geo: ["./src/lib/geo-districts"],
          icons: ["lucide-react"],
        },
      },
    },
  },
}));
