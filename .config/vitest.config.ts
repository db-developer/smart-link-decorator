import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,

    // Projektroot eine Ebene über .config
    root: path.resolve(__dirname, ".."),
    sequence: {
      shuffle: false,     // keine Zufallsreihenfolge
      concurrent: false,  // Tests NICHT parallel, sondern nacheinander
    },

    // nur Tests innerhalb von src/test/
    include: ["src/test/**/*.test.ts"],
  },
});