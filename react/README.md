# Ingreso de estudiantes: versión React

Módulo de ingreso de estudiantes construido con **React 19, JSX, hooks básicos y CSS tradicional**, usando Vite como herramienta de desarrollo. Es funcionalmente equivalente a la versión legacy (`../legacy/`): usa los mismos datos, reglas, mensajes y estilos.

> Los datos vienen de archivos JSON locales que **simulan** las respuestas de una API. No hay backend ni base de datos: los cambios se guardan en memoria y se pierden al recargar la página.

No se usan bibliotecas adicionales (ni Redux, ni bibliotecas de formularios o tablas, ni frameworks de componentes visuales). Las únicas dependencias son `react` y `react-dom`, más `vite` y `@vitejs/plugin-react` para el desarrollo.

---

## 1. ¿Qué es React?

React es una **biblioteca de JavaScript para construir interfaces de usuario**. No reemplaza a HTML, CSS ni JavaScript: los usa. Su aporte principal es un modelo distinto para actualizar la pantalla:

- Se describe **cómo debe verse** la interfaz para un estado dado (enfoque **declarativo**).
- Cuando el estado cambia, React calcula qué partes del DOM cambiaron y las actualiza.

En la versión legacy, el programador escribe *cómo* modificar el DOM (`createElement`, `appendChild`, `textContent`). Aquí escribe *qué* debe mostrarse, y React se encarga de las modificaciones.

## 2. Qué problema resuelve el enfoque basado en componentes

Un **componente** es una función que recibe datos (props) y devuelve la descripción de una parte de la interfaz. Cada componente agrupa la estructura, el comportamiento y el estado de esa parte:

| Componente | Responsabilidad |
|---|---|
| `src/App.jsx` | Organiza el módulo y mantiene el estado compartido de la interfaz. |
| `src/components/EstudianteForm.jsx` | Captura los datos, valida y muestra los errores de cada campo. |
| `src/components/EstudianteTable.jsx` | Presenta el listado y los estados de carga, error, vacío y sin resultados. |
| `src/components/EstudianteRow.jsx` | Representa un estudiante como fila de la tabla. |
| `src/components/BuscadorEstudiantes.jsx` | Captura el texto de búsqueda. |
| `src/components/MensajeEstado.jsx` | Presenta mensajes de carga, información, éxito y error. |
| `src/components/ConfirmacionEliminar.jsx` | Pide confirmación antes de eliminar. |

Problemas que se abordan en esta práctica:

- **Sincronización:** la pantalla se deriva del estado; no hay que recordar qué funciones llamar después de cada cambio.
- **Organización:** cada componente tiene una responsabilidad delimitada y declara en sus props qué datos necesita.
- **Reutilización:** `MensajeEstado` se usa para el mensaje general y para los estados de la tabla.
- **Ámbito:** cada archivo es un módulo ES; las dependencias se importan explícitamente con `import`, en lugar de compartir variables globales.

## 3. Qué es JSX

JSX es una sintaxis que permite escribir estructuras parecidas a HTML dentro de JavaScript. Vite (con `@vitejs/plugin-react`) la transforma en llamadas de JavaScript antes de enviarla al navegador.

```jsx
<span className={`insignia insignia--${estudiante.estado.toLowerCase()}`}>
  {estudiante.estado === "ACTIVO" ? "Activo" : "Inactivo"}
</span>
```

Diferencias con HTML que aparecen en el proyecto: `className` en lugar de `class`, `htmlFor` en lugar de `for`, atributos en camelCase (`noValidate`, `maxLength`, `autoComplete`) y expresiones de JavaScript entre llaves `{}`. React escapa automáticamente el texto, igual que `textContent`.

## 4. Cómo funciona `useState`

`useState` crea una variable de estado que React conserva entre renderizados. Devuelve el valor actual y una función para cambiarlo:

```jsx
const [textoBusqueda, setTextoBusqueda] = useState("");
```

Al llamar a `setTextoBusqueda("lucia")`, React vuelve a ejecutar el componente con el nuevo valor y actualiza la pantalla. En el proyecto se usa para:

| Estado | Dónde |
|---|---|
| Colección de estudiantes y carreras, `cargando`, `errorCarga` | `src/hooks/useEstudiantes.js` |
| Texto de búsqueda, estudiante en edición, estudiante por eliminar, `guardando`, mensaje | `src/App.jsx` |
| Datos del formulario y errores de validación | `src/components/EstudianteForm.jsx` |

Regla importante: el estado **no se modifica directamente**. Se crea un valor nuevo (`[...anteriores, nuevo]`, `{ ...anteriores, [name]: value }`) para que React detecte el cambio.

## 5. Cómo funciona `useEffect`

`useEffect` ejecuta código **después** de que el componente se muestra. Se usa para operaciones externas a React, como consultar datos. En `src/hooks/useEstudiantes.js` realiza la carga inicial:

```jsx
useEffect(() => {
  let cancelado = false;
  // ... cargarDatos() consulta el servicio y guarda el resultado con setEstudiantes
  cargarDatos();
  return () => {
    cancelado = true;
  };
}, [intentoCarga]);
```

- **Por qué en un efecto y no en el cuerpo del componente:** el cuerpo se ejecuta en cada renderizado. Si la consulta estuviera ahí, cada `setEstudiantes` causaría otro renderizado, que lanzaría otra consulta, en un ciclo infinito.
- **Arreglo de dependencias:** `[intentoCarga]` hace que el efecto se ejecute al montar el componente y cada vez que se pulsa **Reintentar**.
- **Función de limpieza:** evita guardar una respuesta que ya no es necesaria. En desarrollo, `StrictMode` monta y desmonta los componentes dos veces a propósito, y esta limpieza hace que solo se use la última respuesta.

Otros efectos del proyecto: ocultar el mensaje de éxito tras 4 segundos (`App.jsx`) y registrar la tecla Escape mientras el cuadro de confirmación está abierto (`ConfirmacionEliminar.jsx`).

## 6. Qué son las props

Las props son los **parámetros de un componente**. Los datos bajan del padre a los hijos, y los hijos avisan de los eventos llamando a funciones que también recibieron como props:

```
App (tiene el estado)
 ├── EstudianteForm      ← estudianteEnEdicion, estudiantes, carreras, onGuardar, onCancelar
 ├── BuscadorEstudiantes ← valor, onCambiar
 ├── EstudianteTable     ← estudiantes (filtrados), onEditar, onEliminar
 │    └── EstudianteRow  ← estudiante, nombreCarrera, enEdicion, onEditar, onEliminar
 └── ConfirmacionEliminar← estudiante, procesando, onConfirmar, onCancelar
```

`App.jsx` es responsable del estado compartido. `EstudianteTable`, `EstudianteRow`, `BuscadorEstudiantes`, `MensajeEstado` y `ConfirmacionEliminar` solo **representan** lo que reciben. `EstudianteForm` tiene estado propio (los valores mientras se escribe), pero no guarda nada: entrega los datos validados con `onGuardar`.

## 7. Cómo se renderizan listas

Se usa `map()` para transformar cada elemento de un arreglo en un elemento JSX (`src/components/EstudianteTable.jsx`):

```jsx
estudiantes.map((estudiante) => (
  <EstudianteRow
    key={estudiante.id}
    estudiante={estudiante}
    ...
  />
))
```

`key` debe ser **estable y única**. React la usa para saber qué fila corresponde a cada estudiante al filtrar, agregar o eliminar. Se usa el `id` y no la posición en el arreglo, porque la posición cambia. Las opciones del `<select>` de carreras se generan de la misma forma.

## 8. Cómo se administran los eventos

Los eventos se asignan como props en JSX: `onChange`, `onSubmit`, `onClick`. Reciben una **función**, no el resultado de llamarla:

```jsx
<button onClick={() => onEditar(estudiante)}>Editar</button>
```

- No se usa `addEventListener` para los elementos que dibuja React, ni delegación de eventos: cada fila ya conoce su estudiante.
- Los campos del formulario son **controlados**: su valor sale del estado (`value={datos.nombres}`) y `onChange` lo actualiza.
- `manejarEnvio` llama a `evento.preventDefault()` para evitar que el navegador recargue la página.
- La única excepción es la tecla Escape del cuadro de confirmación: se registra en `document` dentro de un `useEffect`, con su limpieza correspondiente.

## 9. Cómo se separa el acceso a datos de la interfaz

```
Componentes  →  useEstudiantes (estado de React)  →  estudiantesService.js (fetch + memoria)  →  public/datos/*.json
```

- `src/services/estudiantesService.js` es el único archivo que usa `fetch`. Es el mismo servicio de la versión legacy, exportado como módulo.
- `src/hooks/useEstudiantes.js` llama al servicio y guarda los resultados en el estado.
- Los componentes nunca consultan datos directamente.
- Las reglas (`src/utils/validaciones.js`), las utilidades (`src/utils/utilidades.js`) y los mensajes (`src/utils/mensajes.js`) son los mismos de la versión legacy.

**Por qué los JSON están en `public/datos/` y no en `src/data/`:** si se importaran con `import datos from "./estudiantes.json"`, Vite los incluiría dentro del código JavaScript y no habría ninguna solicitud de red. Los archivos de `public/` se publican tal cual y se consultan con `fetch`, igual que una API.

## 10. Cómo se implementan las operaciones CRUD

| Operación | Componente → función en `App.jsx` | Hook (`useEstudiantes`) | Servicio |
|---|---|---|---|
| Consultar | Automático al montar | `useEffect` → `cargarDatos()` | `obtenerCarreras()`, `obtenerEstudiantes()` |
| Registrar | `EstudianteForm` → `manejarGuardar` | `registrarEstudiante(datos)` | `crearEstudiante(datos)` |
| Editar | `EstudianteRow` → `manejarEditar`; `EstudianteForm` → `manejarGuardar` | `modificarEstudiante(id, datos)` | `actualizarEstudiante(id, datos)` |
| Eliminar | `EstudianteRow` → `manejarSolicitarEliminacion`; `ConfirmacionEliminar` → `manejarConfirmarEliminacion` | `borrarEstudiante(id)` | `eliminarEstudiante(id)` |
| Buscar | `BuscadorEstudiantes` → `setTextoBusqueda` | (no aplica) | (no aplica; `filtrarEstudiantes` se calcula en cada renderizado) |

El hook aplica la respuesta del servicio al estado con un arreglo nuevo, por ejemplo:

```jsx
setEstudiantes((anteriores) => [...anteriores, nuevo]);
```

Después de guardar, `App.jsx` cambia `versionFormulario`, que forma parte de la prop `key` de `EstudianteForm`. Cuando `key` cambia, React crea un formulario nuevo con su estado inicial, en lugar de limpiar cada campo a mano.

**Regla del código del estudiante:** `generarCodigo()` toma el mayor número después de `EST-`, le suma 1 y lo completa a cuatro dígitos (`EST-0013`). El código puede modificarse y se valida que no se repita.

**Validaciones:** las mismas de la versión legacy: obligatorios, formato de correo, código único, carrera existente, fecha real entre el 01/01/2000 y el 31/12 del próximo año, y estado válido.

## 11. Limitaciones por no contar con un backend real

- Los archivos JSON son estáticos: **no se pueden modificar** con `fetch`.
- Crear, editar y eliminar se aplican sobre una colección en memoria del servicio y sobre el estado de React. Al **recargar la página**, todo vuelve a los datos de los JSON.
- No hay validación del lado del servidor, ni control de usuarios, ni concurrencia (dos personas no ven los cambios de la otra).
- En una aplicación real, `estudiantesService.js` enviaría `GET`, `POST`, `PUT` y `DELETE` a una API (por ejemplo, Spring Boot con PostgreSQL). Los componentes y el hook no tendrían que cambiar, porque seguirían llamando a las mismas funciones.

Costos propios de este enfoque observados en la práctica: requiere Node.js, instalar dependencias (`node_modules`) y un paso de compilación; además, conceptos como el arreglo de dependencias de `useEffect`, la inmutabilidad del estado o el uso de `key` para reiniciar un componente necesitan explicación previa.

## 12. Instalación y ejecución desde una instalación limpia

1. Instalar **Node.js 18, 20 o 22** desde <https://nodejs.org> (incluye `npm`). Verificar con:

   ```bash
   node -v
   npm -v
   ```

   El proyecto usa Vite 6, compatible con Node 18, 20 y 22 o superior. (Vite 7 requiere Node 20.19+ o 22.12+.)

2. Instalar las dependencias (solo la primera vez):

   ```bash
   cd react
   npm install
   ```

3. Iniciar el servidor de desarrollo:

   ```bash
   npm run dev
   ```

4. Abrir <http://localhost:5173>.

Use `npm run dev` y no `npx vite`: `npm run` usa la versión de Vite instalada en el proyecto, mientras que `npx` podría descargar otra versión incompatible con su Node.

Otros comandos:

| Comando | Uso |
|---|---|
| `npm run build` | Genera la versión optimizada en `dist/`. |
| `npm run preview` | Sirve la carpeta `dist/` para probar la versión compilada. |

### Parámetros de simulación

| URL | Efecto |
|---|---|
| `http://localhost:5173/?demora=2000` | Cada solicitud tarda 2 segundos. |
| `http://localhost:5173/?demora=0` | Sin demora. |
| `http://localhost:5173/?error=1` | Todas las solicitudes fallan (estado de error). |

Los valores por defecto están en `CONFIG_API`, al inicio de `src/services/estudiantesService.js`.

## 13. Cómo probar cada funcionalidad

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

Herramientas útiles: en las herramientas de desarrollo (F12), la pestaña **Red** muestra las solicitudes a `/datos/*.json`. La extensión **React Developer Tools** permite ver el árbol de componentes, sus props y su estado mientras se usa la aplicación. En desarrollo, las solicitudes iniciales aparecen dos veces por efecto de `StrictMode` (ver la sección 5).

## Estructura del proyecto

```
react/
├── package.json                  Dependencias y scripts
├── vite.config.js                Configuración de Vite con el plugin de React
├── index.html                    Solo contiene <div id="root">
├── public/datos/                 JSON consultados con fetch (mismos datos que legacy)
│   ├── estudiantes.json
│   └── carreras.json
└── src/
    ├── main.jsx                  Monta <App /> en #root
    ├── App.jsx                   Componente raíz y estado compartido
    ├── components/               Componentes de la interfaz
    ├── hooks/useEstudiantes.js   Estado de los datos y carga inicial
    ├── services/estudiantesService.js  Acceso a datos simulado
    ├── utils/                    mensajes.js, utilidades.js, validaciones.js
    └── styles/styles.css         Estilos (idénticos a la versión legacy)
```
