import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5201,
    // In dev le chiamate API del lookbook vengono inoltrate al
    // WooCommerce di produzione (stessa origine una volta deployato).
    proxy: {
      "/wp-json": {
        target: "https://bluej.gengioia.it",
        changeOrigin: true,
      },
    },
  },
});
