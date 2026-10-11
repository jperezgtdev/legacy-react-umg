/*
 * EstudianteTable.jsx
 *
 * Responsabilidad: presentar el listado de estudiantes y sus estados
 * especiales (cargando, error de consulta, lista vacía, sin resultados).
 * Equivale a renderizarTabla() y mostrarEstadoTabla() de
 * legacy/js/estudiantes.js.
 *
 * No guarda estado: recibe por props la lista ya filtrada y las funciones
 * que deben ejecutarse al editar o eliminar. Cuando App.jsx cambia alguno de
 * esos datos, React vuelve a ejecutar este componente, compara el resultado
 * con el anterior y actualiza en el DOM solo lo que cambió. No es necesario
 * borrar y reconstruir la tabla como en la versión legacy.
 *
 * Props:
 *   - estudiantes: lista que se debe mostrar (ya filtrada por la búsqueda).
 *   - totalEstudiantes: cantidad total, para distinguir "lista vacía" de
 *     "sin resultados de búsqueda".
 *   - carreras: catálogo para mostrar el nombre de cada carrera.
 *   - cargando, errorCarga, onReintentar: estado de la consulta inicial.
 *   - idEnEdicion: id del estudiante que se edita (para resaltar su fila).
 *   - deshabilitado, onEditar, onEliminar: se transmiten a cada fila.
 */
import EstudianteRow from "./EstudianteRow.jsx";
import MensajeEstado from "./MensajeEstado.jsx";
import { MENSAJES } from "../utils/mensajes.js";
import { obtenerNombreCarrera } from "../utils/utilidades.js";

export default function EstudianteTable({
  estudiantes,
  totalEstudiantes,
  carreras,
  cargando,
  errorCarga,
  onReintentar,
  idEnEdicion,
  deshabilitado,
  onEditar,
  onEliminar,
}) {
  /*
   * Renderizado condicional: con JavaScript común se decide qué estado
   * mostrar. Si ninguna condición se cumple, estadoTabla queda en null y
   * React no dibuja nada en su lugar.
   */
  let estadoTabla = null;
  if (cargando) {
    estadoTabla = <MensajeEstado tipo="cargando" texto={MENSAJES.cargando} />;
  } else if (errorCarga) {
    estadoTabla = (
      // El botón se pasa como children: MensajeEstado lo coloca dentro del mensaje.
      <MensajeEstado tipo="error" texto={MENSAJES.errorConsulta}>
        <button type="button" className="boton boton--pequeno boton--secundario" onClick={onReintentar}>
          Reintentar
        </button>
      </MensajeEstado>
    );
  } else if (totalEstudiantes === 0) {
    estadoTabla = <MensajeEstado tipo="info" texto={MENSAJES.listaVacia} />;
  } else if (estudiantes.length === 0) {
    estadoTabla = <MensajeEstado tipo="info" texto={MENSAJES.sinResultados} />;
  }

  const mostrarFilas = !cargando && !errorCarga;

  return (
    // Un fragmento (<>...</>) agrupa varios elementos sin agregar una etiqueta extra al DOM.
    <>
      <div className="tabla-contenedor">
        <table className="tabla">
          <thead>
            <tr>
              <th scope="col">Código</th>
              <th scope="col">Nombres</th>
              <th scope="col">Apellidos</th>
              <th scope="col">Correo electrónico</th>
              <th scope="col">Carrera</th>
              <th scope="col">Fecha de ingreso</th>
              <th scope="col">Estado</th>
              <th scope="col">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {/*
              map transforma cada estudiante en un elemento JSX <EstudianteRow />.
              key debe ser estable y única: React la usa para saber qué fila
              corresponde a qué estudiante cuando la lista cambia (al filtrar,
              agregar o eliminar) y así actualizar solo las filas necesarias.
              Se usa el id y no la posición en el arreglo, porque la posición
              cambia al filtrar o eliminar.
            */}
            {mostrarFilas &&
              estudiantes.map((estudiante) => (
                <EstudianteRow
                  key={estudiante.id}
                  estudiante={estudiante}
                  nombreCarrera={obtenerNombreCarrera(carreras, estudiante.carreraId)}
                  enEdicion={estudiante.id === idEnEdicion}
                  deshabilitado={deshabilitado}
                  onEditar={onEditar}
                  onEliminar={onEliminar}
                />
              ))}
          </tbody>
        </table>
      </div>

      {estadoTabla && <div className="estado-tabla">{estadoTabla}</div>}
    </>
  );
}
