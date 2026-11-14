# INVEH - Plataforma de Identificación y Control Vehicular Institucional

## 1. Descripción General
INVEH es una aplicación web desarrollada para gestionar y supervisar el acceso vehicular dentro de las instalaciones de la Universidad Laica Eloy Alfaro de Manabí (ULEAM). El sistema permite registrar vehículos de la comunidad universitaria, tramitar solicitudes de acceso para visitantes externos, auditar autorizaciones y registrar entradas y salidas en tiempo real desde garitas de control.

---

## 2. Propósito del Sistema
El propósito principal de la plataforma es digitalizar y asegurar el control vehicular universitario, garantizando que el ingreso a los campus esté reservado exclusivamente a vehículos autorizados o visitas programadas debidamente auditadas.

---

## 3. Módulos y Roles de Usuario

El sistema cuenta con control de acceso basado en roles (RBAC) y tres perfiles diferenciados:

1. **Usuario Institucional (Estudiantes y Docentes):**
   - Consulta el estado de sus vehículos registrados y su presencia en el campus.
   - Solicita la vinculación de vehículos propios (máximo 2 por usuario).
   - Registra solicitudes de acceso vehicular para visitantes externos.
   - Visualiza la ficha vehicular institucional con código QR.
   - Recibe notificaciones automáticas sobre la aprobación o rechazo de sus solicitudes.

2. **Personal Administrativo:**
   - Supervisa métricas generales del campus en tiempo real.
   - Audita, aprueba o rechaza solicitudes de vehículos propios y visitas externas.
   - Consulta y filtra el padrón vehicular por criterios de búsqueda textual, rol o tipo de vehículo.
   - Modifica especificaciones técnicas de los vehículos registrados.
   - Consulta el historial consolidado de movimientos vehiculares.

3. **Personal de Operación (Garitas y Puntos de Control):**
   - Verifica la vigencia de placas e identificadores vehiculares al momento del ingreso.
   - Registra movimientos de entrada y salida con actualización reactiva.
   - Emite autorizaciones temporales inmediatas para visitas imprevistas.
   - Consulta el historial de actividades exclusivo del punto de control asignado.

---

## 4. Tecnologías y Arquitectura

El sistema fue desarrollado bajo la arquitectura Single Page Application (SPA):

* **Framework frontend:** Vue 3 (Composition API utilizando la sintaxis `<script setup>`).
* **Herramienta de compilación:** Vite.
* **Gestión de estado global:** Pinia.
* **Enrutamiento y seguridad:** Vue Router 4 con guardas de navegación (`beforeEach`).
* **Almacenamiento y persistencia:** Almacenamiento del lado del cliente (`localStorage`) y serialización en formato semiestructurado JSON.
* **Validaciones del lado del cliente:**
  - Validación de cédula de identidad ecuatoriana mediante algoritmo Módulo 10.
  - Validación de placas vehiculares oficiales según normativas de la Agencia Nacional de Tránsito (ANT).
  - Control de rangos temporales para visitas y años de fabricación.

---

## 5. Instrucciones de Instalación y Ejecución

Para ejecutar el proyecto localmente, se requiere contar con Node.js (versión 18 o superior) y npm instalados:

1. **Instalar dependencias del proyecto:**
   ```bash
   npm install
   ```

2. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   La aplicación quedará accesible en el navegador en la dirección `http://localhost:5173/`.

3. **Compilar para producción:**
   ```bash
   npm run build
   ```
   Los archivos estáticos optimizados para despliegue se generarán en el directorio `dist/`.

---

## 6. Credenciales de Prueba

Para realizar evaluaciones en cada módulo, se encuentran preconfigurados los siguientes usuarios:

| Rol del Sistema | Identificador / Correo | Contraseña | Vista Asignada |
| :--- | :--- | :--- | :--- |
| **Estudiante** | `1316719804` | `1316719804` | `/usuario` |
| **Administración** | `administracion` | `admin123` | `/administracion` |
| **Punto de Control (Garita 01)** | `puntocontrol01` | `punto01` | `/punto-control` |
| **Punto de Control (Garita 02)** | `puntocontrol02` | `punto02` | `/punto-control` |

---

## 7. Respaldo y Persistencia de Información

El sistema incorpora en la pantalla de inicio de sesión opciones para:
* **Obtener información:** Exporta la totalidad de la base de datos a un archivo descargable `inveh_base_datos.json`.
* **Importar información:** Permite restaurar un archivo JSON previamente guardado, o restablecer el sistema a su estado inicial limpio al cargar un archivo en blanco.
