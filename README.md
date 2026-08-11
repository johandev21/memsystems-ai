# Memsystems

Memsystems es una aplicación para organizar notebooks, consultar fuentes y generar materiales de estudio con modelos de inteligencia artificial.

El proyecto está organizado como un monorepo con:

- `frontend/`: interfaz web desarrollada con React, Vite y TanStack Router.
- `backend/`: API desarrollada con NestJS, PostgreSQL y Drizzle ORM.

## Funcionalidades

### Notebooks

Los notebooks son el espacio principal de trabajo. Cada uno puede incluir:

- Título, descripción e icono personalizados.
- Imagen de banner con configuración del punto focal.
- Fuentes de información y materiales de estudio relacionados.
- Búsqueda y listado de notebooks del usuario.

### Fuentes de información

Las fuentes se mantienen asociadas al notebook para que el usuario pueda estudiar y conversar sobre el mismo contexto. La aplicación permite:

- Añadir texto directamente.
- Importar contenido desde una URL.
- Subir archivos para extraer y normalizar su contenido.
- Consultar fuentes mediante búsqueda web.
- Seleccionar resultados de búsqueda e importarlos al notebook.
- Reindexar una fuente individual o todas las fuentes del notebook.
- Consultar el contenido procesado, descargar archivos y eliminar fuentes.

### Chat contextual

Cada notebook cuenta con un chat persistente para interactuar con sus fuentes y materiales. El chat permite:

- Enviar preguntas y recibir respuestas generadas por IA.
- Mantener el historial de mensajes por notebook.
- Recibir respuestas en streaming mientras se generan.
- Mostrar texto y razonamiento cuando el modelo lo proporciona.
- Elegir el modelo utilizado para la conversación.
- Limpiar el historial del chat.

### Materiales de estudio

Los materiales pueden crearse manualmente o generarse a partir del contenido del notebook. Actualmente se admiten:

- Cuestionarios.
- Tarjetas de estudio.
- Rutas de aprendizaje.
- Mapas mentales.

Estos materiales pueden editarse, moverse entre carpetas, visualizarse y filtrarse por tipo. Los cuestionarios también pueden barajarse para variar el orden de las preguntas.

### Organización y papelera

Los materiales se pueden organizar en carpetas dentro de cada notebook. La aplicación incluye una papelera para:

- Recuperar materiales y carpetas eliminados.
- Revisar los elementos enviados a la papelera.
- Eliminar elementos de forma permanente cuando sea necesario.

### Proveedores y modelos de IA

La aplicación integra varios proveedores y permite consultar los modelos disponibles desde la interfaz. Los proveedores configurados actualmente son:

- OpenAI.
- DeepSeek.
- Anthropic.
- Google Gemini.
- Kimi.

Las claves pueden configurarse mediante variables de entorno o, cuando corresponde, desde los ajustes de usuario. La conexión y disponibilidad de los proveedores se comprueban antes de utilizar sus modelos. Algunos modelos también admiten búsqueda web.

### Cuenta y almacenamiento

- Autenticación y sesiones mediante Better Auth.
- Configuración de claves de IA por usuario.
- Almacenamiento local para desarrollo.
- Compatibilidad con almacenamiento S3, R2 o MinIO mediante una interfaz compatible con S3.
- Persistencia de notebooks, fuentes, chats, materiales y configuraciones en PostgreSQL.

## Requisitos

- Node.js
- pnpm `11.17.0` o compatible
- PostgreSQL
- Una clave de proveedor de IA para usar las funciones de generación, salvo que se configure una clave desde la aplicación

## Instalación

Desde la raíz del repositorio:

```bash
pnpm install
```

Copia `.env.example` a `.env.local` y completa los valores necesarios. Como mínimo, configura:

- `DATABASE_URL`: conexión a PostgreSQL.
- `BETTER_AUTH_SECRET`: secreto para la autenticación.
- `BETTER_AUTH_URL`: URL de la aplicación, normalmente `http://localhost:3000`.

Para el desarrollo local se puede usar el almacenamiento en disco incluido en el proyecto. La configuración correspondiente está en `.env.example`.

## Desarrollo

Para iniciar el frontend y el backend en paralelo:

```bash
pnpm run dev
```

Las aplicaciones estarán disponibles en:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4000`
- API: `http://localhost:4000/api`

También puedes iniciar cada paquete por separado:

```bash
pnpm run dev:frontend
pnpm run dev:backend
```

## Base de datos

Memsystems utiliza PostgreSQL con Drizzle ORM. Después de configurar `DATABASE_URL`, aplica el esquema con:

```bash
pnpm exec drizzle-kit push
```

Consulta [docs/database.md](docs/database.md) para conocer el esquema y la configuración de la conexión.

## Docker

La aplicación está dockerizada con Docker Compose. Un solo comando levanta PostgreSQL, el backend (NestJS) y el frontend (servido por nginx, que además hace de proxy inverso para `/api`):

```bash
docker compose up -d --build
```

O desde pnpm:

```bash
pnpm docker:up
```

La aplicación queda disponible en `http://localhost:3000`. Las migraciones de base de datos se aplican automáticamente al arrancar el backend.

### Configuración

Sin ningún `.env`, Compose funciona con valores por defecto válidos para desarrollo local. Para configurar claves de IA, autenticación social y secretos, copia `.env.example` a `.env` en la raíz del repositorio:

```bash
cp .env.example .env
```

Variables específicas de Docker (todas opcionales):

| Variable | Por defecto | Descripción |
|----------|-------------|-------------|
| `APP_PORT` | `3000` | Puerto del frontend en el host. |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | `postgres` / `superuser` / `memsystems` | Credenciales de la base de datos. |
| `CLIENT_URL` / `BETTER_AUTH_URL` | `http://localhost:3000` | URL pública de la aplicación. |
| `BETTER_AUTH_SECRET` | `change-me-in-production` | Secreto de Better Auth. **Cámbialo en cualquier despliegue.** |
| `DEV_STORAGE_PUBLIC_URL` | `http://localhost:3000` | Debe apuntar al origen del frontend para que las URLs de descarga pasen por nginx. |

Para usar almacenamiento S3/MinIO en vez del disco local, descomenta el servicio `minio` en `compose.yml` y define las variables `S3_*` en `.env` (ver `.env.example`).

Otros comandos útiles:

```bash
pnpm docker:logs   # seguir los logs
pnpm docker:down   # detener y eliminar contenedores
```

## Comandos principales

Ejecuta estos comandos desde la raíz:

```bash
pnpm run build       # compilar frontend y backend
pnpm run lint        # revisar el código
pnpm run typecheck   # comprobar los tipos de TypeScript
pnpm run test        # ejecutar las pruebas del backend
pnpm run format      # formatear el código configurado
```

El backend también permite ejecutar las pruebas en modo observación:

```bash
pnpm --filter backend run test:watch
```

Las pruebas utilizan una base de datos PostgreSQL independiente. Revisa [docs/testing.md](docs/testing.md) antes de ejecutarlas.

## Estructura del proyecto

```text
frontend/   Aplicación web y componentes de interfaz
backend/    API, autenticación, fuentes, IA y persistencia
docs/       Documentación técnica del proyecto
```

La arquitectura detallada está disponible en [docs/architecture.md](docs/architecture.md).

## Documentación

- [Arquitectura](docs/architecture.md)
- [Base de datos](docs/database.md)
- [Pruebas](docs/testing.md)
- [Convenciones de Feature-Sliced Design](docs/fsd-conventions.md)

## Estado del proyecto

El proyecto se encuentra en desarrollo. Algunas funciones y configuraciones pueden cambiar mientras evoluciona la aplicación.
