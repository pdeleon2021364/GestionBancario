# Auth Service - Servicio de Autenticación (.NET)

API RESTful de autenticación construida con ASP.NET Core y PostgreSQL con arquitectura limpia (Clean Architecture).

## 📋 Descripción

Implementación alternativa del servicio de autenticación utilizando .NET 8, siguiendo principios de Clean Architecture con capas separadas (API, Application, Domain, Persistence). Proporciona funcionalidades completas de autenticación, gestión de usuarios, verificación de email y recuperación de contraseñas.

## 🛠️ Tech Stack

- **Framework**: ASP.NET Core 8.0
- **Base de Datos**: PostgreSQL 14+
- **ORM**: Entity Framework Core 8.x
- **Autenticación**: JWT Bearer Authentication
- **Hashing**: ASP.NET Core Identity (PBKDF2)
- **Validación**: FluentValidation / Data Annotations
- **Storage**: Cloudinary (perfiles de usuario)
- **Email**: SMTP / SendGrid
- **Seguridad**: Rate Limiting, CORS, Security Headers

## 🏗️ Arquitectura

```
src/
├── AuthService.Api/              # Capa de presentación (Controllers, Middlewares)
│   ├── Controllers/
│   ├── Extensions/
│   ├── Middlewares/
│   └── Program.cs
├── AuthService.Application/      # Capa de aplicación (Services, DTOs)
│   ├── DTOs/
│   ├── Interfaces/
│   ├── Services/
│   └── Validators/
├── AuthService.Domain/           # Capa de dominio (Entities, Enums)
│   ├── Entities/
│   ├── Enums/
│   └── Interfaces/
└── AuthService.Persistence/      # Capa de persistencia (DbContext, Repositories)
    ├── Data/
    ├── Migrations/
    └── Repositories/
```

## 🚀 Instalación

```bash
# Desde la raíz del monorepo
pnpm install

# Restaurar paquetes .NET
cd authentication-service/auth-service
dotnet restore
```

## ⚙️ Variables de Entorno

Crear archivo `.env` o configurar en `appsettings.Development.json`:

```json
{
    "ConnectionStrings": {
        "DefaultConnection": "Host=localhost;Port=5432;Database=kinalsports_auth_net;Username=postgres;Password=tu_password"
    },
    "Jwt": {
        "Secret": "tu-secret-key-super-segura-de-minimo-32-caracteres",
        "Issuer": "KinalSportsAuthService",
        "Audience": "KinalSportsClients",
        "ExpiryMinutes": 10080,
        "RefreshExpiryDays": 30
    },
    "Cloudinary": {
        "CloudName": "tu_cloud_name",
        "ApiKey": "tu_api_key",
        "ApiSecret": "tu_api_secret"
    },
    "Email": {
        "Host": "smtp.gmail.com",
        "Port": 587,
        "Username": "tu-email@gmail.com",
        "Password": "tu-app-password",
        "FromName": "KinalSports",
        "FromAddress": "noreply@kinalsports.com"
    },
    "RateLimiting": {
        "PermitLimit": 100,
        "Window": 15,
        "QueueLimit": 10
    },
    "AllowedOrigins": "http://localhost:5173;http://localhost:3000"
}
```

## 📂 Estructura de Capas

### API Layer (AuthService.Api)

- **Controllers**: AuthController, UsersController, HealthController
- **Extensions**: Configuración de servicios, autenticación, rate limiting
- **Middlewares**: Global exception handling
- **Program.cs**: Punto de entrada y configuración

### Application Layer (AuthService.Application)

- **Services**: AuthService, UserManagementService, EmailService, CloudinaryService
- **DTOs**: RegisterDto, LoginDto, AuthResponseDto, UserDetailsDto
- **Interfaces**: Contratos de servicios
- **Validators**: Validación de archivos y datos

### Domain Layer (AuthService.Domain)

- **Entities**: User, UserProfile, UserEmail, UserPasswordReset, Role, UserRole
- **Enums**: UserRole (enum)
- **Interfaces**: IUserRepository, IRoleRepository
- **Constants**: RoleConstants

### Persistence Layer (AuthService.Persistence)

- **Data**: ApplicationDbContext, DataSeeder
- **Repositories**: UserRepository, RoleRepository
- **Migrations**: Entity Framework migrations

## 🎯 Scripts Disponibles

```bash
# Desarrollo con hot reload
pnpm --filter auth-service dev
# o
dotnet watch --project src/AuthService.Api

# Build
pnpm --filter auth-service build
# o
dotnet build

# Ejecutar en producción
pnpm --filter auth-service start
# o
dotnet run --project src/AuthService.Api

# Tests
pnpm --filter auth-service test
# o
dotnet test

# Format
pnpm --filter auth-service format
# o
dotnet format

# Limpiar
pnpm --filter auth-service clean
# o
dotnet clean
```

## 🗄️ Migraciones de Base de Datos

```bash
# Crear nueva migración
dotnet ef migrations add MigrationName --project src/AuthService.Persistence --startup-project src/AuthService.Api

# Aplicar migraciones
dotnet ef database update --project src/AuthService.Persistence --startup-project src/AuthService.Api

# Revertir migración
dotnet ef database update PreviousMigration --project src/AuthService.Persistence --startup-project src/AuthService.Api

# Eliminar última migración
dotnet ef migrations remove --project src/AuthService.Persistence --startup-project src/AuthService.Api
```

## 🔌 Endpoints Principales

### Autenticación

| Método | Endpoint                        | Descripción                    | Auth |
| ------ | ------------------------------- | ------------------------------ | ---- |
| POST   | `/api/auth/register`            | Registrar nuevo usuario        | No   |
| POST   | `/api/auth/login`               | Iniciar sesión                 | No   |
| POST   | `/api/auth/verify-email`        | Verificar email con token      | No   |
| POST   | `/api/auth/resend-verification` | Reenviar email de verificación | No   |
| POST   | `/api/auth/forgot-password`     | Solicitar reset de contraseña  | No   |
| POST   | `/api/auth/reset-password`      | Resetear contraseña con token  | No   |

### Gestión de Usuarios

| Método | Endpoint               | Descripción               | Auth       |
| ------ | ---------------------- | ------------------------- | ---------- |
| GET    | `/api/users`           | Listar todos los usuarios | Sí (Admin) |
| GET    | `/api/users/{id}`      | Obtener usuario por ID    | Sí (Admin) |
| PUT    | `/api/users/{id}/role` | Actualizar rol de usuario | Sí (Admin) |
| DELETE | `/api/users/{id}`      | Desactivar usuario        | Sí (Admin) |

### Health Check

| Método | Endpoint     | Descripción                | Auth |
| ------ | ------------ | -------------------------- | ---- |
| GET    | `/health`    | Estado del servicio        | No   |
| GET    | `/health/db` | Estado de la base de datos | No   |

### Ejemplo de Request

**Registro:**

```bash
POST https://localhost:7001/api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Login:**

```bash
POST https://localhost:7001/api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response:**

```json
{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh_token_here",
    "expiresAt": "2025-11-27T12:00:00Z",
    "user": {
        "id": "uuid-here",
        "username": "johndoe",
        "email": "john@example.com",
        "roles": ["USER"]
    }
}
```

## 🔐 Seguridad

- **Password Hashing**: PBKDF2 con salt (ASP.NET Core Identity)
- **JWT**: Tokens firmados con HS256
- **Rate Limiting**: 100 requests por 15 minutos
- **CORS**: Orígenes configurables
- **Security Headers**: HSTS, X-Content-Type-Options, X-Frame-Options
- **Input Validation**: FluentValidation + Data Annotations
- **Exception Handling**: Middleware global para manejo de errores

## 🔗 Dependencias con Otros Servicios

- **server-admin**: Valida tokens JWT de administradores
- **server-user**: Valida tokens JWT de usuarios
- **client-admin**: Consume endpoints de autenticación
- **auth-node**: Servicio paralelo/alternativo (misma base de datos)

## 🧪 Testing

```bash
# Ejecutar todos los tests
dotnet test

# Con cobertura
dotnet test /p:CollectCoverage=true /p:CoverageReportsFormat=lcov

# Tests específicos
dotnet test --filter FullyQualifiedName~AuthService.Tests.AuthControllerTests
```

## 📝 Configuración Adicional

### HTTPS Development Certificate

```bash
dotnet dev-certs https --trust
```

### appsettings.json Environments

- `appsettings.json`: Configuración base
- `appsettings.Development.json`: Desarrollo local
- `appsettings.Production.json`: Producción

## 🚀 Deployment

```bash
# Publicar para producción
dotnet publish -c Release -o ./publish

# Ejecutar publicación
cd publish
dotnet AuthService.Api.dll
```

## 📦 Paquetes NuGet Principales

- `Microsoft.EntityFrameworkCore` (8.x)
- `Npgsql.EntityFrameworkCore.PostgreSQL`
- `Microsoft.AspNetCore.Authentication.JwtBearer`
- `Microsoft.AspNetCore.Identity.EntityFrameworkCore`
- `FluentValidation.AspNetCore`
- `CloudinaryDotNet`
- `Swashbuckle.AspNetCore` (Swagger)

## 👤 Autor

**Braulio Echeverria**

## 📄 Licencia

MIT
