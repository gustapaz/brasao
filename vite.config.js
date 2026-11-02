import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
export default defineConfig({
  base: "/brasao/",
  plugins: [vue()],
  build: { sourcemap: false },
});
