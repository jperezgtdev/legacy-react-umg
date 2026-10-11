/*
 * EstudianteRow.jsx
 *
 * Responsabilidad: representar un estudiante como una fila de la tabla.
 * Equivale a crearFilaEstudiante() de legacy/js/estudiantes.js.
 *
 * Diferencia principal: en legacy cada celda se crea con createElement, se
 * le asigna textContent y se agrega con appendChild. Aquí se describe la fila
 * completa en JSX y React se encarga de crear o actualizar los elementos.
 *
 * Los botones reciben directamente su manejador onClick, con el estudiante
 * ya disponible por props. No se necesitan atributos data-id ni delegación
 * de eventos: cada fila "sabe" a qué estudiante pertenece.
 *
 * Props:
 *   - estudiante: datos del estudiante.
 *   - nombreCarrera: nombre ya resuelto de su carrera.
 *   - enEdicion: true si es el estudiante que se está editando (se resalta).
 *   - deshabilitado: true mientras hay una operación en curso.
 *   - onEditar / onEliminar: funciones del padre que reciben el estudiante.
 */
import { formatearFecha } from "../utils/utilidades.js";

export default function EstudianteRow({ estudiante, nombreCarrera, enEdicion, deshabilitado, onEditar, onEliminar }) {
  const nombreCompleto = `${estudiante.nombres} ${estudiante.apellidos}`;

  return (
    // La clase se calcula con una expresión: si la condición es falsa, no se agrega ninguna clase.
    <tr className={enEdicion ? "tabla__fila--edicion" : undefined}>
      {/* data-etiqueta lo usa el CSS para mostrar el nombre de la columna en pantallas pequeñas. */}
      <td data-etiqueta="Código">{estudiante.codigo}</td>
      <td data-etiqueta="Nombres">{estudiante.nombres}</td>
      <td data-etiqueta="Apellidos">{estudiante.apellidos}</td>
      <td data-etiqueta="Correo electrónico">{estudiante.correo}</td>
      <td data-etiqueta="Carrera">{nombreCarrera}</td>
      <td data-etiqueta="Fecha de ingreso">{formatearFecha(estudiante.fechaIngreso)}</td>
      <td data-etiqueta="Estado">
        <span className={`insignia insignia--${estudiante.estado.toLowerCase()}`}>
          {estudiante.estado === "ACTIVO" ? "Activo" : "Inactivo"}
        </span>
      </td>
      <td data-etiqueta="Acciones">
        <div className="acciones">
          {/*
            Se pasa una función flecha a onClick. Si se escribiera onClick={onEditar(estudiante)},
            la función se ejecutaría durante el renderizado, no al hacer clic.
          */}
          <button
            type="button"
            className="boton boton--pequeno boton--secundario"
            aria-label={`Editar a ${nombreCompleto}`}
            disabled={deshabilitado}
            onClick={() => onEditar(estudiante)}
          >
            Editar
          </button>
          <button
            type="button"
            className="boton boton--pequeno boton--peligro"
            aria-label={`Eliminar a ${nombreCompleto}`}
            disabled={deshabilitado}
            onClick={() => onEliminar(estudiante)}
          >
            Eliminar
          </button>
        </div>
      </td>
    </tr>
  );
}
