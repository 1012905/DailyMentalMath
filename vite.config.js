import { defineConfig } from "vite";
import solid from "vite-plugin-solid";

const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
  plugins: [solid()],
  clearScreen: false,

  build: {
    target: "es2021",
    minify: "esbuild",
    cssMinify: "lightningcss",
    rollupOptions: {
      cache: true,
    },
  },

  server: {
    port: 1422,
    strictPort: true,
    host: host || false,
    hmr: host
      ? { protocol: "ws", host, port: 1423 }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
});
