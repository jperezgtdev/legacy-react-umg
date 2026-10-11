import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// El plugin de React permite que Vite transforme JSX en llamadas de JavaScript
// que el navegador puede ejecutar.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
});
