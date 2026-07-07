import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"],
    globals: true,
    // Windows + vitest 4.1 crashes every file with "Cannot read properties of
    // undefined (reading 'config')" under the default parallel worker pool.
    // Disabling file parallelism makes `npm test` reliable everywhere without
    // callers needing to pass --no-file-parallelism.
    fileParallelism: false,
  },
});
