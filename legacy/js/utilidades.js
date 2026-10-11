/*
 * utilidades.js
 *
 * Funciones puras de apoyo: no leen ni modifican el DOM y no consultan datos.
 * Reciben valores y devuelven resultados. Esta característica permite
 * reutilizarlas desde cualquier parte de la aplicación y probarlas de forma
 * aislada. La versión React contiene las mismas funciones en
 * src/utils/utilidades.js.
 */

const PREFIJO_CODIGO = "EST-";

/*
 * Regla para generar códigos: se toma el mayor número que aparece después del
 * prefijo "EST-" en los códigos existentes, se le suma 1 y se completa con
 * ceros a la izquierda hasta tener cuatro dígitos (EST-0013, EST-0014, ...).
 * Como el resultado siempre es mayor que cualquier número existente, el
 * código generado no puede repetirse dentro de la colección.
 */
function generarCodigo(estudiantes) {
  const mayorNumero = estudiantes.reduce((mayor, estudiante) => {
    const numero = Number.parseInt(
      estudiante.codigo.toUpperCase().replace(PREFIJO_CODIGO, ""),
      10
    );
    // Los códigos que no siguen el patrón se ignoran para no producir NaN.
    return Number.isNaN(numero) ? mayor : Math.max(mayor, numero);
  }, 0);

  return PREFIJO_CODIGO + String(mayorNumero + 1).padStart(4, "0");
}

/*
 * Convierte un texto a minúsculas y elimina las tildes. Se usa en la búsqueda
 * para que "Lucia" encuentre a "Lucía" y "LOPEZ" encuentre a "López".
 */
function normalizarTexto(texto) {
  return String(texto ?? "")
    // NFD separa cada letra de su tilde ("í" pasa a "i" + tilde) y
    // \p{Diacritic} elimina esas marcas. La bandera u habilita \p{...}.
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

/*
 * Devuelve los estudiantes cuyo código, nombres, apellidos o correo contienen
 * el texto buscado. No modifica la colección original: crea un arreglo nuevo.
 */
function filtrarEstudiantes(estudiantes, textoBusqueda) {
  const criterio = normalizarTexto(textoBusqueda);
  if (criterio === "") {
    return estudiantes;
  }

  return estudiantes.filter((estudiante) =>
    [
      estudiante.codigo,
      estudiante.nombres,
      estudiante.apellidos,
      estudiante.correo,
    ].some((valor) => normalizarTexto(valor).includes(criterio))
  );
}

/*
 * Prepara los datos capturados en el formulario antes de validarlos o
 * enviarlos al servicio: elimina espacios sobrantes, unifica mayúsculas y
 * minúsculas y convierte la carrera a número, que es el tipo usado en el JSON.
 */
function limpiarDatosEstudiante(datos) {
  return {
    codigo: String(datos.codigo ?? "").trim().toUpperCase(),
    nombres: String(datos.nombres ?? "").trim(),
    apellidos: String(datos.apellidos ?? "").trim(),
    correo: String(datos.correo ?? "").trim().toLowerCase(),
    telefono: String(datos.telefono ?? "").trim(),
    carreraId: datos.carreraId === "" || datos.carreraId == null
      ? null
      : Number(datos.carreraId),
    fechaIngreso: String(datos.fechaIngreso ?? "").trim(),
    estado: String(datos.estado ?? "").trim(),
  };
}

// Busca el nombre de una carrera a partir de su identificador.
function obtenerNombreCarrera(carreras, carreraId) {
  const carrera = carreras.find((item) => item.id === carreraId);
  return carrera ? carrera.nombre : "Sin carrera";
}

/*
 * Convierte "2026-01-15" en "15/01/2026". Se separa el texto en lugar de usar
 * new Date("2026-01-15") porque ese constructor interpreta la fecha en UTC y,
 * según la zona horaria del navegador, podría mostrar el día anterior.
 */
function formatearFecha(fechaIso) {
  const [anio, mes, dia] = String(fechaIso).split("-");
  return dia && mes && anio ? `${dia}/${mes}/${anio}` : fechaIso;
}

// Devuelve la fecha local de hoy en formato AAAA-MM-DD, el formato de <input type="date">.
function obtenerFechaActual() {
  const hoy = new Date();
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  const dia = String(hoy.getDate()).padStart(2, "0");
  return `${hoy.getFullYear()}-${mes}-${dia}`;
}
