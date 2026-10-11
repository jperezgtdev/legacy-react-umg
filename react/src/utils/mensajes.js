/*
 * mensajes.js
 *
 * Centraliza los textos que la aplicación muestra al usuario. Son los mismos
 * mensajes funcionales de la versión legacy (legacy/js/mensajes.js).
 *
 * A diferencia de la versión legacy, este archivo es un módulo ES: cada
 * componente importa explícitamente lo que necesita con "import", en lugar
 * de depender de variables globales y del orden de carga de los scripts.
 */
export const MENSAJES = {
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
export const DURACION_MENSAJE_EXITO_MS = 4000;
