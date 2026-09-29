import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// 開発サーバー設定
// /api へのリクエストはバックエンド（http://localhost:3001）へプロキシする
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
