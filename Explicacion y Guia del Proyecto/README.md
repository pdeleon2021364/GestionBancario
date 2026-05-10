# GestionBancario

Proyecto bancario compuesto por un frontend React/Vite, un servicio de autenticacion en .NET 8 y varios microservicios Node.js.

La configuracion actual usa **un solo contenedor Docker de PostgreSQL**: el contenedor del `auth-service`. Dentro de ese mismo PostgreSQL viven varias bases de datos:

```text
auth-service-in6bm
|-- KinalSports   -> auth-service .NET
`-- gestionbanco  -> GestionBancarioManagment y servicios Node que requieran PostgreSQL
```

No se debe levantar otro PostgreSQL desde `GestionBancarioManagment` para el flujo normal de desarrollo.

## Mapa Del Proyecto

```text
GestionBancario/
|-- BancoFronted/                         # Frontend React + Vite
|-- authentication-service/
|   |-- auth-service/                     # Auth principal en .NET 8
|   `-- auth-node/                        # Auth Node alternativo/referencia
|-- BankAccount-service/                  # Microservicio de cuentas bancarias
|-- Currency-service/                     # Microservicio de monedas/divisas
|-- Exchangerate-service/                 # Microservicio de tasas de cambio
|-- GestionBancarioManagment/             # API principal de gestion bancaria
|-- Notification-service/                 # Microservicio de notificaciones
|-- Transactions-service/                 # Microservicio de transacciones
|-- scripts/
|   |-- install-services.js               # Instala dependencias de servicios Node
|   `-- run-services.js                   # Corre servicios Node en paralelo
|-- package.json                          # Comandos globales del workspace
`-- README.md
```

## Puertos Principales

| Componente | Puerto | URL |
| --- | ---: | --- |
| Frontend React | 5173 | `http://localhost:5173` |
| Auth .NET API | 5156 | `http://localhost:5156/api/v1` |
| Auth Swagger | 5156 | `http://localhost:5156/swagger` |
| Auth Health | 5156 | `http://localhost:5156/health` |
| PostgreSQL unico | 5435 | `localhost:5435` |
| Currency-service | 3002 | `http://localhost:3002` |
| Transactions-service | 3003 | `http://localhost:3003` |
| BankAccount-service | 3004 | `http://localhost:3004` |
| Exchangerate-service | 3005 | `http://localhost:3005` |
| GestionBancarioManagment | 3006 | `http://localhost:3006/gestionbanco/v1` |
| Notification-service | 3010 | `http://localhost:3010/notification/v1` |
| MongoDB local | 27017 | `mongodb://localhost:27017` |

## Base De Datos PostgreSQL Unica

El unico PostgreSQL que se usa en desarrollo es:

```text
Contenedor: auth-service-in6bm
Imagen:     postgres:16
Host:       localhost
Puerto:     5435 -> 5432
Compose:    authentication-service/auth-service/docker-compose.yml
```

Dentro del mismo contenedor se usan estas bases:

| Base | Usuario | Password | Usada por |
| --- | --- | --- | --- |
| `KinalSports` | `root` | `admin` | `auth-service` .NET |
| `gestionbanco` | `admin` | `admin123` | `GestionBancarioManagment` |

El archivo `authentication-service/auth-service/docker/init-gestionbanco.sql` crea el usuario `admin` y la base `gestionbanco` cuando el volumen de PostgreSQL se inicializa por primera vez.

Si el contenedor ya existia antes de agregar ese script, la base `gestionbanco` debe existir dentro del contenedor actual. En esta configuracion ya fue creada manualmente sin borrar volumenes.

## Importante Sobre GestionBancarioManagment

`GestionBancarioManagment/docker-compose.yml` ya no se usa para levantar PostgreSQL en el flujo normal.

Ese compose conserva el servicio `postgres`, pero quedo protegido con el perfil:

```yaml
profiles:
  - legacy-postgres
```

Eso significa que este comando ya no deberia levantar el segundo PostgreSQL:

```powershell
cd C:\GestionBancario\GestionBancarioManagment
docker compose up -d
```

Solo se usaria el PostgreSQL legado si explicitamente corres el perfil `legacy-postgres`. Para este proyecto, no lo uses salvo que quieras volver temporalmente al esquema viejo.

## Variables Importantes

### Auth .NET

Archivo:

```text
authentication-service/auth-service/src/AuthService.Api/appsettings.Development.json
```

Conexion esperada:

```text
Host=localhost;Database=KinalSports;Username=root;Password=admin;Port=5435
```

Tambien ahi viven las configuraciones de correo:

```text
SmtpSettings
SendGridSettings
AppSettings:FrontendUrl
AppSettings:BackendUrl
```

No se cambio el flujo de correos ni la verificacion de cuenta.

### GestionBancarioManagment

Archivo:

```text
GestionBancarioManagment/.env
```

Debe apuntar al mismo PostgreSQL del auth:

```env
DB_NAME=gestionbanco
DB_USER=admin
DB_PASS=admin123
DB_HOST=localhost
DB_PORT=5435
```

Con esto se elimina el `ECONNREFUSED` que aparecia cuando el servicio intentaba conectarse al puerto `5436` y el segundo contenedor no estaba corriendo.

### Otros Servicios Node

Los servicios `BankAccount-service`, `Currency-service`, `Transactions-service` y `Exchangerate-service` usan MongoDB en su codigo actual. Algunos tienen variables `DB_*` por compatibilidad, y quedaron apuntando tambien a `5435` para no dejar referencias al PostgreSQL viejo.

MongoDB esperado:

```env
URI_MONGO=mongodb://localhost:27017/gestionbanco
```

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

`pnpm install:services` instala dependencias en:

```text
authentication-service/auth-node
BankAccount-service
Currency-service
Exchangerate-service
GestionBancarioManagment
Notification-service
Transactions-service
```

`pnpm dev` levanta en paralelo:

```text
BankAccount-service
Currency-service
Exchangerate-service
GestionBancarioManagment
Notification-service
Transactions-service
```

Este comando no levanta Docker, no levanta el auth .NET y no levanta el frontend.

## Instalacion Inicial

Desde la raiz:

```powershell
cd C:\GestionBancario
pnpm install
pnpm install:services
```

Frontend:

```powershell
cd C:\GestionBancario\BancoFronted
pnpm install
```

Auth .NET:

```powershell
cd C:\GestionBancario\authentication-service\auth-service
dotnet restore
```

## Como Correr Todo

Usa varias terminales y deja cada proceso abierto.

### 1. Levantar El Unico PostgreSQL

```powershell
cd C:\GestionBancario\authentication-service\auth-service
docker compose up -d
```

Verifica:

```powershell
docker ps
```

Debe aparecer `auth-service-in6bm` usando el puerto `5435`. No deberias necesitar `gestionbanco_postgres`.

### 2. Asegurar MongoDB Local

MongoDB debe estar activo en:

```text
mongodb://localhost:27017
```

Si usas MongoDB como servicio de Windows, revisa que este iniciado. Si usas MongoDB Compass, valida que conecte a `localhost:27017`.

### 3. Correr Auth .NET

Forma recomendada:

```powershell
cd C:\GestionBancario\authentication-service\auth-service
.\run-auth-service.cmd
```

Debe quedar disponible en:

```text
http://localhost:5156/health
http://localhost:5156/swagger
```

### 4. Correr Microservicios Node

Desde la raiz:

```powershell
cd C:\GestionBancario
pnpm dev
```

Esto ejecuta `scripts/run-services.js` y corre varios `pnpm dev` en paralelo.

### 5. Correr Frontend

```powershell
cd C:\GestionBancario\BancoFronted
pnpm dev
```

Abre:

```text
http://localhost:5173
```

## Resumen Rapido

```powershell
# PostgreSQL unico
cd C:\GestionBancario\authentication-service\auth-service
docker compose up -d

# Auth .NET
cd C:\GestionBancario\authentication-service\auth-service
.\run-auth-service.cmd

# Microservicios Node
cd C:\GestionBancario
pnpm dev

# Frontend
cd C:\GestionBancario\BancoFronted
pnpm dev
```

No corras `docker compose up -d` en `GestionBancarioManagment` para levantar PostgreSQL. El PostgreSQL de gestion ahora vive dentro de `auth-service-in6bm`.

## Como Verificar

PostgreSQL unico:

```powershell
docker ps
```

Debe verse:

```text
auth-service-in6bm   0.0.0.0:5435->5432/tcp
```

Conexion a la base de gestion:

```powershell
docker exec -i auth-service-in6bm psql -U admin -d gestionbanco -c "SELECT current_database(), current_user;"
```

Resultado esperado:

```text
current_database | current_user
gestionbanco     | admin
```

Health del auth:

```text
http://localhost:5156/health
```

Health de gestion:

```text
http://localhost:3006/gestionbanco/v1/Health
```

## Flujo De Registro Y Verificacion

1. El usuario entra al frontend en `http://localhost:5173`.
2. El frontend llama al auth en `http://localhost:5156/api/v1`.
3. El registro usa `POST /auth/register`.
4. El auth crea el usuario en `KinalSports`, dentro del contenedor `auth-service-in6bm`.
5. El auth envia el correo de verificacion por SMTP.
6. El enlace apunta a `http://localhost:5173/verify-email?token=...`.
7. El frontend confirma el token contra el auth.
8. El usuario queda verificado.

## Servicios

### Auth .NET

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

### GestionBancarioManagment

Base:

```text
http://localhost:3006/gestionbanco/v1
```

Usa PostgreSQL `gestionbanco` en `localhost:5435` y MongoDB local.

### BankAccount-service

Puerto:

```text
http://localhost:3004
```

Actualmente usa MongoDB.

### Currency-service

Puerto:

```text
http://localhost:3002
```

Actualmente usa MongoDB.

### Exchangerate-service

Puerto:

```text
http://localhost:3005
```

Actualmente usa MongoDB y consume `Currency-service` mediante:

```env
CURRENCY_SERVICE_URL=http://localhost:3002
```

### Transactions-service

Puerto:

```text
http://localhost:3003
```

Actualmente usa MongoDB y puede llamar a otros servicios como `Notification-service`.

### Notification-service

Base:

```text
http://localhost:3010/notification/v1
```

Health:

```text
http://localhost:3010/notification/v1/Health
```

## Problemas Comunes

### `GestionBancarioManagment` muestra `ECONNREFUSED`

Revisa que `GestionBancarioManagment/.env` tenga:

```env
DB_PORT=5435
```

Tambien confirma que el contenedor `auth-service-in6bm` este corriendo.

### Aparece `gestionbanco_postgres`

Ese es el contenedor viejo de gestion. Para este flujo no hace falta. No borres volumenes sin revisar si necesitas datos viejos.

### El correo no llega

Revisa logs del auth:

```text
authentication-service/auth-service/src/AuthService.Api/logs/
```

Si Gmail responde con limite diario o credenciales invalidas, el codigo puede estar bien pero el proveedor bloqueo el envio.

### El link del correo da 404

El link apunta al frontend:

```text
http://localhost:5173/verify-email?token=...
```

Debes tener el frontend corriendo en `5173`.

### El frontend no conecta

Revisa:

```text
BancoFronted/.env
```

Valores esperados:

```env
VITE_AUTH_URL=http://localhost:5156/api/v1
VITE_ADMIN_URL=http://localhost:3006/gestionbanco/v1
```

Reinicia Vite despues de cambiar `.env`.

## Estado Actual

La configuracion queda asi:

```text
Un solo PostgreSQL Docker:
auth-service-in6bm:5435

Bases dentro:
KinalSports  -> auth-service .NET
gestionbanco -> GestionBancarioManagment

MongoDB local:
mongodb://localhost:27017/gestionbanco
```

No se borraron datos ni volumenes para hacer este cambio.
