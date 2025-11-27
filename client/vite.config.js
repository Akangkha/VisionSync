// vite.config.js (with React)
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react"; // For React projects
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    historyApiFallback: true,
  },
});
