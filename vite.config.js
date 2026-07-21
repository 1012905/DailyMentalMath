import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import { viteSingleFile } from "vite-plugin-singlefile";

const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
  plugins: [solid(), viteSingleFile()],
  clearScreen: false,

  build: {
    target: "es2021",
    minify: "esbuild",
    cssMinify: "lightningcss",
    rollupOptions: {
      cache: true,
    },
    assetsInlineLimit: 100000000, // Inline all assets
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
