/*
 * main.jsx (punto de entrada)
 *
 * Conecta React con la página: busca el elemento #root de index.html y le
 * indica a React que dibuje dentro de él el componente App. A partir de aquí,
 * React administra todo el contenido de #root; el resto del código no vuelve
 * a buscar elementos con getElementById.
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
// Vite permite importar CSS desde JavaScript; los estilos se aplican a toda la página.
import "./styles/styles.css";

createRoot(document.getElementById("root")).render(
  // StrictMode solo actúa en desarrollo: ejecuta algunos componentes y efectos dos veces
  // para ayudar a detectar errores (por ejemplo, efectos sin función de limpieza).
  <StrictMode>
    <App />
  </StrictMode>
);
