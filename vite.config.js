import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  root: ".",            // root of the project
  base: "/",            // base path
  server: {
    port: 3000,         // makes it localhost:3000
  },
});
