import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import { viteSingleFile } from "vite-plugin-singlefile";

const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
  // 相对路径：构建产物可直接托管在任意子路径下
  // （GitHub Pages 项目站点位于 /<repo>/ 而非域名根目录）
  base: "./",
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
