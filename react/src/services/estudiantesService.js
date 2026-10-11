/*
 * estudiantesService.js (capa de acceso a datos)
 *
 * Este módulo es el único que sabe de dónde vienen los datos. Los
 * componentes no usan fetch directamente: llaman a funciones como
 * obtenerEstudiantes() o crearEstudiante() (a través del hook useEstudiantes)
 * y reciben promesas con objetos de JavaScript. Es el mismo servicio de la
 * versión legacy (legacy/js/servicios/estudiantesService.js).
 *
 * Importante: los archivos JSON de public/datos/ NO son una API REST.
 * Son archivos estáticos que representan la respuesta que normalmente
 * devolvería un servidor. Este servicio simula el comportamiento de una API:
 *
 *   - Las consultas iniciales se leen de los archivos JSON con fetch.
 *   - Las operaciones de crear, actualizar y eliminar se aplican sobre una
 *     copia de los datos guardada en memoria (variable estudiantesEnMemoria),
 *     porque un servidor de archivos estáticos no permite escribir en el JSON.
 *     El servicio devuelve el resultado de cada operación y el hook
 *     useEstudiantes lo aplica al estado de React, que es el que la interfaz
 *     muestra.
 *   - Al recargar la página, la memoria se pierde y los datos vuelven a ser
 *     los del archivo JSON.
 *
 * Por qué los JSON están en public/ y no en src/: si se importaran con
 * "import datos from './estudiantes.json'", Vite los incluiría dentro del
 * código JavaScript y no habría ninguna solicitud de red que observar. Los
 * archivos de public/ se publican tal cual y se consultan con fetch, igual
 * que se consultaría una API.
 *
 * Cuando exista un backend real (por ejemplo, Spring Boot), solo será
 * necesario reemplazar el contenido de estas funciones por solicitudes
 * GET, POST, PUT y DELETE. Los componentes no tendrían que cambiar.
 */

/*
 * Configuración de la simulación.
 * - demoraMs: milisegundos de espera artificial para observar el estado de
 *   carga, como ocurriría con una red real.
 * - simularError: si es true, todas las solicitudes fallan, lo que permite
 *   observar cómo la interfaz maneja los errores.
 *
 * También pueden cambiarse desde la barra de direcciones sin editar el
 * código, por ejemplo: http://localhost:5173/?demora=2000 o http://localhost:5173/?error=1
 */
export const CONFIG_API = {
  // import.meta.env.BASE_URL es la ruta base de la aplicación definida por Vite ("/" por defecto).
  urlBase: `${import.meta.env.BASE_URL}datos`,
  demoraMs: 800,
  simularError: false,
};

// Se lee la URL una sola vez, cuando el módulo se carga por primera vez.
const parametrosUrl = new URLSearchParams(window.location.search);
if (parametrosUrl.has("demora")) {
  const demora = Number(parametrosUrl.get("demora"));
  CONFIG_API.demoraMs = Number.isFinite(demora) && demora >= 0 ? demora : CONFIG_API.demoraMs;
}
if (parametrosUrl.get("error") === "1") {
  CONFIG_API.simularError = true;
}

/*
 * Copia en memoria que hace el papel de la "base de datos del servidor".
 * Vale null hasta que se consulta el archivo JSON por primera vez.
 */
let estudiantesEnMemoria = null;

/*
 * Devuelve una promesa que se resuelve después de "ms" milisegundos.
 * setTimeout trabaja con funciones de retorno (callbacks); al envolverlo en
 * una promesa se puede usar con await y el código se lee de arriba abajo.
 */
function esperar(ms) {
  return new Promise((resolver) => setTimeout(resolver, ms));
}

// Simula el tiempo de viaje por la red y, si está configurado, un fallo del servidor.
async function simularRed() {
  await esperar(CONFIG_API.demoraMs);
  if (CONFIG_API.simularError) {
    throw new Error("Error simulado: el servidor no respondió.");
  }
}

/*
 * Consulta un archivo JSON con fetch.
 * fetch solo rechaza la promesa si hay un fallo de red; una respuesta 404 o
 * 500 se considera "exitosa". Por eso se revisa respuesta.ok y se lanza un
 * error manualmente cuando el servidor responde con un código de error.
 */
async function consultarJson(nombreArchivo) {
  await simularRed();
  const respuesta = await fetch(`${CONFIG_API.urlBase}/${nombreArchivo}`);
  if (!respuesta.ok) {
    throw new Error(`No se pudo leer ${nombreArchivo} (HTTP ${respuesta.status}).`);
  }
  return respuesta.json();
}

// Se usa en crear, actualizar y eliminar por si se llaman antes de la primera consulta.
async function obtenerColeccionEnMemoria() {
  if (estudiantesEnMemoria === null) {
    estudiantesEnMemoria = await consultarJson("estudiantes.json");
  }
  return estudiantesEnMemoria;
}

/*
 * Se devuelven copias de los objetos ({ ...estudiante }) para que la interfaz
 * no pueda modificar por accidente los datos del "servidor" y para que el
 * estado de React nunca comparta objetos con esta memoria. Con una API real
 * esto ocurre de forma natural: cada respuesta es un objeto nuevo.
 */
function copiar(estudiante) {
  return { ...estudiante };
}

// Equivale a GET /api/carreras
export async function obtenerCarreras() {
  return consultarJson("carreras.json");
}

// Equivale a GET /api/estudiantes
export async function obtenerEstudiantes() {
  if (estudiantesEnMemoria === null) {
    estudiantesEnMemoria = await consultarJson("estudiantes.json");
  } else {
    await simularRed();
  }
  return estudiantesEnMemoria.map(copiar);
}

/*
 * Equivale a POST /api/estudiantes
 * El "servidor" asigna el id, igual que lo haría una base de datos con una
 * columna autoincremental. Devuelve el estudiante creado.
 */
export async function crearEstudiante(datos) {
  const coleccion = await obtenerColeccionEnMemoria();
  await simularRed();

  const nuevoId = coleccion.reduce((mayor, estudiante) => Math.max(mayor, estudiante.id), 0) + 1;
  const nuevoEstudiante = { id: nuevoId, ...datos };

  estudiantesEnMemoria = [...coleccion, nuevoEstudiante];
  return copiar(nuevoEstudiante);
}

// Equivale a PUT /api/estudiantes/{id}. Devuelve el estudiante actualizado.
export async function actualizarEstudiante(id, datos) {
  const coleccion = await obtenerColeccionEnMemoria();
  await simularRed();

  const existente = coleccion.find((estudiante) => estudiante.id === id);
  if (!existente) {
    throw new Error(`No existe un estudiante con id ${id}.`);
  }

  const estudianteActualizado = { ...existente, ...datos, id };
  estudiantesEnMemoria = coleccion.map((estudiante) =>
    estudiante.id === id ? estudianteActualizado : estudiante
  );
  return copiar(estudianteActualizado);
}

// Equivale a DELETE /api/estudiantes/{id}
export async function eliminarEstudiante(id) {
  const coleccion = await obtenerColeccionEnMemoria();
  await simularRed();

  if (!coleccion.some((estudiante) => estudiante.id === id)) {
    throw new Error(`No existe un estudiante con id ${id}.`);
  }

  estudiantesEnMemoria = coleccion.filter((estudiante) => estudiante.id !== id);
}
