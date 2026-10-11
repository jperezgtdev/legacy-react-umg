/*
 * datos-locales.js
 *
 * Copia de estudiantes.json y carreras.json para cuando index.html se abre
 * con doble clic (dirección file://). En ese modo los navegadores bloquean
 * fetch sobre archivos locales por seguridad, pero sí permiten cargar un
 * archivo con <script>. El servicio usa esta copia solo en ese caso; con un
 * servidor web (http://) siempre consulta los archivos JSON con fetch.
 *
 * Si se modifican los archivos JSON, debe actualizarse también esta copia.
 */
const DATOS_LOCALES = {
  "carreras.json": [
    { "id": 1, "nombre": "Ingeniería en Sistemas" },
    { "id": 2, "nombre": "Administración de Empresas" },
    { "id": 3, "nombre": "Contaduría Pública" },
    { "id": 4, "nombre": "Diseño Gráfico" },
    { "id": 5, "nombre": "Ingeniería Industrial" },
    { "id": 6, "nombre": "Psicología" }
  ],
  "estudiantes.json": [
    { "id": 1, "codigo": "EST-0001", "nombres": "Ana María", "apellidos": "López García", "correo": "ana.lopez@example.com", "telefono": "55550001", "carreraId": 1, "fechaIngreso": "2026-01-15", "estado": "ACTIVO" },
    { "id": 2, "codigo": "EST-0002", "nombres": "Carlos Eduardo", "apellidos": "Méndez Ruiz", "correo": "carlos.mendez@example.com", "telefono": "55550002", "carreraId": 2, "fechaIngreso": "2026-01-15", "estado": "ACTIVO" },
    { "id": 3, "codigo": "EST-0003", "nombres": "Lucía", "apellidos": "Fernández Soto", "correo": "lucia.fernandez@example.com", "telefono": "", "carreraId": 3, "fechaIngreso": "2025-07-10", "estado": "INACTIVO" },
    { "id": 4, "codigo": "EST-0004", "nombres": "Jorge Luis", "apellidos": "Ramírez Castillo", "correo": "jorge.ramirez@example.com", "telefono": "55550004", "carreraId": 1, "fechaIngreso": "2025-07-10", "estado": "ACTIVO" },
    { "id": 5, "codigo": "EST-0005", "nombres": "Sofía Alejandra", "apellidos": "Herrera Pinto", "correo": "sofia.herrera@example.com", "telefono": "55550005", "carreraId": 4, "fechaIngreso": "2026-01-15", "estado": "ACTIVO" },
    { "id": 6, "codigo": "EST-0006", "nombres": "Miguel Ángel", "apellidos": "Torres Vega", "correo": "miguel.torres@example.com", "telefono": "", "carreraId": 5, "fechaIngreso": "2024-07-08", "estado": "INACTIVO" },
    { "id": 7, "codigo": "EST-0007", "nombres": "Valeria", "apellidos": "Gómez Ortiz", "correo": "valeria.gomez@example.com", "telefono": "55550007", "carreraId": 6, "fechaIngreso": "2025-01-13", "estado": "ACTIVO" },
    { "id": 8, "codigo": "EST-0008", "nombres": "Diego Andrés", "apellidos": "Morales Cruz", "correo": "diego.morales@example.com", "telefono": "55550008", "carreraId": 2, "fechaIngreso": "2024-01-15", "estado": "ACTIVO" },
    { "id": 9, "codigo": "EST-0009", "nombres": "Camila", "apellidos": "Rojas Navarro", "correo": "camila.rojas@example.com", "telefono": "", "carreraId": 3, "fechaIngreso": "2026-01-15", "estado": "ACTIVO" },
    { "id": 10, "codigo": "EST-0010", "nombres": "Andrés Felipe", "apellidos": "Silva Paredes", "correo": "andres.silva@example.com", "telefono": "55550010", "carreraId": 5, "fechaIngreso": "2025-07-10", "estado": "ACTIVO" },
    { "id": 11, "codigo": "EST-0011", "nombres": "Daniela", "apellidos": "Castro Ibáñez", "correo": "daniela.castro@example.com", "telefono": "55550011", "carreraId": 4, "fechaIngreso": "2023-07-10", "estado": "INACTIVO" },
    { "id": 12, "codigo": "EST-0012", "nombres": "Fernando José", "apellidos": "Aguilar Mejía", "correo": "fernando.aguilar@example.com", "telefono": "55550012", "carreraId": 6, "fechaIngreso": "2026-01-15", "estado": "ACTIVO" }
  ],
};
