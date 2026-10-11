/*
 * App.jsx (componente raíz)
 *
 * Responsabilidad: organizar el módulo de ingreso de estudiantes. Es el
 * componente que MANTIENE EL ESTADO compartido y lo distribuye a los demás
 * componentes mediante props:
 *
 *   App (estado: búsqueda, edición, eliminación, mensajes, guardando)
 *    |   + useEstudiantes (estado: estudiantes, carreras, carga, error)
 *    |
 *    |-- MensajeEstado          recibe el mensaje general
 *    |-- EstudianteForm         recibe el estudiante en edición y onGuardar
 *    |-- BuscadorEstudiantes    recibe el texto de búsqueda y onCambiar
 *    |-- EstudianteTable        recibe la lista filtrada, onEditar y onEliminar
 *    |     |-- EstudianteRow    (una por estudiante)
 *    |-- ConfirmacionEliminar   recibe el estudiante por eliminar
 *
 * Los datos bajan del padre a los hijos como props. Los hijos no modifican
 * esas props: cuando ocurre algo (un clic, un envío), llaman a una función
 * que recibieron del padre, y es el padre quien actualiza su estado. Con el
 * estado nuevo, React vuelve a ejecutar los componentes afectados.
 *
 * Comparado con legacy/js/app.js: allí, después de cambiar el objeto
 * "estado", se llama a mano a actualizarTabla(), limpiarFormulario(),
 * establecerModoFormulario(), etc. Aquí solo se llama a una función set...
 * y la interfaz se deriva del estado.
 */
import { useEffect, useState } from "react";
import BuscadorEstudiantes from "./components/BuscadorEstudiantes.jsx";
import ConfirmacionEliminar from "./components/ConfirmacionEliminar.jsx";
import EstudianteForm from "./components/EstudianteForm.jsx";
import EstudianteTable from "./components/EstudianteTable.jsx";
import MensajeEstado from "./components/MensajeEstado.jsx";
import { useEstudiantes } from "./hooks/useEstudiantes.js";
import { DURACION_MENSAJE_EXITO_MS, MENSAJES } from "./utils/mensajes.js";
import { filtrarEstudiantes } from "./utils/utilidades.js";

export default function App() {
  // Datos y operaciones del módulo, encapsulados en el hook personalizado.
  const {
    estudiantes,
    carreras,
    cargando,
    errorCarga,
    reintentarCarga,
    registrarEstudiante,
    modificarEstudiante,
    borrarEstudiante,
  } = useEstudiantes();

  // Estado propio de la interfaz. Cada valor que, al cambiar, debe modificar la pantalla se guarda con useState.
  const [textoBusqueda, setTextoBusqueda] = useState("");
  const [idEnEdicion, setIdEnEdicion] = useState(null);
  const [estudiantePorEliminar, setEstudiantePorEliminar] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null); // { tipo, texto } o null
  // Se incrementa para obtener un formulario nuevo y vacío (ver la prop key más abajo).
  const [versionFormulario, setVersionFormulario] = useState(0);

  /*
   * Valores derivados: se calculan en cada renderizado a partir del estado,
   * en lugar de guardarse en otro useState. Así nunca quedan desactualizados.
   * Por ejemplo, la lista filtrada se recalcula automáticamente cuando cambia
   * la colección o el texto de búsqueda.
   */
  const estudiantesVisibles = filtrarEstudiantes(estudiantes, textoBusqueda);
  const estudianteEnEdicion = estudiantes.find((estudiante) => estudiante.id === idEnEdicion) ?? null;
  const datosDisponibles = !cargando && !errorCarga;

  /*
   * Los mensajes de éxito se ocultan solos. El efecto se ejecuta cada vez que
   * cambia "mensaje"; la función de limpieza cancela el temporizador anterior
   * si llega un mensaje nuevo antes de que termine (equivale al clearTimeout
   * de mostrarMensaje() en legacy).
   */
  useEffect(() => {
    if (mensaje?.tipo !== "exito") {
      return undefined;
    }
    const temporizador = setTimeout(() => setMensaje(null), DURACION_MENSAJE_EXITO_MS);
    return () => clearTimeout(temporizador);
  }, [mensaje]);

  /* ---------------- Registro y edición ---------------- */

  // EstudianteForm llama a esta función solo cuando los datos ya pasaron la validación.
  async function manejarGuardar(datos) {
    setGuardando(true);
    try {
      if (estudianteEnEdicion) {
        await modificarEstudiante(estudianteEnEdicion.id, datos);
        setMensaje({ tipo: "exito", texto: MENSAJES.actualizacionExitosa });
      } else {
        await registrarEstudiante(datos);
        setMensaje({ tipo: "exito", texto: MENSAJES.registroExitoso });
      }
      // Volver al modo registro y pedir un formulario nuevo; React se encarga del resto.
      setIdEnEdicion(null);
      setVersionFormulario((version) => version + 1);
    } catch (error) {
      console.error("Error al guardar el estudiante:", error);
      setMensaje({ tipo: "error", texto: MENSAJES.errorOperacion });
    } finally {
      setGuardando(false);
    }
  }

  function manejarErrorValidacion() {
    setMensaje({ tipo: "error", texto: MENSAJES.erroresValidacion });
  }

  function manejarEditar(estudiante) {
    setIdEnEdicion(estudiante.id);
    setMensaje(null);
  }

  // En edición cancela la edición; en registro limpia el formulario. En ambos casos se pide un formulario nuevo.
  function manejarCancelar() {
    setIdEnEdicion(null);
    setVersionFormulario((version) => version + 1);
  }

  /* ---------------- Eliminación ---------------- */

  function manejarSolicitarEliminacion(estudiante) {
    setEstudiantePorEliminar(estudiante);
  }

  function manejarCancelarEliminacion() {
    if (!guardando) {
      setEstudiantePorEliminar(null);
    }
  }

  async function manejarConfirmarEliminacion() {
    const id = estudiantePorEliminar.id;
    setGuardando(true);
    try {
      await borrarEstudiante(id);
      // Si se eliminó el estudiante que estaba en edición, el formulario vuelve al modo registro.
      if (idEnEdicion === id) {
        setIdEnEdicion(null);
      }
      setMensaje({ tipo: "exito", texto: MENSAJES.eliminacionExitosa });
    } catch (error) {
      console.error("Error al eliminar el estudiante:", error);
      setMensaje({ tipo: "error", texto: MENSAJES.errorOperacion });
    } finally {
      setGuardando(false);
      setEstudiantePorEliminar(null);
    }
  }

  /*
   * La prop especial key identifica a un componente. Si cambia, React
   * destruye el formulario anterior y crea uno nuevo con su estado inicial.
   * La clave cambia al terminar la carga, al iniciar o terminar una edición
   * y cada vez que se incrementa versionFormulario (al guardar o limpiar).
   */
  const claveFormulario = !datosDisponibles
    ? "sin-datos"
    : `${estudianteEnEdicion ? `editar-${estudianteEnEdicion.id}` : "nuevo"}-${versionFormulario}`;

  // JSX: describe cómo debe verse la interfaz para el estado actual.
  return (
    <>
      <header className="encabezado">
        <div className="encabezado__contenido">
          <h1>Ingreso de estudiantes</h1>
          <p className="encabezado__subtitulo">Versión React: componentes, estado y props</p>
        </div>
      </header>

      <main className="contenedor">
        <div className="zona-mensaje" aria-live="polite">
          {mensaje && <MensajeEstado tipo={mensaje.tipo} texto={mensaje.texto} onCerrar={() => setMensaje(null)} />}
        </div>

        <div className="disposicion">
          <section className="tarjeta" aria-labelledby="titulo-formulario">
            <EstudianteForm
              key={claveFormulario}
              estudianteEnEdicion={estudianteEnEdicion}
              estudiantes={estudiantes}
              carreras={carreras}
              datosDisponibles={datosDisponibles}
              deshabilitado={!datosDisponibles || guardando}
              guardando={guardando}
              onGuardar={manejarGuardar}
              onCancelar={manejarCancelar}
              onErrorValidacion={manejarErrorValidacion}
            />
          </section>

          <section className="tarjeta" aria-labelledby="titulo-listado">
            <div className="tarjeta__encabezado">
              <h2 id="titulo-listado" className="tarjeta__titulo">
                Estudiantes registrados
              </h2>
              <p className="contador">
                {datosDisponibles && `Mostrando ${estudiantesVisibles.length} de ${estudiantes.length} estudiantes`}
              </p>
            </div>

            {/* setTextoBusqueda se pasa como prop: el hijo la llama y el estado se actualiza aquí, en el padre. */}
            <BuscadorEstudiantes valor={textoBusqueda} onCambiar={setTextoBusqueda} />

            <EstudianteTable
              estudiantes={estudiantesVisibles}
              totalEstudiantes={estudiantes.length}
              carreras={carreras}
              cargando={cargando}
              errorCarga={errorCarga}
              onReintentar={reintentarCarga}
              idEnEdicion={idEnEdicion}
              deshabilitado={guardando}
              onEditar={manejarEditar}
              onEliminar={manejarSolicitarEliminacion}
            />
          </section>
        </div>
      </main>

      {/* Renderizado condicional: el cuadro solo existe mientras hay un estudiante pendiente de eliminar. */}
      {estudiantePorEliminar && (
        <ConfirmacionEliminar
          estudiante={estudiantePorEliminar}
          procesando={guardando}
          onConfirmar={manejarConfirmarEliminacion}
          onCancelar={manejarCancelarEliminacion}
        />
      )}
    </>
  );
}
