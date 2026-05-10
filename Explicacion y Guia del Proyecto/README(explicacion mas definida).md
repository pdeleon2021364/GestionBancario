# GestionBancario

Sistema bancario compuesto por:

- Un frontend React/Vite.
- Un servicio principal de autenticacion en .NET 8.
- Varios microservicios Node.js.
- PostgreSQL para autenticacion.
- PostgreSQL para gestion bancaria.
- MongoDB para varios microservicios Node.

Este README explica como funciona el workspace completo y como levantarlo sin perderse entre carpetas.

## Arquitectura Real Del Proyecto

```text
GestionBancario/
|-- BancoFronted/                         # Frontend React + Vite
|-- authentication-service/
|   |-- auth-service/                     # Servicio de autenticacion real usado por el frontend
|   `-- auth-node/                        # Version Node alternativa/referencia, no se levanta con el dev global
|-- BankAccount-service/                  # Microservicio de cuentas bancarias
|-- Currency-service/                     # Microservicio de monedas/divisas
|-- Exchangerate-service/                 # Microservicio de tasas de cambio
|-- GestionBancarioManagment/             # API principal de gestion bancaria
|-- Notification-service/                 # Microservicio de notificaciones/correos
|-- Transactions-service/                 # Microservicio de transacciones
|-- scripts/
|   |-- install-services.js               # Instala dependencias de microservicios Node
|   `-- run-services.js                   # Ejecuta microservicios Node en paralelo
|-- package.json                          # Comandos globales del workspace
`-- README.md
```

El frontend consume dos backends principales:

```text
Auth .NET:
http://localhost:5156/api/v1

Gestion bancaria:
http://localhost:3006/gestionbanco/v1
```

Los microservicios Node pueden comunicarse entre ellos. Por ejemplo, `Exchangerate-service` usa `Currency-service`, y `Transactions-service` puede llamar a `Notification-service`.

## Lo Mas Importante

Hay tres grupos de ejecucion:

1. **Infraestructura**
   PostgreSQL de auth, PostgreSQL de gestion y MongoDB local.

2. **Backends**
   Auth .NET y microservicios Node.

3. **Frontend**
   React/Vite en `BancoFronted`.

El comando global `pnpm dev` solo levanta microservicios Node. No levanta auth .NET, no levanta el frontend y no levanta bases de datos.

## Comandos Globales

En la raiz existe:

```json
{
  "scripts": {
    "install:services": "node ./scripts/install-services.js",
    "dev": "node ./scripts/run-services.js"
  }
}
```

### `pnpm install:services`

Instala dependencias con `pnpm install` en estas carpetas:

```text
authentication-service/auth-node
BankAccount-service
Currency-service
Exchangerate-service
GestionBancarioManagment
Notification-service
Transactions-service
```

Aunque instala `auth-node`, ese servicio no se usa como auth principal del frontend. El auth principal es el .NET ubicado en:

```text
authentication-service/auth-service
```

### `pnpm dev`

Ejecuta `scripts/run-services.js`.

Ese script corre en paralelo:

```text
BankAccount-service       -> pnpm dev
Currency-service          -> pnpm dev
Exchangerate-service      -> pnpm dev
GestionBancarioManagment  -> pnpm dev
Notification-service      -> pnpm dev
Transactions-service      -> pnpm dev
```

Internamente usa:

```js
spawn('pnpm', ['dev'], {
  cwd: service,
  stdio: 'inherit',
  shell: true
})
```

Eso significa que todos los logs salen mezclados en una misma terminal. Para detenerlos, usa `Ctrl + C`.

## Puertos Del Sistema

| Componente | Puerto | URL |
| --- | ---: | --- |
| Frontend React | 5173 | `http://localhost:5173` |
| Auth .NET API | 5156 | `http://localhost:5156/api/v1` |
| Auth .NET Swagger | 5156 | `http://localhost:5156/swagger` |
| Auth .NET Health | 5156 | `http://localhost:5156/health` |
| Currency-service | 3002 | `http://localhost:3002` |
| Transactions-service | 3003 | `http://localhost:3003` |
| BankAccount-service | 3004 | `http://localhost:3004` |
| Exchangerate-service | 3005 | `http://localhost:3005` |
| GestionBancarioManagment | 3006 | `http://localhost:3006/gestionbanco/v1` |
| Notification-service | 3010 | `http://localhost:3010/notification/v1` |
| PostgreSQL Auth | 5435 | `localhost:5435` |
| PostgreSQL Gestion | 5436 | `localhost:5436` |
| MongoDB local | 27017 | `mongodb://localhost:27017` |

## Requisitos

Instalar antes:

- Node.js 20 o superior.
- pnpm.
- .NET SDK 8.
- Docker Desktop.
- MongoDB local o MongoDB como servicio.

Verificar:

```powershell
node --version
pnpm --version
dotnet --info
docker --version
```

## Bases De Datos

### Base Del Auth .NET

Carpeta:

```text
authentication-service/auth-service
```

Compose:

```text
authentication-service/auth-service/docker-compose.yml
```

Configuracion:

```text
Contenedor: auth-service-in6bm
Imagen:     postgres:16
Base:       KinalSports
Usuario:    root
Password:   admin
Puerto:     5435 -> 5432
```

Connection string en desarrollo:

```text
Host=localhost;Database=KinalSports;Username=root;Password=admin;Port=5435
```

Se configura en:

```text
authentication-service/auth-service/src/AuthService.Api/appsettings.Development.json
```

### Base PostgreSQL De Gestion Bancaria

Carpeta:

```text
GestionBancarioManagment
```

Compose:

```text
GestionBancarioManagment/docker-compose.yml
```

Configuracion:

```text
Contenedor: gestionbanco_postgres
Imagen:     postgres:15
Base:       gestionbanco
Usuario:    admin
Password:   admin123
Puerto:     5436 -> 5432
```

Variables usadas por servicios Node:

```env
DB_NAME=gestionbanco
DB_USER=admin
DB_PASS=admin123
DB_HOST=localhost
DB_PORT=5436
```

### MongoDB

Los microservicios Node usan:

```env
URI_MONGO=mongodb://localhost:27017/gestionbanco
```

MongoDB no esta incluido en los `docker-compose.yml` actuales. Debe estar iniciado aparte.

Puedes validarlo con MongoDB Compass usando:

```text
mongodb://localhost:27017
```

## Variables De Entorno

### Frontend

Archivo:

```text
BancoFronted/.env
```

Debe contener:

```env
VITE_AUTH_URL=http://localhost:5156/api/v1
VITE_ADMIN_URL=http://localhost:3006/gestionbanco/v1
```

Si editas este archivo, reinicia `pnpm dev` del frontend.

### Auth .NET

Archivo:

```text
authentication-service/auth-service/src/AuthService.Api/appsettings.Development.json
```

Valores importantes:

```text
ConnectionStrings:DefaultConnection
SmtpSettings
SendGridSettings
AppSettings:FrontendUrl
AppSettings:BackendUrl
Security:AllowedOrigins
```

El correo de verificacion sale desde `SmtpSettings`. Actualmente se usa SMTP de Gmail. Si Gmail devuelve `Daily user sending limit exceeded`, el codigo esta intentando enviar, pero la cuenta fue limitada por Gmail.

### Microservicios Node

Cada servicio tiene su propio `.env`.

Puertos actuales:

```text
BankAccount-service:       PORT=3004
Currency-service:          PORT=3002
Exchangerate-service:      PORT=3005
GestionBancarioManagment:  PORT=3006
Notification-service:      PORT=3010
Transactions-service:      PORT=3003
```

Variables comunes:

```env
URI_MONGO=mongodb://localhost:27017/gestionbanco
DB_NAME=gestionbanco
DB_USER=admin
DB_PASS=admin123
DB_HOST=localhost
DB_PORT=5436
```

## Instalacion Inicial

Desde la raiz:

```powershell
cd C:\GestionBancario
pnpm install
pnpm install:services
```

Instalar frontend:

```powershell
cd C:\GestionBancario\BancoFronted
pnpm install
```

Restaurar auth .NET:

```powershell
cd C:\GestionBancario\authentication-service\auth-service
dotnet restore
```

## Como Correr Todo En Desarrollo

Usa varias terminales. No cierres una terminal si el servicio que ejecuta debe seguir vivo.

### Terminal 1: PostgreSQL Del Auth

```powershell
cd C:\GestionBancario\authentication-service\auth-service
docker compose up -d
```

Validar:

```powershell
docker ps
```

Debe aparecer:

```text
auth-service-in6bm
```

### Terminal 2: PostgreSQL De Gestion

```powershell
cd C:\GestionBancario\GestionBancarioManagment
docker compose up -d
```

Validar:

```powershell
docker ps
```

Debe aparecer:

```text
gestionbanco_postgres
```

### MongoDB Local

Antes de iniciar los microservicios Node, MongoDB debe estar corriendo.

URL esperada:

```text
mongodb://localhost:27017/gestionbanco
```

### Terminal 3: Auth .NET

Forma recomendada:

```powershell
cd C:\GestionBancario\authentication-service\auth-service
.\run-auth-service.cmd
```

Ese script:

- Entra a la carpeta correcta.
- Busca procesos `AuthService.Api`.
- Detiene procesos anteriores.
- Revisa si el puerto `5156` esta ocupado.
- Compila el proyecto.
- Ejecuta el API.

Debe quedar disponible en:

```text
http://localhost:5156/health
http://localhost:5156/swagger
```

Salida esperada:

```text
Database initialization completed successfully
AuthService API is running at http://localhost:5156
```

Comando manual equivalente:

```powershell
cd C:\GestionBancario\authentication-service\auth-service
dotnet run --project .\src\AuthService.Api\AuthService.Api.csproj
```

### Terminal 4: Microservicios Node

Desde la raiz:

```powershell
cd C:\GestionBancario
pnpm dev
```

Esto levanta:

```text
BankAccount-service
Currency-service
Exchangerate-service
GestionBancarioManagment
Notification-service
Transactions-service
```

Para detenerlos:

```text
Ctrl + C
```

### Terminal 5: Frontend

```powershell
cd C:\GestionBancario\BancoFronted
pnpm dev
```

Abrir:

```text
http://localhost:5173
```

## Resumen Rapido De Arranque

```powershell
# 1. PostgreSQL auth
cd C:\GestionBancario\authentication-service\auth-service
docker compose up -d

# 2. PostgreSQL gestion
cd C:\GestionBancario\GestionBancarioManagment
docker compose up -d

# 3. Confirmar MongoDB local en localhost:27017

# 4. Auth .NET
cd C:\GestionBancario\authentication-service\auth-service
.\run-auth-service.cmd

# 5. Microservicios Node
cd C:\GestionBancario
pnpm dev

# 6. Frontend
cd C:\GestionBancario\BancoFronted
pnpm dev
```

## Como Funciona El Flujo De Login Y Registro

1. El usuario entra al frontend en `http://localhost:5173`.
2. El frontend usa `VITE_AUTH_URL`.
3. `VITE_AUTH_URL` apunta a `http://localhost:5156/api/v1`.
4. El registro llama a `POST /auth/register`.
5. El auth .NET crea el usuario en PostgreSQL `KinalSports`.
6. El auth .NET genera token de verificacion.
7. El auth .NET envia correo mediante SMTP.
8. El enlace del correo apunta al frontend:

```text
http://localhost:5173/verify-email?token=...
```

9. La pagina `VerifyEmailPage` lee el token.
10. El frontend llama a:

```text
POST http://localhost:5156/api/v1/auth/verify-email
```

11. El auth .NET activa el usuario.
12. El usuario ya puede iniciar sesion.

## Auth .NET

Base:

```text
http://localhost:5156/api/v1
```

Endpoints principales:

```text
POST /auth/register
POST /auth/login
POST /auth/refresh
POST /auth/logout
GET  /auth/profile
POST /auth/verify-email
GET  /auth/verify-email?token=...
POST /auth/resend-verification
POST /auth/forgot-password
POST /auth/reset-password
GET  /auth/users
```

Credenciales seed:

```text
Email:    admin@ksports.local
Usuario:  admin
Password: Admin1234!
Rol:      ADMIN_ROLE
```

## Frontend

Carpeta:

```text
BancoFronted
```

Comandos:

```powershell
pnpm dev
pnpm build
pnpm preview
```

Rutas relevantes:

```text
/                 Login/registro
/verify-email     Verificacion de correo
/dashboard        Dashboard protegido
```

El frontend usa:

```text
BancoFronted/src/shared/api/api.js
BancoFronted/src/shared/api/auth.js
```

## Microservicios Node

### GestionBancarioManagment

Puerto:

```text
3006
```

Base:

```text
http://localhost:3006/gestionbanco/v1
```

Es la API principal de gestion bancaria. Usa PostgreSQL y MongoDB.

### BankAccount-service

Puerto:

```text
3004
```

Responsable de cuentas bancarias.

### Currency-service

Puerto:

```text
3002
```

Responsable de monedas/divisas.

### Exchangerate-service

Puerto:

```text
3005
```

Responsable de tasas de cambio. Consume `Currency-service` mediante:

```env
CURRENCY_SERVICE_URL=http://localhost:3002
```

### Transactions-service

Puerto:

```text
3003
```

Responsable de transacciones. En el codigo hay llamadas a:

```text
Notification-service: http://localhost:3010
Record service:       http://localhost:3009
```

Si una transaccion falla al registrar historial, revisar esa URL `3009`, porque no aparece como servicio levantado por el orquestador actual.

### Notification-service

Puerto:

```text
3010
```

Base:

```text
http://localhost:3010/notification/v1
```

Health:

```text
http://localhost:3010/notification/v1/Health
```

## Como Verificar Que Todo Esta Vivo

Auth:

```text
http://localhost:5156/health
```

Frontend:

```text
http://localhost:5173
```

Gestion bancaria:

```text
http://localhost:3006/gestionbanco/v1/Health
```

Notification:

```text
http://localhost:3010/notification/v1/Health
```

Swagger de auth:

```text
http://localhost:5156/swagger
```

Swagger de servicios Node:

```text
http://localhost:<PUERTO>/api-docs
```

## Problemas Comunes

### `pnpm dev` no levanta auth ni frontend

Es normal. El `pnpm dev` de la raiz solo levanta los microservicios Node listados en `scripts/run-services.js`.

### El correo de verificacion no llega

Revisa logs:

```text
authentication-service/auth-service/src/AuthService.Api/logs/
```

Si aparece:

```text
Daily user sending limit exceeded
```

Gmail bloqueo la cuenta por cuota diaria. El codigo si esta intentando enviar.

Si aparece:

```text
SMTP authentication failed
```

Las credenciales SMTP son incorrectas o el app password fue revocado.

### El enlace del correo da 404

El enlace apunta al frontend:

```text
http://localhost:5173/verify-email?token=...
```

Debes tener `BancoFronted` corriendo con:

```powershell
pnpm dev
```

### El frontend no conecta con auth

Revisa:

```text
BancoFronted/.env
```

Debe tener:

```env
VITE_AUTH_URL=http://localhost:5156/api/v1
```

Reinicia Vite despues de cambiarlo.

### El frontend no conecta con gestion bancaria

Revisa:

```env
VITE_ADMIN_URL=http://localhost:3006/gestionbanco/v1
```

Y confirma que `GestionBancarioManagment` este corriendo.

### Error de PostgreSQL

Verifica:

```powershell
docker ps
```

Debes ver:

```text
auth-service-in6bm
gestionbanco_postgres
```

### Error de MongoDB

MongoDB debe estar disponible en:

```text
mongodb://localhost:27017/gestionbanco
```

### Puerto ocupado en auth

Usa:

```powershell
cd C:\GestionBancario\authentication-service\auth-service
.\run-auth-service.cmd
```

Ese script intenta matar procesos anteriores y liberar `5156`.

## Limitacion Actual Del Orquestador

El orquestador actual es intencionalmente simple:

```text
scripts/run-services.js
```

Solo corre microservicios Node con `pnpm dev`.

No hace:

- Levantar Docker.
- Validar MongoDB.
- Correr auth .NET.
- Correr frontend.
- Verificar health checks.
- Abrir terminales separadas.

Para que un solo comando levante absolutamente todo, habria que extender el script para manejar Docker, .NET, Vite, health checks y apagado ordenado.

Por ahora, el flujo correcto es:

```text
PostgreSQL auth
PostgreSQL gestion
MongoDB local
Auth .NET
Microservicios Node con pnpm dev
Frontend
```