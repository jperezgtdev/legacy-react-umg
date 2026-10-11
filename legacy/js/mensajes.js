/*
 * mensajes.js
 *
 * Centraliza los textos que la aplicación muestra al usuario. Mantenerlos en
 * un solo lugar evita escribir el mismo texto en varias funciones y garantiza
 * que la versión React (src/utils/mensajes.js) muestre exactamente los mismos
 * mensajes funcionales.
 *
 * En JavaScript tradicional sin módulos, esta constante queda en el ámbito
 * global. Por eso este archivo debe cargarse antes que los scripts que la usan
 * (ver el orden de las etiquetas <script> en index.html).
 */
const MENSAJES = {
  cargando: "Cargando estudiantes...",
  listaVacia: "No hay estudiantes registrados.",
  sinResultados: "No se encontraron estudiantes que coincidan con la búsqueda.",
  errorConsulta:
    "No fue posible consultar los datos de estudiantes. Intente nuevamente.",
  registroExitoso: "Estudiante registrado correctamente.",
  actualizacionExitosa: "Estudiante actualizado correctamente.",
  eliminacionExitosa: "Estudiante eliminado correctamente.",
  erroresValidacion: "Revise los campos marcados antes de continuar.",
  errorOperacion: "No fue posible completar la operación. Intente nuevamente.",
};

// Tiempo durante el cual se muestran los mensajes de éxito antes de ocultarse.
const DURACION_MENSAJE_EXITO_MS = 4000;
