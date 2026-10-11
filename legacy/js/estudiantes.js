/*
 * estudiantes.js (capa de presentación)
 *
 * Contiene las funciones que leen y modifican el DOM: construir la tabla,
 * llenar y leer el formulario, mostrar errores, mensajes y el cuadro de
 * confirmación. Estas funciones NO deciden cuándo ejecutarse ni consultan
 * datos; reciben lo que deben mostrar. Quien las coordina es app.js.
 *
 * Observe que cada cambio visible en la pantalla requiere una instrucción
 * explícita: crear un elemento, asignar su texto, agregarlo al documento,
 * quitar una clase, etc. Esa es la esencia del enfoque imperativo.
 */

/*
 * Referencias a los elementos del DOM.
 * Se buscan una sola vez y se guardan en un objeto, porque recorrer el
 * documento con getElementById en cada actualización sería repetitivo.
 * Este script se carga con defer, así que el HTML ya existe cuando se ejecuta.
 */
const dom = {
  mensajeGeneral: document.getElementById("mensaje-general"),
  formulario: document.getElementById("formulario-estudiante"),
  camposFormulario: document.getElementById("campos-formulario"),
  tituloFormulario: document.getElementById("titulo-formulario"),
  botonGuardar: document.getElementById("boton-guardar"),
  botonCancelar: document.getElementById("boton-cancelar"),
  selectCarrera: document.getElementById("carreraId"),
  buscador: document.getElementById("buscador"),
  contador: document.getElementById("contador-estudiantes"),
  cuerpoTabla: document.getElementById("cuerpo-tabla"),
  estadoTabla: document.getElementById("estado-tabla"),
  dialogo: document.getElementById("dialogo-eliminar"),
  dialogoDescripcion: document.getElementById("dialogo-descripcion"),
  dialogoCancelar: document.getElementById("dialogo-cancelar"),
  dialogoConfirmar: document.getElementById("dialogo-confirmar"),
};

// Nombres de los campos del formulario; coinciden con los atributos name e id del HTML.
const CAMPOS_FORMULARIO = [
  "codigo",
  "nombres",
  "apellidos",
  "correo",
  "telefono",
  "carreraId",
  "fechaIngreso",
  "estado",
];

/* ------------------------------------------------------------------------
 * Mensajes
 * ---------------------------------------------------------------------- */

/*
 * Construye el elemento visual de un mensaje. Se reutiliza tanto para la zona
 * de mensajes generales como para los estados de la tabla, de modo que todos
 * los mensajes tengan la misma estructura y clases CSS.
 * tipo: "info" | "cargando" | "exito" | "error"
 */
function crearElementoMensaje(texto, tipo) {
  const contenedor = document.createElement("div");
  contenedor.className = `mensaje mensaje--${tipo}`;
  // role="alert" hace que los errores se anuncien de inmediato a lectores de pantalla.
  contenedor.setAttribute("role", tipo === "error" ? "alert" : "status");

  if (tipo === "cargando") {
    const indicador = document.createElement("span");
    indicador.className = "indicador-carga";
    indicador.setAttribute("aria-hidden", "true");
    contenedor.appendChild(indicador);
  }

  const parrafo = document.createElement("p");
  parrafo.className = "mensaje__texto";
  // textContent inserta el texto tal cual, sin interpretarlo como HTML.
  parrafo.textContent = texto;
  contenedor.appendChild(parrafo);

  return contenedor;
}

let temporizadorMensaje = null;

/*
 * Muestra un mensaje en la zona general. Los mensajes de éxito se ocultan
 * solos; para ello se programa un temporizador. Si llega otro mensaje antes
 * de que termine, se cancela el temporizador anterior con clearTimeout para
 * que no oculte el mensaje nuevo.
 */
function mostrarMensaje(texto, tipo) {
  clearTimeout(temporizadorMensaje);

  // replaceChildren elimina el contenido anterior y coloca el nuevo en un solo paso.
  const elemento = crearElementoMensaje(texto, tipo);
  const botonCerrar = document.createElement("button");
  botonCerrar.type = "button";
  botonCerrar.className = "mensaje__cerrar";
  botonCerrar.setAttribute("aria-label", "Cerrar mensaje");
  botonCerrar.textContent = "×";
  // Este botón se crea en cada mensaje, por lo que su evento se registra aquí.
  botonCerrar.addEventListener("click", ocultarMensaje);
  elemento.appendChild(botonCerrar);
  dom.mensajeGeneral.replaceChildren(elemento);

  if (tipo === "exito") {
    temporizadorMensaje = setTimeout(ocultarMensaje, DURACION_MENSAJE_EXITO_MS);
  }
}

function ocultarMensaje() {
  clearTimeout(temporizadorMensaje);
  dom.mensajeGeneral.replaceChildren();
}

/* ------------------------------------------------------------------------
 * Tabla
 * ---------------------------------------------------------------------- */

// Crea una celda <td> con texto. Evita repetir las mismas tres instrucciones por cada columna.
function crearCelda(texto, etiqueta) {
  const celda = document.createElement("td");
  celda.textContent = texto;
  // data-etiqueta lo usa el CSS para mostrar el nombre de la columna en pantallas pequeñas.
  celda.dataset.etiqueta = etiqueta;
  return celda;
}

/*
 * Construye una fila <tr> completa para un estudiante.
 * Los botones no reciben su propio addEventListener: guardan la acción y el
 * id en atributos data-* y un único manejador registrado en el <tbody>
 * (delegación de eventos, ver app.js) decide qué hacer. Así no es necesario
 * registrar eventos nuevos cada vez que se reconstruye la tabla.
 */
function crearFilaEstudiante(estudiante, carreras, idEnEdicion) {
  const fila = document.createElement("tr");
  if (estudiante.id === idEnEdicion) {
    fila.classList.add("tabla__fila--edicion");
  }

  fila.appendChild(crearCelda(estudiante.codigo, "Código"));
  fila.appendChild(crearCelda(estudiante.nombres, "Nombres"));
  fila.appendChild(crearCelda(estudiante.apellidos, "Apellidos"));
  fila.appendChild(crearCelda(estudiante.correo, "Correo electrónico"));
  fila.appendChild(crearCelda(obtenerNombreCarrera(carreras, estudiante.carreraId), "Carrera"));
  fila.appendChild(crearCelda(formatearFecha(estudiante.fechaIngreso), "Fecha de ingreso"));

  const celdaEstado = crearCelda("", "Estado");
  const insignia = document.createElement("span");
  insignia.className = `insignia insignia--${estudiante.estado.toLowerCase()}`;
  insignia.textContent = estudiante.estado === "ACTIVO" ? "Activo" : "Inactivo";
  celdaEstado.appendChild(insignia);
  fila.appendChild(celdaEstado);

  const celdaAcciones = crearCelda("", "Acciones");
  const contenedorAcciones = document.createElement("div");
  contenedorAcciones.className = "acciones";

  const botonEditar = document.createElement("button");
  botonEditar.type = "button";
  botonEditar.className = "boton boton--pequeno boton--secundario";
  botonEditar.textContent = "Editar";
  botonEditar.dataset.accion = "editar";
  botonEditar.dataset.id = estudiante.id;
  botonEditar.setAttribute("aria-label", `Editar a ${estudiante.nombres} ${estudiante.apellidos}`);

  const botonEliminar = document.createElement("button");
  botonEliminar.type = "button";
  botonEliminar.className = "boton boton--pequeno boton--peligro";
  botonEliminar.textContent = "Eliminar";
  botonEliminar.dataset.accion = "eliminar";
  botonEliminar.dataset.id = estudiante.id;
  botonEliminar.setAttribute("aria-label", `Eliminar a ${estudiante.nombres} ${estudiante.apellidos}`);

  contenedorAcciones.append(botonEditar, botonEliminar);
  celdaAcciones.appendChild(contenedorAcciones);
  fila.appendChild(celdaAcciones);

  return fila;
}

/*
 * Muestra un estado especial en lugar de las filas (cargando, vacío o error).
 * Primero vacía el <tbody> y luego coloca el mensaje en su contenedor.
 * Si se indica una acción (por ejemplo, reintentar), se agrega un botón.
 */
function mostrarEstadoTabla(texto, tipo, accion) {
  dom.cuerpoTabla.replaceChildren();
  const elemento = crearElementoMensaje(texto, tipo);

  if (accion) {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "boton boton--pequeno boton--secundario";
    boton.textContent = accion.texto;
    boton.addEventListener("click", accion.alHacerClic);
    elemento.appendChild(boton);
  }

  dom.estadoTabla.replaceChildren(elemento);
}

/*
 * Dibuja la tabla completa a partir de la colección recibida.
 * JavaScript tradicional no "recuerda" qué filas corresponden a qué datos:
 * cuando la colección cambia, la forma más simple y segura de sincronizar la
 * pantalla es borrar todas las filas y volver a crearlas.
 */
function renderizarTabla(estudiantesVisibles, totalEstudiantes, carreras, idEnEdicion) {
  dom.contador.textContent = `Mostrando ${estudiantesVisibles.length} de ${totalEstudiantes} estudiantes`;

  if (totalEstudiantes === 0) {
    mostrarEstadoTabla(MENSAJES.listaVacia, "info");
    return;
  }
  if (estudiantesVisibles.length === 0) {
    mostrarEstadoTabla(MENSAJES.sinResultados, "info");
    return;
  }

  dom.estadoTabla.replaceChildren();

  /*
   * Las filas se agregan primero a un DocumentFragment (un contenedor que no
   * forma parte de la página) y luego se insertan todas juntas. Así el
   * navegador actualiza la pantalla una sola vez en lugar de una vez por fila.
   */
  const fragmento = document.createDocumentFragment();
  estudiantesVisibles.forEach((estudiante) => {
    fragmento.appendChild(crearFilaEstudiante(estudiante, carreras, idEnEdicion));
  });
  dom.cuerpoTabla.replaceChildren(fragmento);
}

/*
 * Habilita o deshabilita los botones Editar y Eliminar de todas las filas.
 * querySelectorAll devuelve todos los botones existentes en ese momento; hay
 * que recorrerlos uno por uno porque el DOM no ofrece una forma de cambiarlos
 * todos a la vez.
 */
function establecerAccionesTablaHabilitadas(habilitadas) {
  dom.cuerpoTabla.querySelectorAll("button").forEach((boton) => {
    boton.disabled = !habilitadas;
  });
}

function limpiarContador() {
  dom.contador.textContent = "";
}

/* ------------------------------------------------------------------------
 * Formulario
 * ---------------------------------------------------------------------- */

// Crea una <option> por cada carrera. Se ejecuta una vez, después de consultar carreras.json.
function llenarSelectCarreras(carreras) {
  carreras.forEach((carrera) => {
    const opcion = document.createElement("option");
    opcion.value = carrera.id;
    opcion.textContent = carrera.nombre;
    dom.selectCarrera.appendChild(opcion);
  });
}

/*
 * Lee el valor actual de cada campo. Sin un mecanismo que sincronice la
 * pantalla con variables de JavaScript, el formulario es la única fuente de
 * esos datos, por lo que hay que consultarlos cuando se necesitan.
 */
function leerFormulario() {
  const datos = {};
  CAMPOS_FORMULARIO.forEach((campo) => {
    datos[campo] = dom.formulario.elements[campo].value;
  });
  return datos;
}

// Escribe los datos de un estudiante en los campos (se usa al iniciar una edición).
function cargarFormulario(estudiante) {
  CAMPOS_FORMULARIO.forEach((campo) => {
    dom.formulario.elements[campo].value = estudiante[campo] ?? "";
  });
}

// Deja el formulario listo para un nuevo registro, con el código sugerido y la fecha de hoy.
function limpiarFormulario(codigoSugerido) {
  dom.formulario.reset();
  dom.formulario.elements.codigo.value = codigoSugerido;
  dom.formulario.elements.fechaIngreso.value = obtenerFechaActual();
  dom.formulario.elements.estado.value = "ACTIVO";
  limpiarErroresValidacion();
}

/*
 * Cambia los textos del formulario según se esté registrando o editando.
 * Cada elemento que depende del modo debe actualizarse a mano; si se olvida
 * uno, la pantalla queda inconsistente.
 */
function establecerModoFormulario(estaEditando) {
  dom.tituloFormulario.textContent = estaEditando ? "Editar estudiante" : "Registrar estudiante";
  dom.botonGuardar.textContent = estaEditando ? "Actualizar estudiante" : "Registrar estudiante";
  dom.botonCancelar.textContent = estaEditando ? "Cancelar edición" : "Limpiar";
}

/*
 * Bloquea o desbloquea el formulario completo (todos los campos del fieldset).
 */
function establecerFormularioHabilitado(habilitado) {
  dom.camposFormulario.disabled = !habilitado;
}

/*
 * Mientras se guarda se bloquean el formulario y los botones de la tabla, y el
 * botón principal cambia su texto para indicar que la operación está en curso.
 */
function mostrarGuardando(guardando, estaEditando) {
  establecerFormularioHabilitado(!guardando);
  establecerAccionesTablaHabilitadas(!guardando);
  if (guardando) {
    dom.botonGuardar.textContent = "Guardando...";
  } else {
    establecerModoFormulario(estaEditando);
  }
}

// Muestra el mensaje de error debajo de cada campo y lo marca como inválido.
function mostrarErroresValidacion(errores) {
  CAMPOS_FORMULARIO.forEach((campo) => {
    mostrarErrorCampo(campo, errores[campo] ?? "");
  });

  // Se enfoca el primer campo con error para que el usuario sepa dónde corregir.
  const primerCampoConError = CAMPOS_FORMULARIO.find((campo) => errores[campo]);
  if (primerCampoConError) {
    dom.formulario.elements[primerCampoConError].focus();
  }
}

function mostrarErrorCampo(campo, mensaje) {
  const control = dom.formulario.elements[campo];
  const contenedorError = document.getElementById(`error-${campo}`);
  contenedorError.textContent = mensaje;
  // aria-invalid informa a las tecnologías de asistencia; la clase cambia el estilo visual.
  control.setAttribute("aria-invalid", mensaje ? "true" : "false");
  control.classList.toggle("campo__control--error", Boolean(mensaje));
}

function limpiarErroresValidacion() {
  CAMPOS_FORMULARIO.forEach((campo) => mostrarErrorCampo(campo, ""));
}

/* ------------------------------------------------------------------------
 * Cuadro de confirmación
 * ---------------------------------------------------------------------- */

function mostrarConfirmacion(estudiante) {
  dom.dialogoDescripcion.textContent =
    `¿Desea eliminar al estudiante ${estudiante.codigo} - ${estudiante.nombres} ${estudiante.apellidos}? ` +
    "Esta acción no se puede deshacer.";
  dom.dialogoConfirmar.disabled = false;
  dom.dialogoConfirmar.textContent = "Eliminar";
  dom.dialogo.hidden = false;
  // Se enfoca "Cancelar" para que pulsar Enter por accidente no elimine el registro.
  dom.dialogoCancelar.focus();
}

function mostrarEliminando() {
  establecerAccionesTablaHabilitadas(false);
  dom.dialogoConfirmar.disabled = true;
  dom.dialogoCancelar.disabled = true;
  dom.dialogoConfirmar.textContent = "Eliminando...";
}

function ocultarConfirmacion() {
  dom.dialogo.hidden = true;
  dom.dialogoCancelar.disabled = false;
  establecerAccionesTablaHabilitadas(true);
}
