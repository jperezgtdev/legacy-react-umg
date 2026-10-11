/*
 * ConfirmacionEliminar.jsx
 *
 * Responsabilidad: pedir confirmación antes de eliminar un estudiante.
 *
 * En la versión legacy, el cuadro existe siempre en index.html (oculto con
 * el atributo hidden) y JavaScript lo muestra u oculta. Aquí el componente
 * solo existe mientras App.jsx tenga un estudiante pendiente de eliminar:
 * App lo renderiza de forma condicional y React lo agrega o lo quita del DOM.
 *
 * Props:
 *   - estudiante: estudiante que se desea eliminar.
 *   - procesando: true mientras la eliminación está en curso.
 *   - onConfirmar / onCancelar: funciones del padre que se ejecutan al pulsar
 *     cada botón. El componente no elimina nada por sí mismo; solo avisa.
 */
import { useEffect, useRef } from "react";

export default function ConfirmacionEliminar({ estudiante, procesando, onConfirmar, onCancelar }) {
  /*
   * useRef guarda una referencia a un elemento real del DOM. Se usa solo
   * para algo que React no hace por sí mismo: mover el foco. Es la única
   * excepción a "no tocar el DOM directamente", y está acotada a este botón.
   */
  const botonCancelarRef = useRef(null);

  // Al aparecer el cuadro se enfoca "Cancelar" para que pulsar Enter por accidente no elimine el registro.
  useEffect(() => {
    botonCancelarRef.current?.focus();
  }, []);

  /*
   * La tecla Escape cierra el cuadro. El evento se registra en document al
   * montar el componente y se elimina en la función de limpieza al
   * desmontarlo; si no se eliminara, cada apertura sumaría un manejador más.
   */
  useEffect(() => {
    function manejarTeclado(evento) {
      if (evento.key === "Escape") {
        onCancelar();
      }
    }
    document.addEventListener("keydown", manejarTeclado);
    return () => document.removeEventListener("keydown", manejarTeclado);
  }, [onCancelar]);

  return (
    <div className="dialogo-fondo">
      <div
        className="dialogo"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dialogo-titulo"
        aria-describedby="dialogo-descripcion"
      >
        <h2 id="dialogo-titulo" className="dialogo__titulo">
          Confirmar eliminación
        </h2>
        <p id="dialogo-descripcion" className="dialogo__texto">
          ¿Desea eliminar al estudiante {estudiante.codigo} - {estudiante.nombres} {estudiante.apellidos}?
          {" "}Esta acción no se puede deshacer.
        </p>
        <div className="dialogo__acciones">
          <button
            ref={botonCancelarRef}
            type="button"
            className="boton boton--secundario"
            onClick={onCancelar}
            disabled={procesando}
          >
            Cancelar
          </button>
          <button type="button" className="boton boton--peligro" onClick={onConfirmar} disabled={procesando}>
            {/* Expresión ternaria: elige el texto según el estado de la operación. */}
            {procesando ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}
