# GUÍA RÁPIDA - RECREAR AuthService

> Versión resumida del flujo de recreación (sin código completo)

---

## DIAGRAMA DE FLUJO

```
1.  CREAR ESTRUCTURA BASE (Proyecto y librerías)
        ↓
2.  DEFINIR ENTIDADES (Domain)
        ↓
3.  CONFIGURAR BASE DE DATOS (Persistence)
        ↓
4.  CREAR DTOs Y INTERFACES (Application)
        ↓
5.  IMPLEMENTAR SERVICIOS (Application)
        ↓
6.  CONFIGURAR DEPENDENCIAS (Api)
        ↓
7.  CREAR CONTROLLERS (Api)
        ↓
8.  AGREGAR MIDDLEWARES (Api)
```

---

## PASO 1: CREAR LA ESTRUCTURA BASE DEL PROYECTO

### 1.1 Crear la solución

```bash
dotnet new sln -n AuthService
mkdir -p src/AuthService.{Api,Application,Domain,Persistence}
```

### 1.2 Crear proyectos

```bash
cd src
dotnet new classlib -n AuthService.Domain -f net8.0
dotnet new classlib -n AuthService.Persistence -f net8.0
dotnet new classlib -n AuthService.Application -f net8.0
dotnet new webapi -n AuthService.Api -f net8.0
cd ..
dotnet sln add src/AuthService.{Domain,Persistence,Application,Api}/*.csproj
```

### 1.3 Agregar referencias entre proyectos

```bash
cd src/AuthService.Application
dotnet add reference ../AuthService.Domain/AuthService.Domain.csproj
cd ../AuthService.Persistence
dotnet add reference ../AuthService.Domain/AuthService.Domain.csproj
cd ../AuthService.Api
dotnet add reference ../AuthService.{Application,Persistence}/*.csproj
```

### 1.4 Instalar dependencias principales

**AuthService.Domain:**

```bash
dotnet add package System.ComponentModel.Annotations
```

**AuthService.Persistence:**

```bash
dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL
dotnet add package Microsoft.EntityFrameworkCore.Design
dotnet add package EFCore.NamingConventions
dotnet add package Microsoft.EntityFrameworkCore.Tools
```

**AuthService.Application:**

```bash
dotnet add package Konscious.Security.Cryptography.Argon2
dotnet add package MailKit
dotnet add package CloudinaryDotNet
dotnet add package FluentValidation.AspNetCore
```

**AuthService.Api:**

```bash
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer
dotnet add package Serilog.AspNetCore
dotnet add package Serilog.Sinks.File
dotnet add package NetEscapades.AspNetCore.SecurityHeaders
```

---

## PASO 2: DEFINIR ENTIDADES EN DOMAIN

### 2.1 Estructura de carpetas

```bash
mkdir -p src/AuthService.Domain/{Entities,Enums,Constants,Interfaces}
```

### 2.2 Crear archivos

**Enums:**

- `Enums/UserRole.cs` - enum: Admin, User

**Constants:**

- `Constants/RoleConstants.cs` - ADMIN_ROLE, USER_ROLE, AllowedRoles

**Entities:**

- `Entities/User.cs`
    - Propiedades: Id, Name, Surname, Username, Email, Password, Status, CreatedAt, UpdatedAt
    - Navegación: UserProfile, UserEmail, UserPasswordReset, UserRoles

- `Entities/UserProfile.cs`
    - Propiedades: Id, UserId, ProfilePicture, Phone, CreatedAt, UpdatedAt
    - Navegación: User

- `Entities/Role.cs`
    - Propiedades: Id, Name, Description, CreatedAt, UpdatedAt
    - Navegación: UserRoles

- `Entities/UserRole.cs`
    - Propiedades: Id, UserId, RoleId, AssignedAt
    - Navegación: User, Role

- `Entities/UserEmail.cs`
    - Propiedades: Id, UserId, EmailVerified, EmailVerificationToken, EmailVerificationTokenExpiry, CreatedAt, UpdatedAt
    - Navegación: User

- `Entities/UserPasswordReset.cs`
    - Propiedades: Id, UserId, PasswordResetToken, PasswordResetTokenExpiry, CreatedAt, UpdatedAt
    - Navegación: User

**Interfaces:**

- `Interfaces/IUserRepository.cs`
    - Métodos: GetByIdAsync, GetByEmailAsync, GetByUsernameAsync, CreateAsync, UpdateAsync, DeleteAsync, GetByEmailVerificationTokenAsync, GetByPasswordResetTokenAsync, UpdateUserRoleAsync, ExistsByEmailAsync, ExistsByUsernameAsync

- `Interfaces/IRoleRepository.cs`
    - Métodos: GetByNameAsync, CountUsersInRoleAsync, GetUsersByRoleAsync, GetUserRoleNamesAsync

---

## PASO 3: CONFIGURAR LA CAPA PERSISTENCE

### 3.1 Estructura de carpetas

```bash
mkdir -p src/AuthService.Persistence/{Data,Repositories,Migrations}
```

### 3.2 Crear archivos

**Data:**

- `Data/ApplicationDbContext.cs`
    - DbSets: Users, UserProfiles, Roles, UserRoles, UserEmails, UserPasswordResets
    - Método: OnModelCreating (configurar relaciones y snake_case)
    - Método: ToSnakeCase

- `Data/DataSeeder.cs`
    - Método: SeedAsync (crear roles ADMIN_ROLE y USER_ROLE)

**Repositories:**

- `Repositories/UserRepository.cs`
    - Implementa IUserRepository (11 métodos)
    - Usa EF.Functions.ILike para búsquedas case-insensitive

- `Repositories/RoleRepository.cs`
    - Implementa IRoleRepository (4 métodos)

### 3.3 Configurar base de datos

```bash
# En appsettings.json agregar ConnectionStrings
dotnet ef migrations add InitialCreate --project src/AuthService.Persistence --startup-project src/AuthService.Api
dotnet ef database update --project src/AuthService.Persistence --startup-project src/AuthService.Api
```

---

## PASO 4: CREAR DTOs Y INTERFACES EN APPLICATION

### 4.1 Estructura de carpetas

```bash
mkdir -p src/AuthService.Application/{DTOs,DTOs/Email,Exceptions,Interfaces,Services,Validators,Extensions}
```

### 4.2 Crear archivos

**Exceptions:**

- `Exceptions/ErrorCodes.cs` - enum con códigos de error
- `Exceptions/BusinessException.cs` - excepción personalizada

**DTOs (Request):**

- `DTOs/RegisterDto.cs` - Name, Surname, Username, Email, Password, ConfirmPassword, Phone, ProfilePicture
- `DTOs/LoginDto.cs` - EmailOrUsername, Password
- `DTOs/VerifyEmailDto.cs` - Token
- `DTOs/ResendVerificationDto.cs` - Email
- `DTOs/ForgotPasswordDto.cs` - Email
- `DTOs/ResetPasswordDto.cs` - Token, NewPassword, ConfirmPassword
- `DTOs/UpdateUserRoleDto.cs` - UserId, NewRole
- `DTOs/GetProfileByIdDto.cs` - UserId

**DTOs (Response):**

- `DTOs/AuthResponseDto.cs` - Success, Message, Token, UserDetails, ExpiresAt
- `DTOs/RegisterResponseDto.cs` - Success, User, Message, EmailVerificationRequired
- `DTOs/UserResponseDto.cs` - Id, Name, Surname, Username, Email, ProfilePicture, Phone, Role, Status, IsEmailVerified, CreatedAt, UpdatedAt
- `DTOs/UserDetailsDto.cs` - Id, Username, ProfilePicture, Role
- `DTOs/Email/EmailResponseDto.cs` - Success, Message

**Interfaces:**

- `Interfaces/IAuthService.cs` - RegisterAsync, LoginAsync, VerifyEmailAsync, ResendVerificationEmailAsync, ForgotPasswordAsync, ResetPasswordAsync
- `Interfaces/IUserManagementService.cs` - GetUserProfileByIdAsync, UpdateUserRoleAsync, GetUsersWithRoleAsync
- `Interfaces/IJwtTokenService.cs` - GenerateToken
- `Interfaces/IPasswordHashService.cs` - HashPassword, VerifyPassword
- `Interfaces/IEmailService.cs` - SendEmailVerificationAsync, SendPasswordResetAsync, SendWelcomeEmailAsync
- `Interfaces/ICloudinaryService.cs` - UploadImageAsync, DeleteImageAsync, GetFullImageUrl
- `Interfaces/IUuidGenerator.cs` - GenerateUserId, GenerateRoleId
- `Interfaces/ITokenGenerator.cs` - GenerateEmailVerificationToken, GeneratePasswordResetToken
- `Interfaces/IFileData.cs` - FileName, ContentType, Length, OpenReadStream

**Validators:**

- `Validators/RegisterDtoValidator.cs` - validaciones con FluentValidation

**Extensions:**

- `Extensions/LoggerExtensions.cs` - métodos de logging personalizados

---

## PASO 5: IMPLEMENTAR SERVICIOS EN APPLICATION

### 5.1 Crear archivos

**Services:**

- `Services/UuidGenerator.cs`
    - GenerateUserId() → "usr_XXXXX"
    - GenerateRoleId() → "rol_XXXXX"

- `Services/TokenGenerator.cs`
    - GenerateEmailVerificationToken() → token random de 64 bytes
    - GeneratePasswordResetToken() → token random de 64 bytes

- `Services/PasswordHashService.cs`
    - HashPassword(string password) → hash Argon2id
    - VerifyPassword(string password, string hash) → bool
    - VerifyArgon2StandardFormat, VerifyLegacyFormat
    - Parámetros: MemorySize=102400, Iterations=2, DegreeOfParallelism=8

- `Services/JwtTokenService.cs`
    - GenerateToken(User user) → string token JWT
    - Claims: sub (userId), jti (Guid), iat (timestamp), role

- `Services/EmailService.cs`
    - SendEmailVerificationAsync(string toEmail, string username, string token)
    - SendPasswordResetAsync(string toEmail, string username, string token)
    - SendWelcomeEmailAsync(string toEmail, string username)
    - Usa MailKit (SmtpClient, MimeMessage, BodyBuilder)

- `Services/CloudinaryService.cs`
    - UploadImageAsync(IFileData file) → public_id
    - DeleteImageAsync(string publicId)
    - GetFullImageUrl(string publicId) → URL completa o default avatar

- `Services/AuthService.cs`
    - RegisterAsync(RegisterDto dto) → RegisterResponseDto
    - LoginAsync(LoginDto dto) → AuthResponseDto
    - VerifyEmailAsync(VerifyEmailDto dto) → EmailResponseDto
    - ResendVerificationEmailAsync(ResendVerificationDto dto) → EmailResponseDto
    - ForgotPasswordAsync(ForgotPasswordDto dto) → EmailResponseDto
    - ResetPasswordAsync(ResetPasswordDto dto) → EmailResponseDto

- `Services/UserManagementService.cs`
    - GetUserProfileByIdAsync(GetProfileByIdDto dto) → UserResponseDto
    - UpdateUserRoleAsync(UpdateUserRoleDto dto)
    - GetUsersWithRoleAsync(string roleName) → IReadOnlyList<UserResponseDto>

---

## PASO 6: CONFIGURAR DEPENDENCIAS EN API

### 6.1 Estructura de carpetas

```bash
mkdir -p src/AuthService.Api/{Extensions,Controllers,Middlewares,Models}
```

### 6.2 Crear Extensions

**Extensions:**

- `Extensions/ServiceCollectionExtensions.cs`
    - AddApplicationServices() → registra todos los servicios de Application
    - AddPersistenceServices(IConfiguration) → registra DbContext y repositorios con UseSnakeCaseNamingConvention()

- `Extensions/AuthenticationExtensions.cs`
    - AddJwtAuthentication(IConfiguration) → configura JWT Bearer
    - Parámetros: ValidateIssuer, ValidateAudience, ValidateLifetime, ClockSkew = TimeSpan.Zero

- `Extensions/RateLimitingExtensions.cs`
    - AddCustomRateLimiting() → AuthPolicy (5 requests/min fixed), ApiPolicy (100 tokens/min)
    - OnRejected: "Too Many Requests. Please try again later."

- `Extensions/SecurityExtensions.cs`
    - AddSecurityServices() → CORS, DataProtection, Antiforgery, Security Headers
    - DefaultCorsPolicy (Allow any origin/method/header)
    - AdminCorsPolicy (solo origins específicos)
    - DataProtection: persiste keys en directorio "keys"

**Middlewares:**

- `Middlewares/GlobalExceptionMiddleware.cs`
    - Maneja BusinessException y excepciones genéricas
    - Retorna ErrorResponse con mensaje y código

**Models:**

- `Models/ErrorResponse.cs` - Message, ErrorCode, Timestamp
- `Models/FormFileAdapter.cs` - adapta IFormFile a IFileData
- `ModelBinders/FileDataModelBinder.cs` - model binder para IFileData

---

## PASO 7: CREAR CONTROLLERS EN API

### 7.1 Crear archivos

**Controllers:**

- `Controllers/AuthController.cs`
    - Route: [Route("api/v1/auth")]
    - Endpoints:
        - GET profile → GetProfile() [Authorize]
        - GET profile/{userId} → GetProfileById(userId) [Authorize]
        - POST register → Register(RegisterDto) [EnableRateLimiting("AuthPolicy")]
        - POST login → Login(LoginDto) [EnableRateLimiting("AuthPolicy")]
        - POST verify-email → VerifyEmail(VerifyEmailDto)
        - POST resend-verification → ResendVerification(ResendVerificationDto)
        - POST forgot-password → ForgotPassword(ForgotPasswordDto)
        - POST reset-password → ResetPassword(ResetPasswordDto)

- `Controllers/UsersController.cs`
    - Route: [Route("api/v1/users")]
    - Endpoints:
        - PUT update-role → UpdateUserRole(UpdateUserRoleDto) [Authorize, RequireRole("ADMIN_ROLE")]
        - GET roles → GetUserRoles([FromQuery] string userId) [Authorize]
        - GET by-role/{roleName} → GetUsersByRole(roleName) [Authorize]

- `Controllers/HealthController.cs`
    - Route: [Route("api/v1/health")]
    - Endpoints:
        - GET / → GetHealth() → OK("Healthy")

---

## PASO 8: CONFIGURAR Program.cs Y appsettings.json

### 8.1 Program.cs

**Configuración:**

```csharp
// Serilog
builder.Host.UseSerilog(...)

// Servicios
builder.Services.AddControllers(options => {
    options.ModelBinderProviders.Insert(0, new FileDataModelBinderProvider());
});

builder.Services.AddApplicationServices();
builder.Services.AddPersistenceServices(builder.Configuration);
builder.Services.AddJwtAuthentication(builder.Configuration);
builder.Services.AddCustomRateLimiting();
builder.Services.AddSecurityServices();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHealthChecks();

// Middleware pipeline
app.UseMiddleware<GlobalExceptionMiddleware>();
app.UseSecurityHeaders(...);
app.UseSerilogRequestLogging();
app.UseHttpsRedirection();
app.UseCors("DefaultCorsPolicy");
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();

// Health checks
app.MapHealthChecks("/health");
app.MapHealthChecks("/api/v1/health");

// Database seeding
using (var scope = app.Services.CreateScope()) {
    await DataSeeder.SeedAsync(context);
}

app.Run();
```

### 8.2 appsettings.json

**Configuraciones necesarias:**

```json
{
    "ConnectionStrings": {
        "DefaultConnection": "Host=localhost;Port=5432;Database=auth_db;Username=postgres;Password=your_password"
    },
    "JwtSettings": {
        "SecretKey": "your-super-secret-key-min-32-chars",
        "Issuer": "AuthService",
        "Audience": "AuthServiceClients",
        "ExpiryInMinutes": 30
    },
    "SmtpSettings": {
        "Host": "smtp.gmail.com",
        "Port": 587,
        "Username": "your-email@gmail.com",
        "Password": "your-app-password",
        "FromEmail": "noreply@authservice.com",
        "FromName": "AuthService"
    },
    "CloudinarySettings": {
        "CloudName": "your-cloud-name",
        "ApiKey": "your-api-key",
        "ApiSecret": "your-api-secret",
        "DefaultProfilePicture": "default-avatar-url"
    },
    "EmailSettings": {
        "FrontendBaseUrl": "http://localhost:3000"
    }
}
```

---

## PASO 9: EJECUTAR Y PROBAR

### 9.1 Comandos finales

```bash
# Compilar
dotnet build

# Ejecutar
dotnet run --project src/AuthService.Api

# Probar endpoints en Swagger
# https://localhost:7000/swagger
```

### 9.2 Endpoints disponibles

- POST /api/v1/auth/register
- POST /api/v1/auth/login
- GET /api/v1/auth/profile (requiere token)
- GET /api/v1/auth/profile/{userId} (requiere token)
- POST /api/v1/auth/verify-email
- POST /api/v1/auth/resend-verification
- POST /api/v1/auth/forgot-password
- POST /api/v1/auth/reset-password
- PUT /api/v1/users/update-role (requiere admin)
- GET /api/v1/users/roles?userId={id} (requiere token)
- GET /api/v1/users/by-role/{roleName} (requiere token)
- GET /health
- GET /api/v1/health

---

## FLUJO DE UNA SOLICITUD: EJEMPLO POST /api/v1/auth/register

```
1. Solicitud llega a AuthController.Register()
   ↓
2. Controller deserializa [FromForm] RegisterDto
   ↓
3. Controller llama authService.RegisterAsync(registerDto)
   ↓
4. AuthService valida que email/username no existan
   ↓
5. AuthService genera user.Id con uuidGenerator.GenerateUserId()
   ↓
6. AuthService hashea password con passwordHashService.HashPassword()
   ↓
7. AuthService crea User con entidades relacionadas (UserProfile, UserEmail, UserRole)
   ↓
8. AuthService genera token con tokenGenerator.GenerateEmailVerificationToken()
   ↓
9. AuthService sube imagen con cloudinaryService.UploadImageAsync()
   ↓
10. AuthService guarda usuario con userRepository.CreateAsync()
    ↓
11. AuthService envía email con emailService.SendEmailVerificationAsync()
    ↓
12. AuthService retorna RegisterResponseDto
    ↓
13. Controller retorna 201 Created con respuesta
```

---

## CHECKLIST DE IMPLEMENTACIÓN

```
DOMAIN:
  ✓ Crear carpetas (Entities, Enums, Constants, Interfaces)
  ✓ Crear Enums (UserRole)
  ✓ Crear Constantes (RoleConstants)
  ✓ Crear Entidades (User, Role, UserProfile, UserEmail, UserRole, UserPasswordReset)
  ✓ Crear Interfaces de Repositorio (IUserRepository, IRoleRepository)

PERSISTENCE:
  ✓ Crear carpetas (Data, Repositories, Migrations)
  ✓ Crear DbContext (ApplicationDbContext)
  ✓ Crear Repositorios (UserRepository, RoleRepository)
  ✓ Configurar conexión en appsettings.json
  ✓ Crear migración inicial
  ✓ Aplicar migración a BD

APPLICATION:
  ✓ Crear carpetas (DTOs, Services, Interfaces, Validators, Exceptions, Extensions)
  ✓ Crear Excepciones (ErrorCodes, BusinessException)
  ✓ Crear DTOs de solicitud (RegisterDto, LoginDto, VerifyEmailDto, etc)
  ✓ Crear DTOs de respuesta (AuthResponseDto, UserResponseDto, etc)
  ✓ Crear Interfaces de Servicios (IAuthService, IPasswordHashService, etc)
  ✓ Implementar Servicios (AuthService, JwtTokenService, PasswordHashService, etc)

API:
  ✓ Crear carpetas (Controllers, Extensions, Middlewares, Models)
  ✓ Crear Extensions (ServiceCollectionExtensions, AuthenticationExtensions, etc)
  ✓ Crear Controllers (AuthController, UsersController)
  ✓ Configurar Program.cs (Servicios, middlewares, pipeline)
  ✓ Ejecutar y probar
```

---

## ORDEN CORRECTO DE CREACIÓN (RESUMIDO)

1. **Estructura base** → Proyectos y referencias
2. **Domain** → Entidades primero (User, Role, etc)
3. **Persistence** → DbContext y Repositorios
4. **Migraciones** → Crear BD
5. **Application** → DTOs, Excepciones, Servicios
6. **API** → Extensions, Controllers, Program.cs
7. **Probar** → dotnet run y Swagger

> La clave es **ir de adentro hacia afuera**: primero lo más interno (Domain), luego capa por capa hasta la presentación (API).
