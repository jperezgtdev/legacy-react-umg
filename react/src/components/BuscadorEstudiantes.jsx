/*
 * BuscadorEstudiantes.jsx
 *
 * Responsabilidad: capturar el texto de búsqueda.
 *
 * Es un "componente controlado": el valor del campo no lo guarda el
 * navegador sino el estado del componente padre (App.jsx), que lo envía por
 * la prop "valor". Cuando el usuario escribe, el componente avisa al padre
 * llamando a "onCambiar". El padre actualiza su estado y React vuelve a
 * dibujar el campo con el nuevo valor y la tabla con los resultados filtrados.
 *
 * En la versión legacy, el texto se lee del evento "input" y luego se llama
 * a mano a actualizarTabla(). Aquí basta con cambiar el estado.
 */
export default function BuscadorEstudiantes({ valor, onCambiar }) {
  return (
    <div className="buscador">
      {/* htmlFor es el equivalente JSX del atributo for: asocia la etiqueta con el campo. */}
      <label htmlFor="buscador" className="buscador__etiqueta">
        Buscar estudiante
      </label>
      <input
        id="buscador"
        type="search"
        className="buscador__campo"
        placeholder="Código, nombres, apellidos o correo"
        autoComplete="off"
        value={valor}
        // onChange en React se dispara con cada tecla (como el evento "input" del DOM).
        onChange={(evento) => onCambiar(evento.target.value)}
      />
    </div>
  );
}
