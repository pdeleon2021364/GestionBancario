# GestionBancario

Sistema bancario full stack compuesto por un frontend administrativo en React, un servicio de autenticacion en .NET y una API de gestion bancaria en Node.js. La aplicacion permite iniciar sesion, registrar usuarios, verificar correo, gestionar roles/sesiones y navegar a modulos bancarios como usuarios, cuentas, transacciones, productos financieros y divisas.

## Estructura del Proyecto

```text
GestionBancario/
|-- BancoFront/                    # Frontend React + Vite
|-- authentication-service/
|   |-- auth-service/              # Servicio principal de autenticacion .NET 8
|   `-- auth-node/                 # Version alternativa/compatibilidad en Node.js
|-- GestionBancarioManagment/      # API de gestion bancaria Node.js + Express
|-- Endpoints/                     # Coleccion Postman
`-- README.md
```

## Tecnologias Principales

- Frontend: React 19, Vite, Zustand, Axios, Tailwind CSS.
- Auth service: .NET 8, ASP.NET Core, Entity Framework Core, JWT, Argon2, PostgreSQL, Swagger.
- Management API: Node.js, Express, Sequelize, Mongoose, PostgreSQL, MongoDB, JWT, Swagger.
- Base de datos: PostgreSQL para auth y gestion; MongoDB para parte de gestion bancaria.

## Puertos Usados

| Servicio | URL |
| --- | --- |
| Frontend | `http://localhost:5173` |
| Auth .NET | `http://localhost:5156` |
| Auth Swagger | `http://localhost:5156/swagger` |
| Auth Health | `http://localhost:5156/health` |
| Management API | `http://localhost:3006/gestionbanco/v1` |
| Management Health | `http://localhost:3006/gestionbanco/v1/Health` |

## Requisitos

Instala antes de correr el proyecto:

- Node.js 20 o superior recomendado.
- npm o pnpm.
- .NET SDK 8.0.
- PostgreSQL.
- MongoDB.
- Docker Desktop, opcional pero recomendado para levantar PostgreSQL.

Verifica versiones:

```powershell
node --version
npm --version
dotnet --info
docker --version
```

## Variables de Entorno

### Frontend

Archivo: `BancoFront/.env`

```env
VITE_AUTH_URL=http://localhost:5156/api/v1
VITE_ADMIN_URL=http://localhost:3006/gestionbanco/v1
```

### API de Gestion Bancaria

Archivo: `GestionBancarioManagment/.env`

Variables requeridas:

```env
NODE_ENV=development
PORT=3006

URI_MONGO=mongodb://localhost:27017/gestionbanco

DB_NAME=gestionbanco
DB_USER=tu_usuario
DB_PASS=tu_password
DB_HOST=localhost
DB_PORT=5436

EMAIL_USER=tu_correo
EMAIL_PASS=tu_app_password

JWT_SECRET=misma_clave_del_auth
JWT_ISSUER=AuthService
JWT_AUDIENCE=AuthService

CLOUDINARY_CLOUD_NAME=tu_cloud
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
CLOUDINARY_FOLDER=auth_service/profiles
```

### Auth Service .NET

Archivo: `authentication-service/auth-service/src/AuthService.Api/appsettings.json`

Configura:

- `ConnectionStrings:DefaultConnection`
- `JwtSettings`
- `CloudinarySettings`
- `SmtpSettings`
- `AppSettings:FrontendUrl`
- `Security:AllowedOrigins`

Importante: no subas credenciales reales de correo, Cloudinary o base de datos a repositorios publicos.

## Como Correr Todo el Proyecto

Abre tres terminales: una para auth, una para gestion bancaria y una para frontend.

### 1. Levantar Base de Datos del Auth Service

El `docker-compose.yml` del auth service levanta PostgreSQL, pero revisa que los datos coincidan con `appsettings.json`. Si usas el compose incluido:

```powershell
cd C:\GestionBancario\authentication-service\auth-service
docker compose up -d
```

Si prefieres usar PostgreSQL local, crea una base de datos y ajusta:

```json
"DefaultConnection": "Host=localhost;Database=auth_service;Username=postgres;Password=tu_password;Port=5433"
```

### 2. Correr Auth Service .NET

```powershell
cd C:\GestionBancario\authentication-service\auth-service
dotnet restore
dotnet build AuthService.sln
dotnet run --project .\src\AuthService.Api\AuthService.Api.csproj
```

Debe quedar disponible en:

```text
http://localhost:5156
http://localhost:5156/swagger
```

Al iniciar, el servicio crea la base si puede conectarse y ejecuta seed de roles y usuario administrador inicial.

### 3. Levantar Base de Datos de Gestion Bancaria

La API de gestion usa PostgreSQL y MongoDB.

Para PostgreSQL con Docker:

```powershell
cd C:\GestionBancario\GestionBancarioManagment
docker compose up -d
```

Para MongoDB, asegurate de tenerlo corriendo localmente:

```text
mongodb://localhost:27017/gestionbanco
```

### 4. Correr API de Gestion Bancaria

```powershell
cd C:\GestionBancario\GestionBancarioManagment
npm install
npm run dev
```

Debe quedar disponible en:

```text
http://localhost:3006/gestionbanco/v1/Health
```

### 5. Correr Frontend

```powershell
cd C:\GestionBancario\BancoFront
npm install
npm run dev
```

Abre:

```text
http://localhost:5173
```

## Credenciales Iniciales

El auth service .NET crea un administrador inicial si la tabla de usuarios esta vacia:

```text
Correo: admin@ksports.local
Usuario: admin
Contrasena: Admin1234!
Rol: ADMIN_ROLE
```

Tambien puedes registrar un usuario desde el frontend. Ese usuario inicia como `USER_ROLE`, debe verificar su correo y luego podra iniciar sesion.

## Flujo Principal de Uso

1. Entra al frontend en `http://localhost:5173`.
2. Inicia sesion con el admin seed o registra un nuevo usuario.
3. Si registras usuario nuevo, revisa el correo de verificacion.
4. Verifica el correo desde el enlace recibido.
5. Vuelve al login e inicia sesion.
6. El sistema redirige al dashboard futurista principal.
7. Desde el dashboard puedes navegar a modulos bancarios.

## Funcionalidades

### Autenticacion

- Registro de usuarios.
- Inicio de sesion por correo o username.
- Verificacion de correo electronico.
- Reenvio de correo de verificacion.
- Recuperacion de contrasena.
- Reset de contrasena mediante token.
- JWT access token.
- Refresh token con rotacion.
- Logout/revocacion de refresh token.
- Roles `ADMIN_ROLE` y `USER_ROLE`.
- Proteccion de rutas en frontend.

### Frontend

- Login conectado al auth service.
- Registro conectado al auth service.
- Verificacion de email.
- Recuperacion de contrasena.
- Persistencia de sesion con Zustand.
- Refresh token automatico desde Axios.
- Dashboard principal futurista.
- Navegacion protegida por sesion.
- Visualizacion de rol real del usuario: `ADMIN` o `USER`.

### API de Gestion Bancaria

Incluye rutas y controladores para:

- Usuarios.
- Roles.
- Cuentas bancarias.
- Transacciones.
- Productos financieros.
- Divisas.
- Tasas de cambio.
- Conversiones.
- Historial/records.
- Favoritos.
- Envio de reportes PDF por correo en algunos modulos.

Base path:

```text
http://localhost:3006/gestionbanco/v1
```

### Auth Service .NET

Base path:

```text
http://localhost:5156/api/v1
```

Endpoints principales:

```text
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
GET  /api/v1/auth/profile
POST /api/v1/auth/verify-email
POST /api/v1/auth/resend-verification
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password
GET  /api/v1/auth/users
```

## Comandos Utiles

### Frontend

```powershell
cd C:\GestionBancario\BancoFront
npm run dev
npm run build
npm run preview
```

Nota: `npm run lint` requiere tener configurado `eslint.config.js`, porque el proyecto usa ESLint 9.

### Auth Service

```powershell
cd C:\GestionBancario\authentication-service\auth-service
dotnet restore
dotnet build AuthService.sln
dotnet run --project .\src\AuthService.Api\AuthService.Api.csproj
```

### Gestion Bancaria

```powershell
cd C:\GestionBancario\GestionBancarioManagment
npm run dev
npm start
```

## Problemas Comunes

### El dashboard se queda cargando

Revisa que el frontend tenga `.env` correcto:

```env
VITE_AUTH_URL=http://localhost:5156/api/v1
VITE_ADMIN_URL=http://localhost:3006/gestionbanco/v1
```

Luego reinicia Vite:

```powershell
npm run dev
```

### No puedo iniciar sesion con usuario registrado

Verifica:

- Que el correo ya fue verificado.
- Que el auth service esta corriendo.
- Que el usuario tiene `USER_ROLE` o `ADMIN_ROLE`.
- Que el frontend esta usando el build mas reciente.

### Error de ruta al correr .NET

Usa la ruta correcta:

```powershell
dotnet run --project .\src\AuthService.Api\AuthService.Api.csproj
```

No uses:

```powershell
dotnet run --project .\src\AuthServiceGestionDeRestaurantes.Api\
```

Esa carpeta no existe en este proyecto.

### El frontend no conecta al backend

Confirma que esten activos:

```text
Auth:       http://localhost:5156/health
Management: http://localhost:3006/gestionbanco/v1/Health
Frontend:   http://localhost:5173
```

### Error de base de datos

Verifica:

- PostgreSQL del auth service.
- PostgreSQL de gestion bancaria.
- MongoDB local.
- Puertos configurados en `.env` y `appsettings.json`.

## Orden Recomendado de Arranque

1. PostgreSQL auth.
2. Auth service .NET.
3. PostgreSQL/MongoDB de gestion.
4. API de gestion bancaria.
5. Frontend.

## Notas de Desarrollo

- El frontend consume auth desde `VITE_AUTH_URL`.
- El frontend consume modulos bancarios desde `VITE_ADMIN_URL`.
- El auth .NET es el servicio principal conectado al frontend.
- `auth-node` queda como implementacion alternativa o referencia de compatibilidad.
- Los usuarios normales (`USER_ROLE`) pueden entrar al dashboard.
- Los administradores (`ADMIN_ROLE`) mantienen acceso para funciones administrativas.
