/*
 * useEstudiantes.js (hook personalizado)
 *
 * Un hook personalizado es una función de JavaScript cuyo nombre empieza con
 * "use" y que utiliza otros hooks de React (useState, useEffect, ...). Sirve
 * para agrupar lógica con estado y reutilizarla sin mezclarla con el JSX.
 *
 * Este hook es el puente entre los componentes y el servicio de datos:
 *   - Guarda en el estado de React la colección de estudiantes y de carreras.
 *   - Realiza la carga inicial con useEffect.
 *   - Expone funciones para registrar, actualizar y eliminar que llaman al
 *     servicio y, con su respuesta, actualizan el estado.
 *
 * Es el equivalente a la parte de legacy/js/app.js que mantiene el objeto
 * "estado" y llama a los servicios. La diferencia es que aquí, al cambiar el
 * estado con setEstudiantes, React vuelve a dibujar automáticamente los
 * componentes que usan esos datos; no hay una llamada a renderizarTabla().
 */
import { useEffect, useState } from "react";
import {
  actualizarEstudiante,
  crearEstudiante,
  eliminarEstudiante,
  obtenerCarreras,
  obtenerEstudiantes,
} from "../services/estudiantesService.js";

export function useEstudiantes() {
  /*
   * useState devuelve el valor actual y una función para cambiarlo. React
   * conserva el valor entre renderizados y, cuando se llama a la función
   * set..., vuelve a ejecutar el componente para mostrar el nuevo valor.
   */
  const [estudiantes, setEstudiantes] = useState([]);
  const [carreras, setCarreras] = useState([]);
  // Empieza en true porque la consulta se inicia en cuanto el componente aparece.
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(null);
  // Cambiar este número le indica al efecto que debe volver a consultar (botón Reintentar).
  const [intentoCarga, setIntentoCarga] = useState(0);

  /*
   * useEffect ejecuta código DESPUÉS de que React muestra el componente en
   * pantalla. Se usa para operaciones que salen del mundo de React, como
   * consultar datos por la red.
   *
   * Por qué no se consulta directamente en el cuerpo del componente: el
   * cuerpo se ejecuta en CADA renderizado. Si la consulta estuviera ahí,
   * cada setEstudiantes provocaría un nuevo renderizado, que lanzaría otra
   * consulta, que provocaría otro renderizado... un ciclo infinito.
   *
   * El arreglo de dependencias [intentoCarga] indica cuándo repetir el
   * efecto: al montar el componente y cada vez que intentoCarga cambie.
   * Con un arreglo vacío [] se ejecutaría solo al montar.
   */
  useEffect(() => {
    /*
     * La función de limpieza (return) se ejecuta si el componente desaparece
     * o si el efecto se repite antes de que la consulta termine. La variable
     * "cancelado" evita guardar en el estado una respuesta que ya no es
     * necesaria. En modo de desarrollo, React.StrictMode monta, desmonta y
     * vuelve a montar los componentes a propósito para detectar efectos sin
     * limpieza; gracias a esta variable, solo se usa la última respuesta.
     */
    let cancelado = false;

    async function cargarDatos() {
      try {
        // Promise.all lanza ambas consultas a la vez y espera a que las dos terminen.
        const [carrerasRecibidas, estudiantesRecibidos] = await Promise.all([
          obtenerCarreras(),
          obtenerEstudiantes(),
        ]);
        if (!cancelado) {
          setCarreras(carrerasRecibidas);
          setEstudiantes(estudiantesRecibidos);
          setErrorCarga(null);
        }
      } catch (error) {
        // El detalle técnico va a la consola; la interfaz mostrará un mensaje comprensible.
        console.error("Error al cargar los datos:", error);
        if (!cancelado) {
          setErrorCarga(error);
        }
      } finally {
        if (!cancelado) {
          setCargando(false);
        }
      }
    }

    // La función del efecto no puede ser async (debe devolver la limpieza, no una promesa),
    // por eso se declara una función async interna y se invoca.
    cargarDatos();

    return () => {
      cancelado = true;
    };
  }, [intentoCarga]);

  function reintentarCarga() {
    setCargando(true);
    setErrorCarga(null);
    setIntentoCarga((anterior) => anterior + 1);
  }

  /*
   * Las operaciones de modificación llaman al servicio y aplican su respuesta
   * al estado. No se modifica el arreglo existente (por ejemplo, con push):
   * se crea uno nuevo. React compara la referencia anterior con la nueva para
   * saber que algo cambió; si se modificara el mismo arreglo, no lo notaría.
   *
   * Se usa la forma setEstudiantes((anteriores) => ...) porque garantiza
   * trabajar sobre el valor más reciente del estado, aunque la operación
   * haya tardado y el estado haya cambiado mientras tanto.
   */
  async function registrarEstudiante(datos) {
    const nuevo = await crearEstudiante(datos);
    setEstudiantes((anteriores) => [...anteriores, nuevo]);
    return nuevo;
  }

  async function modificarEstudiante(id, datos) {
    const actualizado = await actualizarEstudiante(id, datos);
    setEstudiantes((anteriores) =>
      anteriores.map((estudiante) => (estudiante.id === id ? actualizado : estudiante))
    );
    return actualizado;
  }

  async function borrarEstudiante(id) {
    await eliminarEstudiante(id);
    setEstudiantes((anteriores) => anteriores.filter((estudiante) => estudiante.id !== id));
  }

  return {
    estudiantes,
    carreras,
    cargando,
    errorCarga,
    reintentarCarga,
    registrarEstudiante,
    modificarEstudiante,
    borrarEstudiante,
  };
}
