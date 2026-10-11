/*
 * app.js (coordinación)
 *
 * Punto de entrada de la aplicación. Se encarga de:
 *   1. Mantener el estado de la aplicación en un objeto de JavaScript.
 *   2. Registrar los eventos del usuario.
 *   3. Llamar al servicio de datos y, con sus respuestas, actualizar el
 *      estado y pedir a estudiantes.js que vuelva a dibujar la pantalla.
 *
 * Regla de trabajo de este archivo: cada vez que cambia el estado, hay que
 * llamar EXPLÍCITAMENTE a la función que actualiza la parte de la pantalla
 * afectada. El navegador no sabe que el objeto "estado" existe.
 */

/*
 * Estado de la aplicación gestionado manualmente.
 * Es un objeto común: modificarlo no actualiza la pantalla por sí solo.
 */
const estado = {
  estudiantes: [], // Copia local de la colección devuelta por el servicio.
  carreras: [],
  textoBusqueda: "",
  idEnEdicion: null, // null significa que el formulario está en modo registro.
  idPorEliminar: null, // Estudiante pendiente de confirmación de eliminación.
  cargando: false,
  guardando: false,
};

/*
 * Vuelve a dibujar la tabla aplicando el filtro de búsqueda actual.
 * Se llama después de cualquier cambio en estudiantes, búsqueda o edición.
 */
function actualizarTabla() {
  const visibles = filtrarEstudiantes(estado.estudiantes, estado.textoBusqueda);
  renderizarTabla(visibles, estado.estudiantes.length, estado.carreras, estado.idEnEdicion);
}

/* ------------------------------------------------------------------------
 * Carga inicial (consulta)
 * ---------------------------------------------------------------------- */

/*
 * async/await permite escribir código asíncrono como si fuera secuencial:
 * cada await pausa esta función (sin bloquear el navegador) hasta que la
 * promesa del servicio se resuelve. try/catch captura los errores de red o
 * los errores simulados por el servicio.
 */
async function cargarDatosIniciales() {
  estado.cargando = true;
  establecerFormularioHabilitado(false);
  limpiarContador();
  mostrarEstadoTabla(MENSAJES.cargando, "cargando");

  try {
    // Promise.all lanza ambas consultas a la vez y espera a que las dos terminen.
    const [carreras, estudiantes] = await Promise.all([
      obtenerCarreras(),
      obtenerEstudiantes(),
    ]);

    estado.carreras = carreras;
    estado.estudiantes = estudiantes;

    // Con los datos disponibles, se actualiza cada parte de la pantalla que depende de ellos.
    if (dom.selectCarrera.options.length === 1) {
      llenarSelectCarreras(carreras);
    }
    limpiarFormulario(generarCodigo(estado.estudiantes));
    establecerFormularioHabilitado(true);
    actualizarTabla();
  } catch (error) {
    // El detalle técnico va a la consola; al usuario se le muestra un mensaje comprensible.
    console.error("Error al cargar los datos:", error);
    mostrarEstadoTabla(MENSAJES.errorConsulta, "error", {
      texto: "Reintentar",
      alHacerClic: cargarDatosIniciales,
    });
  } finally {
    estado.cargando = false;
  }
}

/* ------------------------------------------------------------------------
 * Registro y edición
 * ---------------------------------------------------------------------- */

async function manejarEnvioFormulario(evento) {
  // Sin preventDefault, el navegador enviaría el formulario y recargaría la página, perdiendo los datos en memoria.
  evento.preventDefault();
  if (estado.guardando || estado.cargando) {
    return;
  }

  // 1. Leer los valores del DOM y normalizarlos.
  const datos = limpiarDatosEstudiante(leerFormulario());

  // 2. Validar con las reglas compartidas.
  const errores = validarEstudiante(datos, estado.estudiantes, estado.carreras, estado.idEnEdicion);
  mostrarErroresValidacion(errores);
  if (tieneErrores(errores)) {
    mostrarMensaje(MENSAJES.erroresValidacion, "error");
    return;
  }

  // 3. Enviar los datos al servicio y actualizar el estado con su respuesta.
  const estaEditando = estado.idEnEdicion !== null;
  estado.guardando = true;
  mostrarGuardando(true, estaEditando);

  try {
    if (estaEditando) {
      const actualizado = await actualizarEstudiante(estado.idEnEdicion, datos);
      estado.estudiantes = estado.estudiantes.map((estudiante) =>
        estudiante.id === actualizado.id ? actualizado : estudiante
      );
    } else {
      const nuevo = await crearEstudiante(datos);
      estado.estudiantes = [...estado.estudiantes, nuevo];
    }

    // 4. Actualizar manualmente cada parte de la interfaz afectada por el cambio.
    estado.idEnEdicion = null;
    estado.guardando = false;
    mostrarGuardando(false, false);
    limpiarFormulario(generarCodigo(estado.estudiantes));
    actualizarTabla();
    mostrarMensaje(
      estaEditando ? MENSAJES.actualizacionExitosa : MENSAJES.registroExitoso,
      "exito"
    );
  } catch (error) {
    console.error("Error al guardar el estudiante:", error);
    estado.guardando = false;
    mostrarGuardando(false, estaEditando);
    mostrarMensaje(MENSAJES.errorOperacion, "error");
  }
}

function iniciarEdicion(id) {
  const estudiante = estado.estudiantes.find((item) => item.id === id);
  if (!estudiante) {
    return;
  }

  estado.idEnEdicion = id;
  cargarFormulario(estudiante);
  limpiarErroresValidacion();
  establecerModoFormulario(true);
  // La tabla se vuelve a dibujar solo para resaltar la fila que se está editando.
  actualizarTabla();
  ocultarMensaje();
  dom.formulario.elements.nombres.focus();
}

/*
 * El botón secundario tiene dos significados según el modo:
 * en edición cancela la edición; en registro limpia el formulario.
 */
function manejarCancelar() {
  const estabaEditando = estado.idEnEdicion !== null;
  estado.idEnEdicion = null;
  establecerModoFormulario(false);
  limpiarFormulario(generarCodigo(estado.estudiantes));
  if (estabaEditando) {
    actualizarTabla();
  }
}

/*
 * Al escribir en un campo se borra su mensaje de error. Se registra un único
 * evento "input" en el formulario; event.target indica qué campo cambió.
 */
function manejarCambioCampo(evento) {
  const campo = evento.target.name;
  if (CAMPOS_FORMULARIO.includes(campo)) {
    mostrarErrorCampo(campo, "");
  }
}

/* ------------------------------------------------------------------------
 * Eliminación
 * ---------------------------------------------------------------------- */

function solicitarEliminacion(id) {
  const estudiante = estado.estudiantes.find((item) => item.id === id);
  if (!estudiante) {
    return;
  }
  estado.idPorEliminar = id;
  mostrarConfirmacion(estudiante);
}

function cancelarEliminacion() {
  if (estado.guardando) {
    return;
  }
  estado.idPorEliminar = null;
  ocultarConfirmacion();
}

async function confirmarEliminacion() {
  const id = estado.idPorEliminar;
  if (id === null || estado.guardando) {
    return;
  }

  estado.guardando = true;
  mostrarEliminando();

  try {
    await eliminarEstudiante(id);
    estado.estudiantes = estado.estudiantes.filter((estudiante) => estudiante.id !== id);

    // Si se eliminó el estudiante que estaba en edición, el formulario vuelve al modo registro.
    if (estado.idEnEdicion === id) {
      estado.idEnEdicion = null;
      establecerModoFormulario(false);
      limpiarFormulario(generarCodigo(estado.estudiantes));
    }

    actualizarTabla();
    mostrarMensaje(MENSAJES.eliminacionExitosa, "exito");
  } catch (error) {
    console.error("Error al eliminar el estudiante:", error);
    mostrarMensaje(MENSAJES.errorOperacion, "error");
  } finally {
    estado.guardando = false;
    estado.idPorEliminar = null;
    ocultarConfirmacion();
  }
}

/* ------------------------------------------------------------------------
 * Eventos de la tabla y la búsqueda
 * ---------------------------------------------------------------------- */

/*
 * Delegación de eventos: en lugar de registrar un evento por cada botón de
 * cada fila (y volver a registrarlos cada vez que la tabla se reconstruye),
 * se registra un solo evento en el <tbody>. closest() busca el botón sobre el
 * que se hizo clic y sus atributos data-* indican la acción y el estudiante.
 */
function manejarClicTabla(evento) {
  const boton = evento.target.closest("button[data-accion]");
  if (!boton || estado.guardando) {
    return;
  }

  // Los atributos data-* siempre son texto, por eso se convierte el id a número.
  const id = Number(boton.dataset.id);
  if (boton.dataset.accion === "editar") {
    iniciarEdicion(id);
  } else if (boton.dataset.accion === "eliminar") {
    solicitarEliminacion(id);
  }
}

function manejarBusqueda(evento) {
  estado.textoBusqueda = evento.target.value;
  actualizarTabla();
}

function manejarTeclado(evento) {
  if (evento.key === "Escape" && !dom.dialogo.hidden) {
    cancelarEliminacion();
  }
}

/* ------------------------------------------------------------------------
 * Inicialización
 * ---------------------------------------------------------------------- */

/*
 * Los eventos se registran una sola vez, al iniciar. Si se registraran dentro
 * de renderizarTabla o de otra función que se ejecuta muchas veces, cada
 * ejecución agregaría un manejador duplicado y una acción se ejecutaría
 * varias veces.
 */
function registrarEventos() {
  dom.formulario.addEventListener("submit", manejarEnvioFormulario);
  dom.formulario.addEventListener("input", manejarCambioCampo);
  dom.botonCancelar.addEventListener("click", manejarCancelar);
  dom.buscador.addEventListener("input", manejarBusqueda);
  dom.cuerpoTabla.addEventListener("click", manejarClicTabla);
  dom.dialogoCancelar.addEventListener("click", cancelarEliminacion);
  dom.dialogoConfirmar.addEventListener("click", confirmarEliminacion);
  document.addEventListener("keydown", manejarTeclado);
}

registrarEventos();
cargarDatosIniciales();
