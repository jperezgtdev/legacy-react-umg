/*
 * EstudianteForm.jsx
 *
 * Responsabilidad: capturar los datos de un estudiante, validarlos y mostrar
 * los mensajes de error de cada campo. No guarda nada por sí mismo: cuando
 * los datos son válidos, los entrega al padre (App.jsx) mediante onGuardar.
 *
 * Equivale a leerFormulario(), cargarFormulario(), limpiarFormulario(),
 * mostrarErroresValidacion() y manejarEnvioFormulario() de la versión legacy.
 *
 * Estado propio del componente:
 *   - datos: valor actual de cada campo (componentes controlados).
 *   - errores: mensajes de validación por campo.
 *
 * Props:
 *   - estudianteEnEdicion: estudiante que se edita, o null para registrar.
 *   - estudiantes, carreras: necesarios para validar y para sugerir el código.
 *   - datosDisponibles: false mientras no ha terminado la carga inicial; en
 *     ese caso el formulario empieza vacío, igual que en la versión legacy.
 *   - deshabilitado: bloquea el formulario mientras se carga o se guarda.
 *   - guardando: cambia el texto del botón principal.
 *   - onGuardar(datos): función del padre que registra o actualiza.
 *   - onCancelar(): función del padre que cancela la edición o limpia.
 *   - onErrorValidacion(): avisa al padre para mostrar el mensaje general.
 *
 * Cómo se "limpia" el formulario: App.jsx le asigna una prop especial key.
 * Cuando key cambia, React descarta este componente y crea uno nuevo, cuyo
 * estado vuelve a calcularse desde cero con crearDatosIniciales(). Es la
 * alternativa declarativa a limpiarFormulario() de legacy, que restablece
 * cada campo uno por uno.
 */
import { useState } from "react";
import { generarCodigo, limpiarDatosEstudiante, obtenerFechaActual } from "../utils/utilidades.js";
import { tieneErrores, validarEstudiante } from "../utils/validaciones.js";

const FORMULARIO_VACIO = {
  codigo: "",
  nombres: "",
  apellidos: "",
  correo: "",
  telefono: "",
  carreraId: "",
  fechaIngreso: "",
  estado: "ACTIVO",
};

// Calcula los valores con que empieza el formulario: los del estudiante en edición o valores para un registro nuevo.
function crearDatosIniciales(estudianteEnEdicion, estudiantes, datosDisponibles) {
  if (!datosDisponibles) {
    return FORMULARIO_VACIO;
  }
  if (estudianteEnEdicion) {
    return {
      codigo: estudianteEnEdicion.codigo,
      nombres: estudianteEnEdicion.nombres,
      apellidos: estudianteEnEdicion.apellidos,
      correo: estudianteEnEdicion.correo,
      telefono: estudianteEnEdicion.telefono ?? "",
      // Los <select> trabajan con texto; el id numérico se convierte a texto para que coincida con la opción.
      carreraId: String(estudianteEnEdicion.carreraId),
      fechaIngreso: estudianteEnEdicion.fechaIngreso,
      estado: estudianteEnEdicion.estado,
    };
  }
  return {
    ...FORMULARIO_VACIO,
    codigo: generarCodigo(estudiantes),
    fechaIngreso: obtenerFechaActual(),
  };
}

export default function EstudianteForm({
  estudianteEnEdicion,
  estudiantes,
  carreras,
  datosDisponibles,
  deshabilitado,
  guardando,
  onGuardar,
  onCancelar,
  onErrorValidacion,
}) {
  /*
   * Inicialización diferida: al pasar una función a useState, React la
   * ejecuta solo en el primer renderizado. Así no se recalcula el código
   * sugerido cada vez que el usuario escribe una letra.
   */
  const [datos, setDatos] = useState(() => crearDatosIniciales(estudianteEnEdicion, estudiantes, datosDisponibles));
  const [errores, setErrores] = useState({});

  const estaEditando = estudianteEnEdicion !== null;

  /*
   * Un solo manejador para todos los campos: el atributo name de cada campo
   * indica qué propiedad de "datos" se modifica. Se crea un objeto nuevo
   * con el operador de propagación (...) en lugar de modificar el existente,
   * para que React detecte el cambio.
   */
  function manejarCambio(evento) {
    const { name, value } = evento.target;
    setDatos((anteriores) => ({ ...anteriores, [name]: value }));

    // Al escribir en un campo se borra su mensaje de error, igual que en la versión legacy.
    if (errores[name]) {
      setErrores((anteriores) => {
        const siguientes = { ...anteriores };
        delete siguientes[name];
        return siguientes;
      });
    }
  }

  async function manejarEnvio(evento) {
    // Sin preventDefault, el navegador enviaría el formulario y recargaría la página.
    evento.preventDefault();

    // Mismo proceso que en legacy: limpiar, validar y, solo si no hay errores, guardar.
    const datosLimpios = limpiarDatosEstudiante(datos);
    const erroresEncontrados = validarEstudiante(
      datosLimpios,
      estudiantes,
      carreras,
      estaEditando ? estudianteEnEdicion.id : null
    );
    setErrores(erroresEncontrados);

    if (tieneErrores(erroresEncontrados)) {
      onErrorValidacion();
      // Se enfoca el primer campo con error para que el usuario sepa dónde corregir.
      const primerCampo = Object.keys(datos).find((campo) => erroresEncontrados[campo]);
      evento.currentTarget.elements[primerCampo]?.focus();
      return;
    }

    await onGuardar(datosLimpios);
  }

  /*
   * Devuelve los atributos comunes de un campo: nombre, valor, manejador y
   * atributos de accesibilidad. Evita repetir las mismas cinco props en los
   * ocho campos del formulario.
   */
  function propsCampo(nombre) {
    return {
      id: nombre,
      name: nombre,
      value: datos[nombre],
      onChange: manejarCambio,
      "aria-invalid": errores[nombre] ? "true" : "false",
      "aria-describedby": `error-${nombre}`,
      className: errores[nombre] ? "campo__control--error" : undefined,
    };
  }

  // Muestra el error de un campo. El <span> siempre existe para que aria-describedby apunte a un elemento válido.
  function errorCampo(nombre) {
    return (
      <span id={`error-${nombre}`} className="campo__error">
        {errores[nombre] ?? ""}
      </span>
    );
  }

  return (
    <>
      {/* El título y los textos de los botones se derivan de estaEditando; no hay que cambiarlos a mano. */}
      <h2 id="titulo-formulario" className="tarjeta__titulo">
        {estaEditando ? "Editar estudiante" : "Registrar estudiante"}
      </h2>

      {/* noValidate (en JSX se escribe en camelCase) desactiva los mensajes nativos del navegador. */}
      <form className="formulario" noValidate onSubmit={manejarEnvio}>
        <fieldset className="formulario__campos" disabled={deshabilitado}>
          <legend className="solo-lectores">Datos del estudiante</legend>

          <div className="campo">
            <label htmlFor="codigo">
              Código <span className="obligatorio">*</span>
            </label>
            <input
              type="text"
              maxLength={20}
              autoComplete="off"
              {...propsCampo("codigo")}
              aria-describedby="error-codigo ayuda-codigo"
            />
            <small id="ayuda-codigo" className="campo__ayuda">
              Se propone automáticamente; puede modificarse.
            </small>
            {errorCampo("codigo")}
          </div>

          <div className="fila-campos">
            <div className="campo">
              <label htmlFor="nombres">
                Nombres <span className="obligatorio">*</span>
              </label>
              {/* autoFocus enfoca el campo cuando el formulario aparece en modo edición. */}
              <input type="text" maxLength={60} autoFocus={estaEditando} {...propsCampo("nombres")} />
              {errorCampo("nombres")}
            </div>

            <div className="campo">
              <label htmlFor="apellidos">
                Apellidos <span className="obligatorio">*</span>
              </label>
              <input type="text" maxLength={60} {...propsCampo("apellidos")} />
              {errorCampo("apellidos")}
            </div>
          </div>

          <div className="campo">
            <label htmlFor="correo">
              Correo electrónico <span className="obligatorio">*</span>
            </label>
            <input type="email" maxLength={100} {...propsCampo("correo")} />
            {errorCampo("correo")}
          </div>

          <div className="campo">
            <label htmlFor="telefono">Teléfono</label>
            <input type="text" maxLength={20} {...propsCampo("telefono")} />
            {errorCampo("telefono")}
          </div>

          <div className="campo">
            <label htmlFor="carreraId">
              Carrera <span className="obligatorio">*</span>
            </label>
            <select {...propsCampo("carreraId")}>
              <option value="">Seleccione una carrera</option>
              {/* Las opciones se generan con map a partir del catálogo; key identifica cada opción. */}
              {carreras.map((carrera) => (
                <option key={carrera.id} value={carrera.id}>
                  {carrera.nombre}
                </option>
              ))}
            </select>
            {errorCampo("carreraId")}
          </div>

          <div className="fila-campos">
            <div className="campo">
              <label htmlFor="fechaIngreso">
                Fecha de ingreso <span className="obligatorio">*</span>
              </label>
              <input type="date" {...propsCampo("fechaIngreso")} />
              {errorCampo("fechaIngreso")}
            </div>

            <div className="campo">
              <label htmlFor="estado">
                Estado <span className="obligatorio">*</span>
              </label>
              <select {...propsCampo("estado")}>
                <option value="ACTIVO">Activo</option>
                <option value="INACTIVO">Inactivo</option>
              </select>
              {errorCampo("estado")}
            </div>
          </div>

          <div className="formulario__acciones">
            <button type="submit" className="boton boton--primario">
              {guardando ? "Guardando..." : estaEditando ? "Actualizar estudiante" : "Registrar estudiante"}
            </button>
            <button type="button" className="boton boton--secundario" onClick={onCancelar}>
              {estaEditando ? "Cancelar edición" : "Limpiar"}
            </button>
          </div>
        </fieldset>
      </form>
    </>
  );
}
