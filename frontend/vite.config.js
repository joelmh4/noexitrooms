import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// En GitHub Pages la web vive en https://joelmh4.github.io/noexitrooms/, por eso la base es /noexitrooms/.
// En local (npm run dev) se sirve en la raíz: http://localhost:5173/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === "build" ? "/noexitrooms/" : "/"
}));
