/*
 * MensajeEstado.jsx
 *
 * Responsabilidad: mostrar un mensaje de carga, información, éxito o error.
 * Se reutiliza en dos lugares: la zona de mensajes generales (App.jsx) y los
 * estados especiales de la tabla (EstudianteTable.jsx).
 *
 * Es un componente "de presentación": no tiene estado propio. Todo lo que
 * muestra llega por props, por lo que siempre dibuja lo mismo para los mismos
 * datos. Equivale a crearElementoMensaje() de legacy/js/estudiantes.js, pero
 * en lugar de crear elementos con document.createElement, describe en JSX
 * cómo debe verse el resultado.
 *
 * Props:
 *   - tipo: "info" | "cargando" | "exito" | "error"
 *   - texto: mensaje que se muestra.
 *   - onCerrar (opcional): si se recibe, se muestra el botón para cerrar.
 *   - children (opcional): contenido adicional, por ejemplo un botón Reintentar.
 */
export default function MensajeEstado({ tipo, texto, onCerrar, children }) {
  return (
    // JSX: parece HTML, pero es JavaScript. Por eso se escribe className en lugar de class
    // (class es una palabra reservada) y las expresiones van entre llaves {}.
    <div className={`mensaje mensaje--${tipo}`} role={tipo === "error" ? "alert" : "status"}>
      {/* Renderizado condicional con &&: el indicador solo existe si el tipo es "cargando". */}
      {tipo === "cargando" && <span className="indicador-carga" aria-hidden="true" />}

      {/* React escapa automáticamente el texto, igual que textContent: no se interpreta como HTML. */}
      <p className="mensaje__texto">{texto}</p>

      {children}

      {onCerrar && (
        <button type="button" className="mensaje__cerrar" aria-label="Cerrar mensaje" onClick={onCerrar}>
          ×
        </button>
      )}
    </div>
  );
}
