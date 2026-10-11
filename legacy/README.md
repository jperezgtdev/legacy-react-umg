# Ingreso de estudiantes: versión legacy

Módulo de ingreso de estudiantes construido con **HTML5, CSS3 y JavaScript estándar**, sin bibliotecas ni frameworks. Forma parte de un laboratorio que compara este enfoque con una versión equivalente en React (`../react/`).

> Los datos vienen de archivos JSON locales que **simulan** las respuestas de una API. No hay backend ni base de datos: los cambios se guardan en memoria y se pierden al recargar la página.

---

## 1. ¿Qué es el enfoque de desarrollo tradicional?

En el desarrollo web tradicional (también llamado *vanilla* o *legacy*), la interfaz se construye con las tres tecnologías nativas del navegador y el programador controla cada paso:

1. Escribe en HTML todos los contenedores de la página.
2. Busca esos elementos desde JavaScript (`getElementById`, `querySelector`).
3. Registra eventos (`addEventListener`) para reaccionar a las acciones del usuario.
4. Cuando cambian los datos, **modifica el DOM a mano**: crea elementos, cambia textos, agrega o quita clases.

A este estilo se le llama **imperativo**: el código indica *cómo* actualizar la pantalla, instrucción por instrucción. No hay ningún mecanismo que sincronice automáticamente los datos con lo que se ve.

## 2. Función de HTML

HTML define la **estructura y el significado** del contenido. En `index.html` están, desde el inicio:

- El encabezado, el formulario con sus ocho campos y la tarjeta del listado.
- La tabla con su `<thead>` y un `<tbody id="cuerpo-tabla">` **vacío**, que JavaScript llenará.
- Contenedores vacíos para mensajes (`#mensaje-general`, `#estado-tabla`).
- El cuadro de confirmación, oculto con el atributo `hidden`.

Se usan etiquetas semánticas (`header`, `main`, `section`, `form`, `fieldset`, `label`, `table`, `th scope="col"`) y cada `<label for="...">` se asocia al `id` de su campo.

## 3. Función de CSS

CSS define la **presentación**. Todo está en `css/styles.css`:

- Variables CSS (`--color-primario`, `--radio`, ...) para cambiar colores en un solo lugar.
- Clases reutilizables con la convención `bloque__elemento--modificador` (`.boton`, `.boton--primario`, `.campo__error`).
- Diseño adaptable: dos columnas en pantallas anchas, una columna en pantallas medianas y, en teléfonos, cada fila de la tabla se muestra como una tarjeta.

JavaScript no escribe estilos en línea: solo agrega o quita clases (`classList.toggle`) o el atributo `hidden`.

## 4. Función de JavaScript

JavaScript define el **comportamiento**. El código está dividido en archivos con responsabilidades distintas:

| Archivo | Responsabilidad |
|---|---|
| `js/mensajes.js` | Textos que se muestran al usuario. |
| `js/utilidades.js` | Funciones puras: generar el código, filtrar, limpiar datos, formatear fechas. |
| `js/validaciones.js` | Reglas de validación; devuelven errores sin tocar el DOM. |
| `js/servicios/estudiantesService.js` | Acceso a datos: `fetch`, demora simulada, colección en memoria. |
| `js/estudiantes.js` | Presentación: funciones que leen y modifican el DOM. |
| `js/app.js` | Coordinación: estado, eventos y flujo de cada operación. |

## 5. Cómo se cargan los archivos JSON

`js/servicios/estudiantesService.js` consulta `datos/estudiantes.json` y `datos/carreras.json` con `fetch`:

```js
async function consultarJson(nombreArchivo) {
  await simularRed();
  const respuesta = await fetch(`${CONFIG_API.urlBase}/${nombreArchivo}`);
  if (!respuesta.ok) {
    throw new Error(`No se pudo leer ${nombreArchivo} (HTTP ${respuesta.status}).`);
  }
  return respuesta.json();
}
```

- `simularRed()` espera `CONFIG_API.demoraMs` milisegundos (800 por defecto) para que se vea el estado de carga, y lanza un error si `CONFIG_API.simularError` es `true`.
- La primera consulta guarda los datos en la variable `estudiantesEnMemoria`, que hace el papel de la "base de datos del servidor".
- `app.js` llama a `obtenerCarreras()` y `obtenerEstudiantes()` en paralelo con `Promise.all` y `await`.

**Importante:** un archivo JSON no es una API REST. Es un archivo estático que representa lo que devolvería un servidor. Por eso `fetch` funciona solo para **leer**; no es posible escribir en el archivo.

## 6. Cómo funciona la manipulación del DOM

Todas las operaciones sobre la página están en `js/estudiantes.js`. Ejemplos:

- **Selección:** el objeto `dom` guarda, una sola vez, las referencias obtenidas con `document.getElementById(...)`.
- **Creación de filas:** `crearFilaEstudiante()` usa `document.createElement("tr")`, asigna `textContent` a cada celda y las agrega con `appendChild`.
- **Actualización de la tabla:** `renderizarTabla()` vacía el `<tbody>` y lo vuelve a llenar. Las filas se agregan primero a un `DocumentFragment` para que el navegador actualice la pantalla una sola vez.
- **Seguridad:** se usa `textContent` (no `innerHTML`) para que un texto como `<b>` se muestre literalmente y no se interprete como HTML.
- **Formulario:** `leerFormulario()` lee `formulario.elements[campo].value`; `cargarFormulario()` y `limpiarFormulario()` escriben esos valores.

## 7. Cómo se gestionan los eventos

Los eventos se registran **una sola vez** en `registrarEventos()` (`js/app.js`):

```js
dom.formulario.addEventListener("submit", manejarEnvioFormulario);
dom.formulario.addEventListener("input", manejarCambioCampo);
dom.botonCancelar.addEventListener("click", manejarCancelar);
dom.buscador.addEventListener("input", manejarBusqueda);
dom.cuerpoTabla.addEventListener("click", manejarClicTabla);
```

Los botones Editar y Eliminar de cada fila **no** tienen su propio evento. Se usa **delegación de eventos**: un único manejador en el `<tbody>` identifica el botón pulsado con `evento.target.closest("button[data-accion]")` y lee `data-accion` y `data-id`. Así no hace falta volver a registrar eventos cada vez que la tabla se reconstruye.

## 8. Cómo se implementan las operaciones CRUD

El estado vive en el objeto `estado` de `js/app.js` (`estudiantes`, `carreras`, `textoBusqueda`, `idEnEdicion`, `idPorEliminar`, `cargando`, `guardando`). Modificarlo **no** cambia la pantalla; después de cada cambio se llama a la función de presentación correspondiente.

| Operación | Función en `app.js` | Servicio | Actualización manual de la interfaz |
|---|---|---|---|
| Consultar | `cargarDatosIniciales()` | `obtenerCarreras()`, `obtenerEstudiantes()` | `llenarSelectCarreras`, `limpiarFormulario`, `actualizarTabla` |
| Registrar | `manejarEnvioFormulario()` | `crearEstudiante(datos)` | `limpiarFormulario`, `actualizarTabla`, `mostrarMensaje` |
| Editar | `iniciarEdicion(id)` y luego `manejarEnvioFormulario()` | `actualizarEstudiante(id, datos)` | `cargarFormulario`, `establecerModoFormulario`, `actualizarTabla` |
| Eliminar | `solicitarEliminacion(id)` y luego `confirmarEliminacion()` | `eliminarEstudiante(id)` | `mostrarConfirmacion`, `ocultarConfirmacion`, `actualizarTabla` |
| Buscar | `manejarBusqueda()` | (ninguno, filtra en memoria) | `actualizarTabla` |

Flujo de un registro:

1. `manejarEnvioFormulario` evita el envío nativo con `preventDefault()`.
2. `leerFormulario()` obtiene los valores y `limpiarDatosEstudiante()` los normaliza.
3. `validarEstudiante()` devuelve los errores y `mostrarErroresValidacion()` los muestra. Si hay errores, se detiene.
4. `crearEstudiante()` devuelve el estudiante con su nuevo `id` y se agrega a `estado.estudiantes`.
5. Se llama a `limpiarFormulario`, `actualizarTabla` y `mostrarMensaje`.

**Regla del código del estudiante:** `generarCodigo()` (`js/utilidades.js`) toma el mayor número que aparece después de `EST-`, le suma 1 y lo completa a cuatro dígitos (`EST-0013`). El código se propone automáticamente, puede modificarse y se valida que no se repita.

**Validaciones** (`js/validaciones.js`): código obligatorio y único (sin distinguir mayúsculas), nombres, apellidos y correo obligatorios, formato del correo, carrera existente en el catálogo, fecha real en formato AAAA-MM-DD entre el 01/01/2000 y el 31/12 del próximo año, y estado `ACTIVO` o `INACTIVO`. El teléfono es opcional.

## 9. Organización del código

```
legacy/
├── index.html                     Estructura de la interfaz
├── css/styles.css                 Estilos (idénticos a la versión React)
├── js/
│   ├── mensajes.js                Textos para el usuario
│   ├── utilidades.js              Funciones puras de apoyo
│   ├── validaciones.js            Reglas de validación
│   ├── servicios/
│   │   └── estudiantesService.js  Acceso a datos simulado
│   ├── estudiantes.js             Presentación (manipulación del DOM)
│   └── app.js                     Estado, eventos y coordinación
├── datos/
│   ├── estudiantes.json           12 estudiantes ficticios
│   └── carreras.json              6 carreras ficticias
├── texto.txt                      Archivo que ya existía en el directorio; se conserva sin cambios
└── README.md
```

Los scripts no usan módulos (`import`/`export`), así que comparten el **ámbito global**. Por eso el orden de las etiquetas `<script>` en `index.html` es obligatorio: cada archivo solo puede usar lo que declararon los anteriores. El atributo `defer` hace que se ejecuten en ese orden y cuando el HTML ya está disponible.

## 10. Limitaciones observadas en esta práctica

- **Sincronización manual:** cada cambio de estado obliga a recordar qué partes de la pantalla dependen de él. Por ejemplo, al iniciar una edición hay que cargar el formulario, cambiar el título, cambiar el texto de dos botones, limpiar los errores y volver a dibujar la tabla para resaltar la fila (`iniciarEdicion` y `establecerModoFormulario`). Olvidar una llamada deja la interfaz inconsistente sin que se produzca ningún error.
- **Reconstrucción completa de la tabla:** `renderizarTabla()` borra y vuelve a crear todas las filas en cada cambio. Es sencillo y correcto con 12 registros, pero con cientos de filas se pierde trabajo y también el foco o la selección del usuario.
- **Estado repartido:** parte del estado está en el objeto `estado` y otra parte en el propio DOM (los valores del formulario, el atributo `hidden` del cuadro de diálogo, los botones deshabilitados).
- **Ámbito global:** todas las funciones y constantes comparten un mismo espacio de nombres; dos archivos que declaren el mismo nombre entran en conflicto.
- **HTML y JavaScript acoplados por `id`:** si se cambia un `id` en `index.html`, hay que buscar y corregir su uso en `estudiantes.js`.
- **Persistencia:** los cambios viven en memoria (variable `estudiantesEnMemoria`) y se pierden al recargar. En una aplicación real, el servicio enviaría solicitudes `POST`, `PUT` y `DELETE` a un backend que guardaría los datos en una base de datos.

Ventajas observadas: no requiere instalación ni compilación, el navegador ejecuta exactamente el código escrito y cada actualización de la pantalla es visible y depurable paso a paso.

## 11. Cómo ejecutar el proyecto

Requisito: un navegador moderno y un **servidor web local**. Abrir `index.html` con doble clic (dirección `file://`) **no funciona**, porque los navegadores bloquean `fetch` sobre archivos locales; en ese caso se verá el mensaje "No fue posible consultar los datos de estudiantes".

**Opción A: Node.js (desde una instalación limpia)**

1. Instalar Node.js 18 o superior desde <https://nodejs.org>.
2. Abrir una terminal en la carpeta raíz del repositorio y ejecutar:

   ```bash
   npx http-server legacy -p 5500 -c-1
   ```

   (`-c-1` desactiva la caché para ver los cambios al recargar). La primera vez, `npx` pedirá confirmación para descargar `http-server`.
3. Abrir <http://localhost:5500>.

**Opción B: Visual Studio Code**

1. Instalar la extensión **Live Server**.
2. Abrir `legacy/index.html` y elegir **Open with Live Server**.

**Opción C: Python** (si está instalado)

```bash
cd legacy
python -m http.server 5500
```

### Parámetros de simulación

Se pueden agregar a la URL sin modificar el código:

| URL | Efecto |
|---|---|
| `http://localhost:5500/?demora=2000` | Cada solicitud tarda 2 segundos. |
| `http://localhost:5500/?demora=0` | Sin demora. |
| `http://localhost:5500/?error=1` | Todas las solicitudes fallan (estado de error). |

También pueden cambiarse los valores por defecto en `CONFIG_API`, al inicio de `js/servicios/estudiantesService.js`.

## 12. Cómo probar cada funcionalidad

| # | Funcionalidad | Pasos | Resultado esperado |
|---|---|---|---|
| 1 | Carga | Abrir `?demora=2000`. | "Cargando estudiantes..." con indicador y formulario bloqueado; luego 12 filas y "Mostrando 12 de 12 estudiantes". |
| 2 | Código sugerido | Observar el campo Código. | `EST-0013` y la fecha de hoy. |
| 3 | Campos obligatorios | Pulsar **Registrar estudiante** sin llenar nada. | Errores en Nombres, Apellidos, Correo y Carrera; mensaje "Revise los campos marcados..."; el foco va a Nombres. |
| 4 | Correo inválido | Escribir `ana@`. | "Ingrese un correo electrónico válido...". |
| 5 | Código duplicado | Cambiar el código a `EST-0001`. | "Ya existe un estudiante con este código." |
| 6 | Fecha | Borrar la fecha o usar `1999-12-31`. | Mensaje de fecha obligatoria o fuera de rango. |
| 7 | Registro | Completar datos válidos y guardar. | Nueva fila al final, mensaje de éxito que se oculta a los 4 s y código siguiente `EST-0014`. |
| 8 | Búsqueda | Escribir `lucia`, `MENDEZ`, `est-001` o `rojas@`. | Se filtran filas sin distinguir mayúsculas ni tildes; con `zzz` aparece "No se encontraron estudiantes...". |
| 9 | Edición | Pulsar **Editar** en `EST-0002`, cambiar el nombre y pulsar **Actualizar estudiante**. | La fila se resalta durante la edición; luego se actualiza y aparece "Estudiante actualizado correctamente". |
| 10 | Cancelar edición | Pulsar **Editar** y luego **Cancelar edición**. | El formulario vuelve a "Registrar estudiante". |
| 11 | Eliminación | Pulsar **Eliminar**, probar **Cancelar** y la tecla Escape; luego confirmar. | Solo se elimina tras confirmar; aparece "Estudiante eliminado correctamente". |
| 12 | Lista vacía | Eliminar todos los estudiantes. | "No hay estudiantes registrados." |
| 13 | Error de consulta | Abrir `?error=1`. | "No fue posible consultar los datos..." con botón **Reintentar**. |
| 14 | Persistencia | Registrar un estudiante y recargar (F5). | El registro desaparece: los datos vuelven a leerse del JSON. |

Para ver el trabajo interno, abra las herramientas de desarrollo (F12): en **Red** se observan las solicitudes a los JSON, y en **Elementos** se ve cómo cambia el `<tbody>` en cada operación.
