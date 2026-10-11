/*
 * validaciones.js
 *
 * Reglas de validación del formulario de estudiantes. Las funciones solo
 * reciben datos y devuelven un objeto con errores; no muestran nada en
 * pantalla. Mostrar los errores es responsabilidad del componente
 * EstudianteForm. Son exactamente las mismas reglas de la versión legacy
 * (legacy/js/validaciones.js).
 */

export const ESTADOS_VALIDOS = ["ACTIVO", "INACTIVO"];

// Patrón sencillo: texto sin espacios, una arroba, dominio y extensión.
export const PATRON_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const FECHA_MINIMA_INGRESO = "2000-01-01";

export const MENSAJES_VALIDACION = {
  codigoObligatorio: "El código es obligatorio.",
  codigoDuplicado: "Ya existe un estudiante con este código.",
  nombresObligatorio: "Los nombres son obligatorios.",
  apellidosObligatorio: "Los apellidos son obligatorios.",
  correoObligatorio: "El correo electrónico es obligatorio.",
  correoInvalido: "Ingrese un correo electrónico válido, por ejemplo nombre@example.com.",
  carreraObligatoria: "Seleccione una carrera.",
  carreraInvalida: "La carrera seleccionada no existe.",
  fechaObligatoria: "La fecha de ingreso es obligatoria.",
  fechaInvalida: "Ingrese una fecha de ingreso válida.",
  fechaFueraDeRango: "La fecha de ingreso debe estar entre 01/01/2000 y el 31/12 del próximo año.",
  estadoInvalido: "Seleccione un estado válido (Activo o Inactivo).",
};

export function esCorreoValido(correo) {
  return PATRON_CORREO.test(correo);
}

/*
 * Una fecha es válida si tiene formato AAAA-MM-DD y corresponde a un día real
 * del calendario. new Date(2026, 1, 30) no produce error: JavaScript lo
 * convierte en 2 de marzo. Por eso se comprueba que el año, el mes y el día
 * no hayan cambiado al construir la fecha.
 */
export function esFechaValida(fechaIso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaIso)) {
    return false;
  }
  const [anio, mes, dia] = fechaIso.split("-").map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  return (
    fecha.getUTCFullYear() === anio &&
    fecha.getUTCMonth() === mes - 1 &&
    fecha.getUTCDate() === dia
  );
}

// Las fechas AAAA-MM-DD pueden compararse como texto porque el orden alfabético coincide con el cronológico.
export function estaFechaEnRango(fechaIso) {
  const fechaMaxima = `${new Date().getFullYear() + 1}-12-31`;
  return fechaIso >= FECHA_MINIMA_INGRESO && fechaIso <= fechaMaxima;
}

/*
 * Valida un estudiante ya limpio (ver limpiarDatosEstudiante) y devuelve un
 * objeto con la forma { campo: "mensaje" }. Si el objeto está vacío, no hay
 * errores.
 *
 * - estudiantes: colección actual, necesaria para comprobar códigos repetidos.
 * - carreras: catálogo de carreras, necesario para comprobar la selección.
 * - idEnEdicion: id del estudiante que se modifica (null al registrar). Se
 *   excluye de la comprobación de duplicados para que un estudiante pueda
 *   conservar su propio código al editarse.
 */
export function validarEstudiante(datos, estudiantes, carreras, idEnEdicion) {
  const errores = {};

  if (datos.codigo === "") {
    errores.codigo = MENSAJES_VALIDACION.codigoObligatorio;
  } else {
    const codigoRepetido = estudiantes.some(
      (estudiante) =>
        estudiante.id !== idEnEdicion &&
        estudiante.codigo.toUpperCase() === datos.codigo.toUpperCase()
    );
    if (codigoRepetido) {
      errores.codigo = MENSAJES_VALIDACION.codigoDuplicado;
    }
  }

  if (datos.nombres === "") {
    errores.nombres = MENSAJES_VALIDACION.nombresObligatorio;
  }

  if (datos.apellidos === "") {
    errores.apellidos = MENSAJES_VALIDACION.apellidosObligatorio;
  }

  if (datos.correo === "") {
    errores.correo = MENSAJES_VALIDACION.correoObligatorio;
  } else if (!esCorreoValido(datos.correo)) {
    errores.correo = MENSAJES_VALIDACION.correoInvalido;
  }

  if (datos.carreraId === null) {
    errores.carreraId = MENSAJES_VALIDACION.carreraObligatoria;
  } else if (!carreras.some((carrera) => carrera.id === datos.carreraId)) {
    errores.carreraId = MENSAJES_VALIDACION.carreraInvalida;
  }

  if (datos.fechaIngreso === "") {
    errores.fechaIngreso = MENSAJES_VALIDACION.fechaObligatoria;
  } else if (!esFechaValida(datos.fechaIngreso)) {
    errores.fechaIngreso = MENSAJES_VALIDACION.fechaInvalida;
  } else if (!estaFechaEnRango(datos.fechaIngreso)) {
    errores.fechaIngreso = MENSAJES_VALIDACION.fechaFueraDeRango;
  }

  if (!ESTADOS_VALIDOS.includes(datos.estado)) {
    errores.estado = MENSAJES_VALIDACION.estadoInvalido;
  }

  return errores;
}

export function tieneErrores(errores) {
  return Object.keys(errores).length > 0;
}
