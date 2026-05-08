# FLUJO LÓGICO PASO A PASO PARA RECREAR LA API

> Una guía explícita, archivo por archivo, comando por comando, para recrear AuthService desde cero

---

## DIAGRAMA DE FLUJO GENERAL

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
# Ubicarse en la raíz del monorepo
cd /home/brau-dev/Documentos/kinalSports/authentication-service/auth-service

# Crear la solución principal
dotnet new sln -n AuthService

# Crear las carpetas de las capas
mkdir -p src/AuthService.Api
mkdir -p src/AuthService.Application
mkdir -p src/AuthService.Domain
mkdir -p src/AuthService.Persistence
```

### 1.2 Crear proyectos de clase (Class Library)

```bash
# Navegar a src
cd src

# Domain - Capa de dominio (NO tiene referencias a otras capas)
dotnet new classlib -n AuthService.Domain -f net8.0

# Persistence - Capa de persistencia (depende de Domain)
dotnet new classlib -n AuthService.Persistence -f net8.0

# Application - Capa de aplicación (depende de Domain)
dotnet new classlib -n AuthService.Application -f net8.0

# Api - Capa de presentación (depende de Application y Persistence)
dotnet new webapi -n AuthService.Api -f net8.0

# Volver a la raíz
cd ..

# Agregar proyectos a la solución
dotnet sln add src/AuthService.Domain/AuthService.Domain.csproj
dotnet sln add src/AuthService.Persistence/AuthService.Persistence.csproj
dotnet sln add src/AuthService.Application/AuthService.Application.csproj
dotnet sln add src/AuthService.Api/AuthService.Api.csproj
```

### 1.3 Agregar referencias entre proyectos

```bash
# Application depende de Domain
cd src/AuthService.Application
dotnet add reference ../AuthService.Domain/AuthService.Domain.csproj
cd ../..

# Persistence depende de Domain
cd src/AuthService.Persistence
dotnet add reference ../AuthService.Domain/AuthService.Domain.csproj
cd ../..

# Api depende de Application y Persistence
cd src/AuthService.Api
dotnet add reference ../AuthService.Application/AuthService.Application.csproj
dotnet add reference ../AuthService.Persistence/AuthService.Persistence.csproj
cd ../..
```

### 1.4 Instalar dependencias principales en cada capa

**En AuthService.Domain** (NO necesita dependencias externas excepto annotations)

```bash
cd src/AuthService.Domain
dotnet add package System.ComponentModel.Annotations
cd ../..
```

**En AuthService.Persistence** (necesita EF Core y PostgreSQL)

```bash
cd src/AuthService.Persistence
dotnet add package Microsoft.EntityFrameworkCore.Design -v 9.0.9
dotnet add package Microsoft.EntityFrameworkCore.PostgreSQL
dotnet add package EFCore.NamingConventions -v 9.0.0
cd ../..
```

**En AuthService.Application** (necesita validación)

```bash
cd src/AuthService.Application
dotnet add package FluentValidation
dotnet add package Microsoft.Extensions.DependencyInjection
dotnet add package Microsoft.Extensions.Configuration
cd ../..
```

**En AuthService.Api** (necesita todo)

```bash
cd src/AuthService.Api
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer -v 8.0.20
dotnet add package Swashbuckle.AspNetCore -v 9.0.4
dotnet add package Serilog.AspNetCore -v 9.0.0
dotnet add package NetEscapades.AspNetCore.SecurityHeaders -v 1.2.0
cd ../..
```

---

## PASO 2: DEFINIR ENTIDADES EN LA CAPA DOMAIN

> Las entidades son los modelos de negocio puros, sin dependencias de BD ni frameworks

### 2.1 Estructura de carpetas en Domain

```bash
mkdir -p src/AuthService.Domain/Entities
mkdir -p src/AuthService.Domain/Enums
mkdir -p src/AuthService.Domain/Constants
mkdir -p src/AuthService.Domain/Interfaces
```

### 2.2 Crear ENUMS - `src/AuthService.Domain/Enums/UserRole.cs`

```csharp
namespace AuthService.Domain.Enums;

public enum UserRole
{
    User = 0,
    Admin = 1,
    Moderator = 2
}
```

### 2.3 Crear CONSTANTES - `src/AuthService.Domain/Constants/RoleConstants.cs`

```csharp
namespace AuthService.Domain.Constants;

public static class RoleConstants
{
    public const string ADMIN_ROLE = "ADMIN_ROLE";
    public const string USER_ROLE = "USER_ROLE";

    public static readonly string[] AllowedRoles = [ADMIN_ROLE, USER_ROLE];
}
```

### 2.4 Crear ENTIDAD Base (opcional) - `src/AuthService.Domain/Entities/BaseEntity.cs`

```csharp
using System.ComponentModel.DataAnnotations;

namespace AuthService.Domain.Entities;

public abstract class BaseEntity
{
    [Key]
    [MaxLength(16)]
    public string Id { get; set; } = string.Empty;

    [Required]
    public DateTime CreatedAt { get; set; }

    [Required]
    public DateTime UpdatedAt { get; set; }
}
```

### 2.5 Crear ENTIDAD Role - `src/AuthService.Domain/Entities/Role.cs`

```csharp
using System.ComponentModel.DataAnnotations;

namespace AuthService.Domain.Entities;

public class Role
{
    [Key]
    [MaxLength(16)]
    public string Id { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(255)]
    public string Description { get; set; } = string.Empty;

    // Relación
    public ICollection<UserRole> UserRoles { get; set; } = [];
}
```

### 2.6 Crear ENTIDAD User - `src/AuthService.Domain/Entities/User.cs`

```csharp
using System.ComponentModel.DataAnnotations;

namespace AuthService.Domain.Entities;

public class User
{
    [Key]
    [MaxLength(16)]
    public string Id { get; set; } = string.Empty;

    [Required(ErrorMessage = "El nombre es obligatorio.")]
    [MaxLength(25)]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "El apellido es obligatorio.")]
    [MaxLength(25)]
    public string Surname { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string Username { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [MaxLength(150)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MaxLength(255)]
    public string Password { get; set; } = string.Empty; // Siempre hasheada

    public bool Status { get; set; } = false;

    [Required]
    public DateTime CreatedAt { get; set; }

    [Required]
    public DateTime UpdatedAt { get; set; }

    // Relaciones de navegación
    public UserProfile UserProfile { get; set; } = null!;
    public ICollection<UserRole> UserRoles { get; set; } = [];
    public UserEmail UserEmail { get; set; } = null!;
    public UserPasswordReset UserPasswordReset { get; set; } = null!;
}
```

### 2.7 Crear ENTIDAD UserProfile - `src/AuthService.Domain/Entities/UserProfile.cs`

```csharp
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AuthService.Domain.Entities;

public class UserProfile
{
    [Key]
    [MaxLength(16)]
    public string Id { get; set; } = string.Empty;

    [Required]
    [MaxLength(16)]
    [ForeignKey(nameof(User))]
    public string UserId { get; set; } = string.Empty;

    public string? ProfilePictureUrl { get; set; }

    public string? Bio { get; set; }

    public DateTime? DateOfBirth { get; set; }

    // Relación
    public User User { get; set; } = null!;
}
```

### 2.8 Crear ENTIDAD UserEmail - `src/AuthService.Domain/Entities/UserEmail.cs`

```csharp
using System.ComponentModel.DataAnnotations;

namespace AuthService.Domain.Entities;

public class UserEmail
{
    [Key]
    [MaxLength(16)]
    public string Id { get; set; } = string.Empty;

    [Required]
    [MaxLength(16)]
    public string UserId { get; set; } = string.Empty;

    [Required]
    public bool EmailVerified { get; set; } = false;

    [MaxLength(256)]
    public string? EmailVerificationToken { get; set; }

    public DateTime? EmailVerificationTokenExpiry { get; set; }

    [Required]
    public User User { get; set; } = null!;
}
```

### 2.9 Crear ENTIDAD UserPasswordReset - `src/AuthService.Domain/Entities/UserPasswordReset.cs`

```csharp
using System.ComponentModel.DataAnnotations;

namespace AuthService.Domain.Entities;

public class UserPasswordReset
{
    [Key]
    [MaxLength(16)]
    public string Id { get; set; } = string.Empty;

    [Required]
    [MaxLength(16)]
    public string UserId { get; set; } = string.Empty;

    [MaxLength(256)]
    public string? PasswordResetToken { get; set; }

    public DateTime? PasswordResetTokenExpiry { get; set; }

    [Required]
    public User User { get; set; } = null!;
}
```

### 2.10 Crear ENTIDAD UserRole - `src/AuthService.Domain/Entities/UserRole.cs`

```csharp
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AuthService.Domain.Entities;

public class UserRole
{
    [Key]
    [MaxLength(16)]
    public string Id { get; set; } = string.Empty;

    [Required]
    [MaxLength(16)]
    [ForeignKey(nameof(User))]
    public string UserId { get; set; } = string.Empty;

    [Required]
    [MaxLength(16)]
    [ForeignKey(nameof(Role))]
    public string RoleId { get; set; } = string.Empty;

    [Required]
    public DateTime AssignedAt { get; set; }

    // Relaciones
    public User User { get; set; } = null!;
    public Role Role { get; set; } = null!;
}
```

### 2.11 Crear INTERFACES DE REPOSITORIO - `src/AuthService.Domain/Interfaces/`

**IUserRepository.cs**

```csharp
using AuthService.Domain.Entities;

namespace AuthService.Domain.Interfaces;

public interface IUserRepository
{
    Task<User> GetByIdAsync(string id);
    Task<User?> GetByEmailAsync(string email);
    Task<User?> GetByUsernameAsync(string username);
    Task<User?> GetByEmailVerificationTokenAsync(string token);
    Task<User?> GetByPasswordResetTokenAsync(string token);
    Task<User> CreateAsync(User user);
    Task<User> UpdateAsync(User user);
    Task<bool> DeleteAsync(string id);
    Task<bool> ExistsByEmailAsync(string email);
    Task<bool> ExistsByUsernameAsync(string username);
    Task UpdateUserRoleAsync(string userId, string roleId);
}
```

**IRoleRepository.cs**

```csharp
using AuthService.Domain.Entities;

namespace AuthService.Domain.Interfaces;

public interface IRoleRepository
{
    Task<Role?> GetByNameAsync(string roleName);
    Task<int> CountUsersInRoleAsync(string roleName);
    Task<IReadOnlyList<User>> GetUsersByRoleAsync(string roleName);
    Task<IReadOnlyList<string>> GetUserRoleNamesAsync(string userId);
}
```

### 3.2 Crear UuidGenerator - `src/AuthService.Application/Services/UuidGenerator.cs`

```csharp
using System.Security.Cryptography;
using System.Text;

namespace AuthService.Application.Services;

public static class UuidGenerator
{
    // Caracteres seguros (sin 0, O, I, l para evitar confusión)
    private static readonly string Alphabet = "123456789ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz";

    public static string GenerateShortUUID()
    {
        using var rng = RandomNumberGenerator.Create();
        var bytes = new byte[12];
        rng.GetBytes(bytes);

        var result = new StringBuilder(12);
        for (int i = 0; i < 12; i++)
        {
            result.Append(Alphabet[bytes[i] % Alphabet.Length]);
        }

        return result.ToString();
    }

    public static string GenerateUserId()
    {
        return $"usr_{GenerateShortUUID()}";
    }

    public static string GenerateRoleId()
    {
        return $"rol_{GenerateShortUUID()}";
    }

    public static bool IsValidUserId(string? id)
    {
        if (string.IsNullOrEmpty(id))
            return false;

        if (id.Length != 16 || !id.StartsWith("usr_"))
            return false;

        var idPart = id[4..];
        return idPart.All(c => Alphabet.Contains(c));
    }
}
```

### 3.3 Crear TokenGenerator - `src/AuthService.Application/Services/TokenGenerator.cs`

```csharp
using System.Security.Cryptography;

namespace AuthService.Application.Services;

public static class TokenGenerator
{
    public static string GenerateEmailVerificationToken()
    {
        return GenerateSecureToken(32);
    }

    public static string GeneratePasswordResetToken()
    {
        return GenerateSecureToken(32);
    }

    private static string GenerateSecureToken(int length)
    {
        using var rng = RandomNumberGenerator.Create();
        var bytes = new byte[length];
        rng.GetBytes(bytes);
        return Convert.ToBase64String(bytes)
            .Replace("+", "-")
            .Replace("/", "_")
            .Replace("=", "");
    }
}
```

---

## PASO 3: CONFIGURAR LA CAPA PERSISTENCE (Base de Datos)

### 3.1 Estructura de carpetas

```bash
mkdir -p src/AuthService.Persistence/Data
mkdir -p src/AuthService.Persistence/Repositories
mkdir -p src/AuthService.Persistence/Migrations
```

### 3.2 Crear DbContext - `src/AuthService.Persistence/Data/ApplicationDbContext.cs`

```csharp
using AuthService.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System.Linq;

namespace AuthService.Persistence.Data;

public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
    : DbContext(options)
{
    public DbSet<User> Users { get; set; }
    public DbSet<UserProfile> UserProfiles { get; set; }
    public DbSet<Role> Roles { get; set; }
    public DbSet<UserRole> UserRoles { get; set; }
    public DbSet<UserEmail> UserEmails { get; set; }
    public DbSet<UserPasswordReset> UserPasswordResets { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Convertir nombres de tablas a snake_case
        foreach (var entity in modelBuilder.Model.GetEntityTypes())
        {
            var tableName = entity.GetTableName();
            if (!string.IsNullOrEmpty(tableName))
            {
                entity.SetTableName(ToSnakeCase(tableName));
            }

            foreach (var property in entity.GetProperties())
            {
                var columnName = property.GetColumnName();
                if (!string.IsNullOrEmpty(columnName))
                {
                    property.SetColumnName(ToSnakeCase(columnName));
                }
            }
        }

        // Configuraciones específicas
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Email).IsUnique();
            entity.HasIndex(e => e.Username).IsUnique();

            entity.HasOne(e => e.UserProfile)
                .WithOne(p => p.User)
                .HasForeignKey<UserProfile>(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(e => e.UserRoles)
                .WithOne(ur => ur.User)
                .HasForeignKey(ur => ur.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.UserEmail)
                .WithOne(ue => ue.User)
                .HasForeignKey<UserEmail>(ue => ue.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.UserPasswordReset)
                .WithOne(upr => upr.User)
                .HasForeignKey<UserPasswordReset>(upr => upr.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<UserRole>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.UserId, e.RoleId }).IsUnique();
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Name).IsUnique();
        });
    }

    private static string ToSnakeCase(string input)
    {
        return string.Concat(input.Select((x, i) => i > 0 && char.IsUpper(x)
            ? "_" + x.ToString().ToLower()
            : x.ToString().ToLower()));
    }
}
```

### 3.4 Crear REPOSITORIO de User - `src/AuthService.Persistence/Repositories/UserRepository.cs`

```csharp
using AuthService.Application.Services;
using AuthService.Domain.Entities;
using AuthService.Domain.Interfaces;
using AuthService.Persistence.Data;
using Microsoft.EntityFrameworkCore;

namespace AuthService.Persistence.Repositories;

public class UserRepository(ApplicationDbContext context) : IUserRepository
{
    public async Task<User> GetByIdAsync(string id)
    {
        var user = await context.Users
            .Include(u => u.UserProfile)
            .Include(u => u.UserEmail)
            .Include(u => u.UserPasswordReset)
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == id);
        return user ?? throw new InvalidOperationException($"User with id {id} not found.");
    }

    public async Task<User?> GetByEmailAsync(string email)
    {
        return await context.Users
            .Include(u => u.UserProfile)
            .Include(u => u.UserEmail)
            .Include(u => u.UserPasswordReset)
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => EF.Functions.ILike(u.Email, email));
    }

    public async Task<User?> GetByUsernameAsync(string username)
    {
        return await context.Users
            .Include(u => u.UserProfile)
            .Include(u => u.UserEmail)
            .Include(u => u.UserPasswordReset)
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => EF.Functions.ILike(u.Username, username));
    }

    public async Task<User?> GetByEmailVerificationTokenAsync(string token)
    {
        return await context.Users
            .Include(u => u.UserProfile)
            .Include(u => u.UserEmail)
            .Include(u => u.UserPasswordReset)
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.UserEmail != null &&
                                    u.UserEmail.EmailVerificationToken == token &&
                                    u.UserEmail.EmailVerificationTokenExpiry > DateTime.UtcNow);
    }

    public async Task<User?> GetByPasswordResetTokenAsync(string token)
    {
        return await context.Users
            .Include(u => u.UserProfile)
            .Include(u => u.UserEmail)
            .Include(u => u.UserPasswordReset)
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.UserPasswordReset != null &&
                                    u.UserPasswordReset.PasswordResetToken == token &&
                                    u.UserPasswordReset.PasswordResetTokenExpiry > DateTime.UtcNow);
    }

    public async Task<User> CreateAsync(User user)
    {
        context.Users.Add(user);
        await context.SaveChangesAsync();
        return await GetByIdAsync(user.Id);
    }

    public async Task<User> UpdateAsync(User user)
    {
        await context.SaveChangesAsync();
        return await GetByIdAsync(user.Id);
    }

    public async Task<bool> DeleteAsync(string id)
    {
        var user = await GetByIdAsync(id);
        context.Users.Remove(user);
        await context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ExistsByEmailAsync(string email)
    {
        return await context.Users
            .AnyAsync(u => EF.Functions.ILike(u.Email, email));
    }

    public async Task<bool> ExistsByUsernameAsync(string username)
    {
        return await context.Users
            .AnyAsync(u => EF.Functions.ILike(u.Username, username));
    }

    public async Task UpdateUserRoleAsync(string userId, string roleId)
    {
        var existingRoles = await context.UserRoles
            .Where(ur => ur.UserId == userId)
            .ToListAsync();

        context.UserRoles.RemoveRange(existingRoles);

        var newUserRole = new UserRole
        {
            Id = UuidGenerator.GenerateUserId(),
            UserId = userId,
            RoleId = roleId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        context.UserRoles.Add(newUserRole);
        await context.SaveChangesAsync();
    }
}
```

### 3.4 Crear REPOSITORIO de Role - `src/AuthService.Persistence/Repositories/RoleRepository.cs`

```csharp
using AuthService.Domain.Entities;
using AuthService.Domain.Interfaces;
using AuthService.Persistence.Data;
using Microsoft.EntityFrameworkCore;

namespace AuthService.Persistence.Repositories;

public class RoleRepository(ApplicationDbContext context) : IRoleRepository
{
    public async Task<Role?> GetByNameAsync(string roleName)
    {
        return await context.Roles
            .Include(r => r.UserRoles)
            .FirstOrDefaultAsync(r => r.Name == roleName);
    }

    public async Task<int> CountUsersInRoleAsync(string roleName)
    {
        return await context.UserRoles
            .Where(ur => ur.Role.Name == roleName)
            .CountAsync();
    }

    public async Task<IReadOnlyList<User>> GetUsersByRoleAsync(string roleName)
    {
        return await context.UserRoles
            .Where(ur => ur.Role.Name == roleName)
            .Select(ur => ur.User)
            .Include(u => u.UserProfile)
            .Include(u => u.UserEmail)
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .ToListAsync()
            .ContinueWith(t => (IReadOnlyList<User>)t.Result);
    }

    public async Task<IReadOnlyList<string>> GetUserRoleNamesAsync(string userId)
    {
        return await context.UserRoles
            .Where(ur => ur.UserId == userId)
            .Select(ur => ur.Role.Name)
            .ToListAsync()
            .ContinueWith(t => (IReadOnlyList<string>)t.Result);
    }
}
```

### 3.5 Configurar conexión a BD en `appsettings.json` (Api)

```json
{
    "ConnectionStrings": {
        "DefaultConnection": "Host=localhost;Database=auth_service;Username=postgres;Password=Root1234!;Port=5432"
    },
    "Logging": {
        "LogLevel": {
            "Default": "Information"
        }
    },
    "AllowedHosts": "*"
}
```

### 3.6 Crear migración inicial

```bash
cd src/AuthService.Api

# Crear la migración
dotnet ef migrations add InitialCreate \
  --project ../AuthService.Persistence/AuthService.Persistence.csproj \
  --startup-project .

# Aplicar la migración a la BD
dotnet ef database update \
  --project ../AuthService.Persistence/AuthService.Persistence.csproj \
  --startup-project .

cd ../..
```

---

## PASO 4: CREAR DTOs Y EXCEPCIONES EN APPLICATION

### 4.1 Estructura de carpetas

```bash
mkdir -p src/AuthService.Application/DTOs
mkdir -p src/AuthService.Application/DTOs/Email
mkdir -p src/AuthService.Application/Exceptions
mkdir -p src/AuthService.Application/Interfaces
mkdir -p src/AuthService.Application/Services
mkdir -p src/AuthService.Application/Validators
mkdir -p src/AuthService.Application/Extensions
```

### 5.4 Crear servicio de Email - `src/AuthService.Application/Services/EmailService.cs`

```csharp
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using AuthService.Application.Interfaces;

namespace AuthService.Application.Services;

public class EmailService(IConfiguration configuration, ILogger<EmailService> logger) : IEmailService
{
    public async Task SendEmailVerificationAsync(string email, string username, string token)
    {
        var subject = "Verify your email address";
        var verificationUrl = $"{configuration["AppSettings:FrontendUrl"]}/verify-email?token={token}";

        var body = $@
            """
            <h2>Welcome {username}!</h2>
            <p>Please verify your email address by clicking the link below:</p>
            <a href='{verificationUrl}' style='background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>
                Verify Email
            </a>
            <p>If you cannot click the link, copy and paste this URL into your browser:</p>
            <p>{verificationUrl}</p>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't create an account, please ignore this email.</p>
            """;

        await SendEmailAsync(email, subject, body);
    }

    public async Task SendPasswordResetAsync(string email, string username, string token)
    {
        var subject = "Reset your password";
        var resetUrl = $"{configuration["AppSettings:FrontendUrl"]}/reset-password?token={token}";

        var body = $@
            """
            <h2>Password Reset Request</h2>
            <p>Hello {username},</p>
            <p>You requested to reset your password. Click the link below to reset it:</p>
            <a href='{resetUrl}' style='background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>
                Reset Password
            </a>
            <p>If you cannot click the link, copy and paste this URL into your browser:</p>
            <p>{resetUrl}</p>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
            """;

        await SendEmailAsync(email, subject, body);
    }

    public async Task SendWelcomeEmailAsync(string email, string username)
    {
        var subject = "Welcome to AuthDotnet!";

        var body = $@
            """
            <h2>Welcome to AuthDotnet, {username}!</h2>
            <p>Your account has been successfully verified and activated.</p>
            <p>You can now enjoy all the features of our platform.</p>
            <p>If you have any questions, feel free to contact our support team.</p>
            <p>Thank you for joining us!</p>
            """;

        await SendEmailAsync(email, subject, body);
    }

    private async Task SendEmailAsync(string to, string subject, string body)
    {
        var smtpSettings = configuration.GetSection("SmtpSettings");

        try
        {
            var enabled = bool.Parse(smtpSettings["Enabled"] ?? "true");
            if (!enabled)
            {
                logger.LogInformation("Email disabled in configuration. Skipping send");
                return;
            }

            var host = smtpSettings["Host"];
            var portString = smtpSettings["Port"];
            var username = smtpSettings["Username"];
            var password = smtpSettings["Password"];
            var fromEmail = smtpSettings["FromEmail"];
            var fromName = smtpSettings["FromName"];

            if (string.IsNullOrEmpty(host) || string.IsNullOrEmpty(username) || string.IsNullOrEmpty(password))
            {
                logger.LogError("SMTP settings are not properly configured");
                throw new InvalidOperationException("SMTP settings are not properly configured");
            }

            var port = int.Parse(portString ?? "587");

            using var client = new SmtpClient();

            var timeoutMs = int.Parse(smtpSettings["Timeout"] ?? "30000");
            client.Timeout = timeoutMs;

            try
            {
                var useImplicitSsl = bool.Parse(smtpSettings["UseImplicitSsl"] ?? "false");

                if (useImplicitSsl || port == 465)
                {
                    await client.ConnectAsync(host, port, SecureSocketOptions.SslOnConnect);
                }
                else if (port == 587)
                {
                    await client.ConnectAsync(host, port, SecureSocketOptions.StartTls);
                }
                else
                {
                    await client.ConnectAsync(host, port, SecureSocketOptions.Auto);
                }

                await client.AuthenticateAsync(username, password);

                var message = new MimeMessage();
                message.From.Add(new MailboxAddress(fromName, fromEmail));
                message.To.Add(new MailboxAddress("", to));
                message.Subject = subject;
                message.Body = new TextPart("html") { Text = body };

                await client.SendAsync(message);
                logger.LogInformation("Email sent successfully");

                await client.DisconnectAsync(true);
                logger.LogInformation("Email pipeline completed");
            }
            catch (MailKit.Security.AuthenticationException authEx)
            {
                logger.LogError(authEx, "Gmail authentication failed. Check app password.");
                throw new InvalidOperationException($"Gmail authentication failed: {authEx.Message}. Please check your app password.", authEx);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to send email");
                throw;
            }
            logger.LogInformation("Email processed");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to send email");

            var useFallback = bool.Parse(smtpSettings["UseFallback"] ?? "false");
            if (useFallback)
            {
                logger.LogWarning("Using email fallback");
                return;
            }

            throw new InvalidOperationException($"Failed to send email: {ex.Message}", ex);
        }
    }
}
```

    public string VerificationCode { get; set; } = string.Empty;

}

````

**src/AuthService.Application/DTOs/Email/ResendVerificationDto.cs**
```csharp
using System.ComponentModel.DataAnnotations;

namespace AuthService.Application.DTOs.Email;

public class ResendVerificationDto
{
    [Required(ErrorMessage = "El email es obligatorio")]
    public string Email { get; set; } = string.Empty;
}
````

**src/AuthService.Application/DTOs/Email/ForgotPasswordDto.cs**

```csharp
using System.ComponentModel.DataAnnotations;

namespace AuthService.Application.DTOs.Email;

public class ForgotPasswordDto
{
    [Required(ErrorMessage = "El email es obligatorio")]
    [EmailAddress(ErrorMessage = "El email debe ser válido")]
    public string Email { get; set; } = string.Empty;
}
```

**src/AuthService.Application/DTOs/Email/ResetPasswordDto.cs**

```csharp
using System.ComponentModel.DataAnnotations;

namespace AuthService.Application.DTOs.Email;

public class ResetPasswordDto
{
    [Required(ErrorMessage = "El email es obligatorio")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "El token es obligatorio")]
    public string ResetToken { get; set; } = string.Empty;

    [Required(ErrorMessage = "La nueva contraseña es obligatoria")]
    [MinLength(8, ErrorMessage = "La contraseña debe tener al menos 8 caracteres")]
    public string NewPassword { get; set; } = string.Empty;
}
```

**src/AuthService.Application/DTOs/Email/EmailResponseDto.cs**

```csharp
namespace AuthService.Application.DTOs.Email;

public class EmailResponseDto
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
}
```

### 4.5 Crear DTOs DE RESPUESTA

**src/AuthService.Application/DTOs/AuthResponseDto.cs**

```csharp
namespace AuthService.Application.DTOs;

public class AuthResponseDto
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public UserResponseDto? Data { get; set; }
    public string? Token { get; set; }
}
```

**src/AuthService.Application/DTOs/UserResponseDto.cs**

```csharp
namespace AuthService.Application.DTOs;

public class UserResponseDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Surname { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public bool Status { get; set; }
    public string? ProfilePictureUrl { get; set; }
    public List<string> Roles { get; set; } = [];
    public DateTime CreatedAt { get; set; }
}
```

**src/AuthService.Application/DTOs/RegisterResponseDto.cs**

```csharp
namespace AuthService.Application.DTOs;

public class RegisterResponseDto
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public UserResponseDto? Data { get; set; }
}
```

**src/AuthService.Application/DTOs/GetProfileByIdDto.cs**

```csharp
using System.ComponentModel.DataAnnotations;

namespace AuthService.Application.DTOs;

public class GetProfileByIdDto
{
    [Required(ErrorMessage = "El userId es requerido")]
    public string UserId { get; set; } = string.Empty;
}
```

**src/AuthService.Application/DTOs/UpdateUserRoleDto.cs**

```csharp
using System.ComponentModel.DataAnnotations;

namespace AuthService.Application.DTOs;

public class UpdateUserRoleDto
{
    [Required(ErrorMessage = "El nombre de rol es obligatorio")]
    public string RoleName { get; set; } = string.Empty;
}
```

### 4.6 Crear INTERFACES DE SERVICIOS

**src/AuthService.Application/Interfaces/IAuthService.cs**

```csharp
using AuthService.Application.DTOs;
using AuthService.Application.DTOs.Email;

namespace AuthService.Application.Interfaces;

public interface IAuthService
{
    Task<RegisterResponseDto> RegisterAsync(RegisterDto registerDto);
    Task<AuthResponseDto> LoginAsync(LoginDto loginDto);
    Task<UserResponseDto> GetUserByIdAsync(string userId);
    Task<EmailResponseDto> VerifyEmailAsync(VerifyEmailDto verifyEmailDto);
    Task<EmailResponseDto> ResendVerificationEmailAsync(ResendVerificationDto resendDto);
    Task<EmailResponseDto> ForgotPasswordAsync(ForgotPasswordDto forgotPasswordDto);
    Task<EmailResponseDto> ResetPasswordAsync(ResetPasswordDto resetPasswordDto);
}
```

**src/AuthService.Application/Interfaces/IPasswordHashService.cs**

```csharp
namespace AuthService.Application.Interfaces;

public interface IPasswordHashService
{
    string HashPassword(string password);
    bool VerifyPassword(string password, string hash);
}
```

**src/AuthService.Application/Interfaces/IJwtTokenService.cs**

```csharp
using AuthService.Domain.Entities;

namespace AuthService.Application.Interfaces;

public interface IJwtTokenService
{
    string GenerateToken(User user);
}
```

**src/AuthService.Application/Interfaces/IEmailService.cs**

```csharp
using AuthService.Application.DTOs.Email;

namespace AuthService.Application.Interfaces;

public interface IEmailService
{
    Task SendEmailVerificationAsync(string email, string username, string token);
    Task SendPasswordResetAsync(string email, string username, string token);
    Task SendWelcomeEmailAsync(string email, string username);
}
```

**src/AuthService.Application/Interfaces/IFileData.cs**

```csharp
namespace AuthService.Application.Interfaces;

public interface IFileData
{
    string FileName { get; }
    byte[] Data { get; }
    long Size { get; }
    string ContentType { get; }
}
```

**src/AuthService.Application/Interfaces/ICloudinaryService.cs**

```csharp
namespace AuthService.Application.Interfaces;

public interface ICloudinaryService
{
    Task<string> UploadImageAsync(IFileData file, string fileName);
    Task DeleteImageAsync(string publicId);
    string GetDefaultAvatarUrl();
    string GetFullImageUrl(string imagePath);
}
```

**src/AuthService.Application/Interfaces/IUserManagementService.cs**

```csharp
using AuthService.Application.DTOs;

namespace AuthService.Application.Interfaces;

public interface IUserManagementService
{
    Task<UserResponseDto> UpdateUserRoleAsync(string userId, string roleName);
    Task<IReadOnlyList<string>> GetUserRolesAsync(string userId);
    Task<IReadOnlyList<UserResponseDto>> GetUsersByRoleAsync(string roleName);
}
```

---

## PASO 5: IMPLEMENTAR SERVICIOS EN APPLICATION

### 5.1 Crear servicio de hash de contraseñas - `src/AuthService.Application/Services/PasswordHashService.cs`

```csharp
using AuthService.Application.Interfaces;
using Microsoft.AspNetCore.Identity;

namespace AuthService.Application.Services;

public class PasswordHashService : IPasswordHashService
{
    private readonly PasswordHasher<object> _hasher = new();

    public string HashPassword(string password)
    {
        return _hasher.HashPassword(null!, password);
    }

    public bool VerifyPassword(string password, string hash)
    {
        var result = _hasher.VerifyHashedPassword(null!, hash, password);
        return result == PasswordVerificationResult.Success;
    }
}
```

### 5.2 Crear servicio de JWT - `src/AuthService.Application/Services/JwtTokenService.cs`

```csharp
using AuthService.Application.Interfaces;
using AuthService.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace AuthService.Application.Services;

public class JwtTokenService(IConfiguration configuration) : IJwtTokenService
{
    private readonly IConfiguration _configuration = configuration;

    public string GenerateToken(User user, IEnumerable<string> roles)
    {
        var jwtSettings = _configuration.GetSection("JwtSettings");
        var secretKey = jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JWT SecretKey not configured");
        var issuer = jwtSettings["Issuer"] ?? "AuthService";
        var audience = jwtSettings["Audience"] ?? "AuthService";
        var expiryMinutes = int.Parse(jwtSettings["ExpiryInMinutes"] ?? "30");

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new Claim("sub", user.Id),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, user.Username)
        };

        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string? ExtractUserIdFromToken(string token)
    {
        var handler = new JwtSecurityTokenHandler();
        try
        {
            var jwtToken = handler.ReadJwtToken(token);
            return jwtToken.Claims.FirstOrDefault(c => c.Type == "sub")?.Value;
        }
        catch
        {
            return null;
        }
    }
}
```

### 5.1 Crear servicio de hash de contraseñas - `src/AuthService.Application/Services/PasswordHashService.cs`

```csharp
using AuthService.Application.Interfaces;
using Konscious.Security.Cryptography;
using System.Security.Cryptography;
using System.Text;

namespace AuthService.Application.Services;

public class PasswordHashService : IPasswordHashService
{
    private const int SaltSize = 16;
    private const int HashSize = 32;
    private const int Iterations = 2;
    private const int Memory = 102400; // KB
    private const int Parallelism = 8;

    public string HashPassword(string password)
    {
        var salt = new byte[SaltSize];
        using (var rng = RandomNumberGenerator.Create())
        {
            rng.GetBytes(salt);
        }

        var argon2 = new Argon2id(Encoding.UTF8.GetBytes(password))
        {
            Salt = salt,
            DegreeOfParallelism = Parallelism,
            Iterations = Iterations,
            MemorySize = Memory
        };

        var hash = argon2.GetBytes(HashSize);

        var saltBase64 = Convert.ToBase64String(salt);
        var hashBase64 = Convert.ToBase64String(hash);

        return $"$argon2id$v=19$m={Memory},t={Iterations},p={Parallelism}${saltBase64}${hashBase64}";
    }

    public bool VerifyPassword(string password, string hashedPassword)
    {
        try
        {
            if (hashedPassword.StartsWith("$argon2id$"))
            {
                return VerifyArgon2StandardFormat(password, hashedPassword);
            }
            return VerifyLegacyFormat(password, hashedPassword);
        }
        catch
        {
            return false;
        }
    }

    private bool VerifyArgon2StandardFormat(string password, string hashedPassword)
    {
        var argon2Verifier = new Argon2id(Encoding.UTF8.GetBytes(password));

        var parts = hashedPassword.Split('$');
        if (parts.Length != 6) return false;

        var paramsPart = parts[3];
        var saltBase64 = parts[4];
        var hashBase64 = parts[5];

        var parameters = paramsPart.Split(',');
        var memory = int.Parse(parameters[0].Split('=')[1]);
        var iterations = int.Parse(parameters[1].Split('=')[1]);
        var parallelism = int.Parse(parameters[2].Split('=')[1]);

        var salt = Convert.FromBase64String(saltBase64);
        var expectedHash = Convert.FromBase64String(hashBase64);

        argon2Verifier.Salt = salt;
        argon2Verifier.DegreeOfParallelism = parallelism;
        argon2Verifier.Iterations = iterations;
        argon2Verifier.MemorySize = memory;

        var computedHash = argon2Verifier.GetBytes(expectedHash.Length);

        return expectedHash.SequenceEqual(computedHash);
    }

    private bool VerifyLegacyFormat(string password, string hashedPassword)
    {
        var hashBytes = Convert.FromBase64String(hashedPassword);
        var salt = new byte[SaltSize];
        var hash = new byte[HashSize];

        Array.Copy(hashBytes, 0, salt, 0, SaltSize);
        Array.Copy(hashBytes, SaltSize, hash, 0, HashSize);

        var argon2 = new Argon2id(Encoding.UTF8.GetBytes(password))
        {
            Salt = salt,
            DegreeOfParallelism = Parallelism,
            Iterations = Iterations,
            MemorySize = Memory
        };

        var computedHash = argon2.GetBytes(HashSize);
        return computedHash.SequenceEqual(hash);
    }
}
```

### 5.2 Crear servicio de JWT - `src/AuthService.Application/Services/JwtTokenService.cs`

```csharp
using AuthService.Application.Interfaces;
using AuthService.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace AuthService.Application.Services;

public class JwtTokenService(IConfiguration configuration) : IJwtTokenService
{
    public string GenerateToken(User user)
    {
        var jwtSettings = configuration.GetSection("JwtSettings");
        var secretKey = jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JWT SecretKey not configured");
        var issuer = jwtSettings["Issuer"] ?? "AuthDotnet";
        var audience = jwtSettings["Audience"] ?? "AuthDotnet";
        var expiryInMinutes = int.Parse(jwtSettings["ExpiryInMinutes"] ?? "30");

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var role = user.UserRoles?.FirstOrDefault()?.Role?.Name ?? "USER_ROLE";

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim(JwtRegisteredClaimNames.Iat, DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64),
            new Claim("role", role)
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expiryInMinutes),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
```

            UserRoles =
            [
                new Domain.Entities.UserRole
                {
                    Id = userRoleId,
                    UserId = userId,
                    RoleId = defaultRole.Id
                }
            ]
        };

        var createdUser = await userRepository.CreateAsync(user);

        logger.LogUserRegistered(createdUser.Username);

        _ = Task.Run(async () =>
        {
            try
            {
                await emailService.SendEmailVerificationAsync(createdUser.Email, createdUser.Username, emailVerificationToken);
                logger.LogInformation("Verification email sent");
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to send verification email");
            }
        });

        return new RegisterResponseDto
        {
            Success = true,
            User = MapToUserResponseDto(createdUser),
            Message = "Usuario registrado exitosamente. Por favor, verifica tu email para activar la cuenta.",
            EmailVerificationRequired = true
        };
    }

    public async Task<AuthResponseDto> LoginAsync(LoginDto loginDto)
    {
        User? user = null;

        if (loginDto.EmailOrUsername.Contains('@'))
        {
            user = await userRepository.GetByEmailAsync(loginDto.EmailOrUsername.ToLowerInvariant());
        }
        else
        {
            user = await userRepository.GetByUsernameAsync(loginDto.EmailOrUsername);
        }

        if (user == null)
        {
            logger.LogFailedLoginAttempt();
            throw new UnauthorizedAccessException("Invalid credentials");
        }

        if (!user.Status)
        {
            logger.LogFailedLoginAttempt();
            throw new UnauthorizedAccessException("User account is disabled");
        }

        if (!passwordHashService.VerifyPassword(loginDto.Password, user.Password))
        {
            logger.LogFailedLoginAttempt();
            throw new UnauthorizedAccessException("Invalid credentials");
        }

        logger.LogUserLoggedIn();

        var token = jwtTokenService.GenerateToken(user);
        var expiryMinutes = int.Parse(configuration["JwtSettings:ExpiryInMinutes"] ?? "30");

        return new AuthResponseDto
        {
            Success = true,
            Message = "Login exitoso",
            Token = token,
            UserDetails = MapToUserDetailsDto(user),
            ExpiresAt = DateTime.UtcNow.AddMinutes(expiryMinutes)
        };
    }

    private UserResponseDto MapToUserResponseDto(User user)
    {
        var userRole = user.UserRoles.FirstOrDefault()?.Role?.Name ?? RoleConstants.USER_ROLE;
        return new UserResponseDto
        {
            Id = user.Id,
            Name = user.Name,
            Surname = user.Surname,
            Username = user.Username,
            Email = user.Email,
            ProfilePicture = _cloudinaryService.GetFullImageUrl(user.UserProfile?.ProfilePicture ?? string.Empty),
            Phone = user.UserProfile?.Phone ?? string.Empty,
            Role = userRole,
            Status = user.Status,
            IsEmailVerified = user.UserEmail?.EmailVerified ?? false,
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt
        };
    }

    private UserDetailsDto MapToUserDetailsDto(User user)
    {
        return new UserDetailsDto
        {
            Id = user.Id,
            Username = user.Username,
            ProfilePicture = _cloudinaryService.GetFullImageUrl(user.UserProfile?.ProfilePicture ?? string.Empty),
            Role = user.UserRoles.FirstOrDefault()?.Role?.Name ?? RoleConstants.USER_ROLE
        };
    }

    public async Task<EmailResponseDto> VerifyEmailAsync(VerifyEmailDto verifyEmailDto)
    {
        var user = await userRepository.GetByEmailVerificationTokenAsync(verifyEmailDto.Token);
        if (user == null || user.UserEmail == null)
        {
            return new EmailResponseDto
            {
                Success = false,
                Message = "Invalid or expired verification token"
            };
        }

        user.UserEmail.EmailVerified = true;
        user.Status = true;
        user.UserEmail.EmailVerificationToken = null;
        user.UserEmail.EmailVerificationTokenExpiry = null;

        await userRepository.UpdateAsync(user);

        try
        {
            await emailService.SendWelcomeEmailAsync(user.Email, user.Username);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to send welcome email to {Email}", user.Email);
        }

        logger.LogInformation("Email verified successfully for user {Username}", user.Username);

        return new EmailResponseDto
        {
            Success = true,
            Message = "Email verificado exitosamente",
            Data = new
            {
                email = user.Email,
                verified = true
            }
        };
    }

    public async Task<EmailResponseDto> ResendVerificationEmailAsync(ResendVerificationDto resendDto)
    {
        var user = await userRepository.GetByEmailAsync(resendDto.Email);
        if (user == null || user.UserEmail == null)
        {
            return new EmailResponseDto
            {
                Success = false,
                Message = "Usuario no encontrado",
                Data = new { email = resendDto.Email, sent = false }
            };
        }

        if (user.UserEmail.EmailVerified)
        {
            return new EmailResponseDto
            {
                Success = false,
                Message = "El email ya ha sido verificado",
                Data = new { email = user.Email, verified = true }
            };
        }

        var newToken = TokenGenerator.GenerateEmailVerificationToken();
        user.UserEmail.EmailVerificationToken = newToken;
        user.UserEmail.EmailVerificationTokenExpiry = DateTime.UtcNow.AddHours(24);

        await userRepository.UpdateAsync(user);

        try
        {
            await emailService.SendEmailVerificationAsync(user.Email, user.Username, newToken);
            return new EmailResponseDto
            {
                Success = true,
                Message = "Email de verificación enviado exitosamente",
                Data = new { email = user.Email, sent = true }
            };
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to resend verification email to {Email}", user.Email);
            return new EmailResponseDto
            {
                Success = false,
                Message = "Error al enviar el email de verificación",
                Data = new { email = user.Email, sent = false }
            };
        }
    }

    public async Task<EmailResponseDto> ForgotPasswordAsync(ForgotPasswordDto forgotPasswordDto)
    {
        var user = await userRepository.GetByEmailAsync(forgotPasswordDto.Email);
        if (user == null)
        {
            return new EmailResponseDto
            {
                Success = true,
                Message = "Si el email existe, se ha enviado un enlace de recuperación",
                Data = new { email = forgotPasswordDto.Email, initiated = true }
            };
        }

        var resetToken = TokenGenerator.GeneratePasswordResetToken();

        if (user.UserPasswordReset == null)
        {
            user.UserPasswordReset = new UserPasswordReset
            {
                UserId = user.Id,
                PasswordResetToken = resetToken,
                PasswordResetTokenExpiry = DateTime.UtcNow.AddHours(1)
            };
        }
        else
        {
            user.UserPasswordReset.PasswordResetToken = resetToken;
            user.UserPasswordReset.PasswordResetTokenExpiry = DateTime.UtcNow.AddHours(1);
        }

        await userRepository.UpdateAsync(user);

        try
        {
            await emailService.SendPasswordResetAsync(user.Email, user.Username, resetToken);
            logger.LogInformation("Password reset email sent to {Email}", user.Email);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to send password reset email to {Email}", user.Email);
        }

        return new EmailResponseDto
        {
            Success = true,
            Message = "Si el email existe, se ha enviado un enlace de recuperación",
            Data = new { email = forgotPasswordDto.Email, initiated = true }
        };
    }

    public async Task<EmailResponseDto> ResetPasswordAsync(ResetPasswordDto resetPasswordDto)
    {
        var user = await userRepository.GetByPasswordResetTokenAsync(resetPasswordDto.Token);
        if (user == null || user.UserPasswordReset == null)
        {
            return new EmailResponseDto
            {
                Success = false,
                Message = "Token de reset inválido o expirado",
                Data = new { token = resetPasswordDto.Token, reset = false }
            };
        }

        user.Password = passwordHashService.HashPassword(resetPasswordDto.NewPassword);
        user.UserPasswordReset.PasswordResetToken = null;
        user.UserPasswordReset.PasswordResetTokenExpiry = null;

        await userRepository.UpdateAsync(user);

        logger.LogInformation("Password reset successfully for user {Username}", user.Username);

        return new EmailResponseDto
        {
            Success = true,
            Message = "Contraseña actualizada exitosamente",
            Data = new { email = user.Email, reset = true }
        };
    }

    public async Task<UserResponseDto?> GetUserByIdAsync(string userId)
    {
        var user = await userRepository.GetByIdAsync(userId);
        if (user == null)
        {
            return null;
        }

        return MapToUserResponseDto(user);
    }

}

````

### 5.4 Crear servicio de Email - `src/AuthService.Application/Services/EmailService.cs`
```csharp
using AuthService.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Net;
using System.Net.Mail;

namespace AuthService.Application.Services;

public class EmailService(IConfiguration configuration, ILogger<EmailService> logger) : IEmailService
{
    public async Task<bool> SendVerificationEmailAsync(string email, string verificationCode)
    {
        try
        {
            var smtpSettings = configuration.GetSection("SmtpSettings");
            using (var client = new SmtpClient(smtpSettings["Host"], int.Parse(smtpSettings["Port"] ?? "465")))
            {
                client.EnableSsl = bool.Parse(smtpSettings["EnableSsl"] ?? "true");
                client.Credentials = new NetworkCredential(
                    smtpSettings["Username"],
                    smtpSettings["Password"]
                );

                var subject = "Verifica tu email - AuthService";
                var body = $@"
                    <h2>Bienvenido a AuthService</h2>
                    <p>Tu código de verificación es: <strong>{verificationCode}</strong></p>
                    <p>Este código expira en 30 minutos.</p>
                ";

                var mailMessage = new MailMessage(
                    smtpSettings["FromEmail"],
                    email,
                    subject,
                    body
                )
                {
                    IsBodyHtml = true
                };

                await client.SendMailAsync(mailMessage);
                logger.LogInformation($"Verification email sent to {email}");
                return true;
            }
        }
        catch (Exception ex)
        {
            logger.LogError($"Error sending verification email: {ex.Message}");
            return false;
        }
    }

    public async Task<bool> SendPasswordResetEmailAsync(string email, string resetToken)
    {
        try
        {
            var smtpSettings = configuration.GetSection("SmtpSettings");
            var frontendUrl = configuration["AppSettings:FrontendUrl"] ?? "http://localhost:3000";

            using (var client = new SmtpClient(smtpSettings["Host"], int.Parse(smtpSettings["Port"] ?? "465")))
            {
                client.EnableSsl = bool.Parse(smtpSettings["EnableSsl"] ?? "true");
                client.Credentials = new NetworkCredential(
                    smtpSettings["Username"],
                    smtpSettings["Password"]
                );

                var resetLink = $"{frontendUrl}/reset-password?token={resetToken}";
                var subject = "Restablece tu contraseña - AuthService";
                var body = $@"
                    <h2>Restablecimiento de contraseña</h2>
                    <p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
                    <a href='{resetLink}'>Restablecer contraseña</a>
                    <p>Este enlace expira en 1 hora.</p>
                ";

                var mailMessage = new MailMessage(
                    smtpSettings["FromEmail"],
                    email,
                    subject,
                    body
                )
                {
                    IsBodyHtml = true
                };

                await client.SendMailAsync(mailMessage);
                logger.LogInformation($"Password reset email sent to {email}");
                return true;
            }
        }
        catch (Exception ex)
        {
            logger.LogError($"Error sending password reset email: {ex.Message}");
            return false;
        }
    }
}
````

### 5.5 Crear servicio de Cloudinary - `src/AuthService.Application/Services/CloudinaryService.cs`

```csharp
using AuthService.Application.Interfaces;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.Extensions.Configuration;

namespace AuthService.Application.Services;

public class CloudinaryService(IConfiguration configuration) : ICloudinaryService
{
    private readonly Cloudinary _cloudinary = new(new Account(
        configuration["CloudinarySettings:CloudName"],
        configuration["CloudinarySettings:ApiKey"],
        configuration["CloudinarySettings:ApiSecret"]
    ));

    public async Task<string> UploadImageAsync(IFileData imageFile, string fileName)
    {
        try
        {
            using var stream = new MemoryStream(imageFile.Data);

            var folder = configuration["CloudinarySettings:Folder"] ?? "auth_service/profiles";
            var uploadParams = new ImageUploadParams
            {
                File = new FileDescription(imageFile.FileName, stream),
                PublicId = $"{folder}/{fileName}",
                Folder = folder,
                Transformation = new Transformation()
                    .Width(400)
                    .Height(400)
                    .Crop("fill")
                    .Gravity("face")
                    .Quality("auto")
                    .FetchFormat("auto")
            };

            var uploadResult = await _cloudinary.UploadAsync(uploadParams);

            if (uploadResult.Error != null)
            {
                throw new InvalidOperationException($"Error uploading image: {uploadResult.Error.Message}");
            }

            return fileName;
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Failed to upload image to Cloudinary: {ex.Message}", ex);
        }
    }

    public async Task<bool> DeleteImageAsync(string publicId)
    {
        try
        {
            var deleteParams = new DelResParams
            {
                PublicIds = [publicId]
            };

            var result = await _cloudinary.DeleteResourcesAsync(deleteParams);
            return result.Deleted?.ContainsKey(publicId) == true;
        }
        catch
        {
            return false;
        }
    }

    public string GetDefaultAvatarUrl()
    {
        var defaultPath = configuration["CloudinarySettings:DefaultAvatarPath"] ?? "default-avatar_ewzxwx.png";
        if (defaultPath.Contains('/')) return defaultPath.Split('/').Last();
        return defaultPath;
    }

    public string GetFullImageUrl(string imagePath)
    {
        var baseUrl = configuration["CloudinarySettings:BaseUrl"] ?? "https://res.cloudinary.com/dug3apxt3/image/upload/";
        return string.IsNullOrEmpty(imagePath) ? GetDefaultAvatarUrl() : baseUrl + imagePath;
    }
}
```

### 5.6 Crear servicio de Gestión de Usuarios - `src/AuthService.Application/Services/UserManagementService.cs`

```csharp
using AuthService.Application.DTOs;
using AuthService.Application.Interfaces;
using AuthService.Domain.Constants;
using AuthService.Domain.Entities;
using AuthService.Domain.Interfaces;

namespace AuthService.Application.Services;

public class UserManagementService(IUserRepository users, IRoleRepository roles, ICloudinaryService cloudinary) : IUserManagementService
{
    public async Task<UserResponseDto> UpdateUserRoleAsync(string userId, string roleName)
    {
        roleName = roleName?.Trim().ToUpperInvariant() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(userId)) throw new ArgumentException("Invalid userId", nameof(userId));
        if (!RoleConstants.AllowedRoles.Contains(roleName))
            throw new InvalidOperationException($"Role not allowed. Use {RoleConstants.ADMIN_ROLE} or {RoleConstants.USER_ROLE}");

        var user = await users.GetByIdAsync(userId);

        var isUserAdmin = user.UserRoles.Any(r => r.Role.Name == RoleConstants.ADMIN_ROLE);
        if (isUserAdmin && roleName != RoleConstants.ADMIN_ROLE)
        {
            var adminCount = await roles.CountUsersInRoleAsync(RoleConstants.ADMIN_ROLE);

            if (adminCount <= 1)
            {
                throw new InvalidOperationException("Cannot remove the last administrator");
            }
        }

        var role = await roles.GetByNameAsync(roleName)
                       ?? throw new InvalidOperationException($"Role {roleName} not found");

        await users.UpdateUserRoleAsync(userId, role.Id);

        user = await users.GetByIdAsync(userId);

        return new UserResponseDto
        {
            Id = user.Id,
            Name = user.Name,
            Surname = user.Surname,
            Username = user.Username,
            Email = user.Email,
            ProfilePicture = cloudinary.GetFullImageUrl(user.UserProfile?.ProfilePicture ?? string.Empty),
            Phone = user.UserProfile?.Phone ?? string.Empty,
            Role = role.Name,
            Status = user.Status,
            IsEmailVerified = user.UserEmail?.EmailVerified ?? false,
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt
        };
    }

    public async Task<IReadOnlyList<string>> GetUserRolesAsync(string userId)
    {
        var roleNames = await roles.GetUserRoleNamesAsync(userId);
        return roleNames;
    }

    public async Task<IReadOnlyList<UserResponseDto>> GetUsersByRoleAsync(string roleName)
    {
        roleName = roleName?.Trim().ToUpperInvariant() ?? string.Empty;
        var usersInRole = await roles.GetUsersByRoleAsync(roleName);
        return usersInRole.Select(u => new UserResponseDto
        {
            Id = u.Id,
            Name = u.Name,
            Surname = u.Surname,
            Username = u.Username,
            Email = u.Email,
            ProfilePicture = cloudinary.GetFullImageUrl(u.UserProfile?.ProfilePicture ?? string.Empty),
            Phone = u.UserProfile?.Phone ?? string.Empty,
            Role = roleName,
            Status = u.Status,
            IsEmailVerified = u.UserEmail?.EmailVerified ?? false,
            CreatedAt = u.CreatedAt,
            UpdatedAt = u.UpdatedAt
        }).ToList();
    }
}
```

### 5.7 Crear validadores - `src/AuthService.Application/Validators/FileValidator.cs`

```csharp
namespace AuthService.Application.Validators;

public static class FileValidator
{
    private static readonly string[] AllowedExtensions = [".jpg", ".jpeg", ".png", ".gif"];
    private const long MaxFileSize = 5 * 1024 * 1024; // 5MB

    public static (bool, string?) ValidateImage(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return (false, "El archivo está vacío");

        if (file.Length > MaxFileSize)
            return (false, "El archivo excede el tamaño máximo de 5MB");

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(extension))
            return (false, "Solo se permiten imágenes (jpg, jpeg, png, gif)");

        return (true, null);
    }

    public static string GenerateSecureFileName(string originalName)
    {
        var extension = Path.GetExtension(originalName);
        var fileName = Path.GetFileNameWithoutExtension(originalName);
        var timestamp = DateTime.UtcNow.Ticks;
        return $"{fileName}_{timestamp}{extension}";
    }
}
```

### 5.8 Crear extensions de logging - `src/AuthService.Application/Extensions/LoggerExtensions.cs`

```csharp
using Microsoft.Extensions.Logging;

namespace AuthService.Application.Extensions;

public static class LoggerExtensions
{
    public static void LogRegistrationWithExistingEmail(this ILogger logger)
    {
        logger.LogWarning("Attempted registration with existing email address");
    }

    public static void LogRegistrationWithExistingUsername(this ILogger logger)
    {
        logger.LogWarning("Attempted registration with existing username");
    }

    public static void LogSuccessfulLogin(this ILogger logger, string email)
    {
        logger.LogInformation($"Successful login for user: {email}");
    }

    public static void LogFailedLogin(this ILogger logger, string email)
    {
        logger.LogWarning($"Failed login attempt for user: {email}");
    }
}
```

### 5.9 Agregar FormFileAdapter - `src/AuthService.Application/Interfaces/FormFileAdapter.cs`

```csharp
namespace AuthService.Application.Interfaces;

public class FormFileAdapter : IFileData
{
    private readonly IFormFile _file;
    private byte[]? _data;

    public FormFileAdapter(IFormFile file)
    {
        _file = file ?? throw new ArgumentNullException(nameof(file));
    }

    public string FileName => _file.FileName;
    public long Size => _file.Length;
    public string ContentType => _file.ContentType;

    public byte[] Data
    {
        get
        {
            if (_data != null) return _data;

            using var memoryStream = new MemoryStream();
            _file.CopyTo(memoryStream);
            _data = memoryStream.ToArray();
            return _data;
        }
    }
}
```

---

## PASO 6: CONFIGURAR INYECCIÓN DE DEPENDENCIAS Y EXTENSIONS EN API

### 6.1 Crear archivo de extensión - `src/AuthService.Api/Extensions/ServiceCollectionExtensions.cs`

```csharp
using AuthService.Application.Interfaces;
using AuthService.Application.Services;
using AuthService.Domain.Interfaces;
using AuthService.Persistence.Data;
using AuthService.Persistence.Repositories;
using Microsoft.EntityFrameworkCore;

namespace AuthService.Api.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("DefaultConnection"))
                   .UseSnakeCaseNamingConvention());

        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IRoleRepository, RoleRepository>();
        services.AddScoped<IAuthService, Application.Services.AuthService>();
        services.AddScoped<IUserManagementService, UserManagementService>();
        services.AddScoped<IPasswordHashService, PasswordHashService>();
        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddScoped<ICloudinaryService, CloudinaryService>();
        services.AddScoped<IEmailService, EmailService>();

        services.AddHealthChecks();

        return services;
    }

    public static IServiceCollection AddApiDocumentation(this IServiceCollection services)
    {
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen();

        return services;
    }
}
```

### 6.2 Crear archivo de autenticación JWT - `src/AuthService.Api/Extensions/AuthenticationExtensions.cs`

```csharp
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace AuthService.Api.Extensions;

public static class AuthenticationExtensions
{
    public static IServiceCollection AddJwtAuthentication(this IServiceCollection services, IConfiguration configuration)
    {
        var jwtSettings = configuration.GetSection("JwtSettings");
        var secretKey = jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JWT SecretKey not configured");

        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = jwtSettings["Issuer"],
                ValidAudience = jwtSettings["Audience"],
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
                ClockSkew = TimeSpan.Zero
            };
        });

        return services;
    }
}
```

### 6.3 Crear Rate Limiting Extensions - `src/AuthService.Api/Extensions/RateLimitingExtensions.cs`

```csharp
using System.Threading.RateLimiting;

namespace AuthService.Api.Extensions;

public static class RateLimitingExtensions
{
    public static IServiceCollection AddRateLimitingPolicies(this IServiceCollection services)
    {
        services.AddRateLimiter(options =>
        {
            // Rate limiting para autenticación
            options.AddPolicy("AuthPolicy", context =>
                RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                    factory: partition => new FixedWindowRateLimiterOptions
                    {
                        AutoReplenishment = true,
                        PermitLimit = 5,
                        Window = TimeSpan.FromMinutes(1)
                    }));

            // Rate limiting general para API
            options.AddPolicy("ApiPolicy", context =>
                RateLimitPartition.GetTokenBucketLimiter(
                    partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                    factory: partition => new TokenBucketRateLimiterOptions
                    {
                        TokenLimit = 100,
                        QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                        QueueLimit = 5,
                        ReplenishmentPeriod = TimeSpan.FromMinutes(1),
                        TokensPerPeriod = 20,
                        AutoReplenishment = true
                    }));

            options.OnRejected = async (context, token) =>
            {
                context.HttpContext.Response.StatusCode = 429;
                await context.HttpContext.Response.WriteAsync("Too Many Requests. Please try again later.", token);
            };
        });

        return services;
    }
}
```

### 6.4 Crear Security Extensions - `src/AuthService.Api/Extensions/SecurityExtensions.cs`

```csharp
using Microsoft.AspNetCore.DataProtection;

namespace AuthService.Api.Extensions;

public static class SecurityExtensions
{
    private static readonly string[] DefaultAllowedOrigins = ["http://localhost:3000", "https://localhost:3001"];
    private static readonly string[] DefaultAdminOrigins = ["https://admin.localhost"];
    private static readonly string[] AllowedHttpMethods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"];
    private static readonly string[] AdminHttpMethods = ["GET", "POST", "PUT", "DELETE"];
    private static readonly string[] AdminAllowedHeaders = ["Content-Type", "Authorization"];
    public static IServiceCollection AddSecurityPolicies(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddCors(options =>
        {
            options.AddPolicy("DefaultCorsPolicy", builder =>
            {
                var allowedOrigins = configuration.GetSection("Security:AllowedOrigins").Get<string[]>()
                    ?? DefaultAllowedOrigins;

                builder.WithOrigins(allowedOrigins)
                       .AllowAnyHeader()
                       .WithMethods(AllowedHttpMethods)
                       .AllowCredentials()
                       .SetPreflightMaxAge(TimeSpan.FromMinutes(10));
            });

            options.AddPolicy("AdminCorsPolicy", builder =>
            {
                var adminOrigins = configuration.GetSection("Security:AdminAllowedOrigins").Get<string[]>()
                    ?? DefaultAdminOrigins;

                builder.WithOrigins(adminOrigins)
                       .WithHeaders(AdminAllowedHeaders)
                       .WithMethods(AdminHttpMethods)
                       .AllowCredentials();
            });
        });

        var keysDirectory = new DirectoryInfo("./keys");
        if (!keysDirectory.Exists)
        {
            keysDirectory.Create();
        }

        var dataProtectionBuilder = services.AddDataProtection()
                .PersistKeysToFileSystem(keysDirectory)
                .SetApplicationName("AuthDotnetApi")
                .SetDefaultKeyLifetime(TimeSpan.FromDays(90));

        var environment = services.BuildServiceProvider().GetRequiredService<IWebHostEnvironment>();
        if (environment.IsProduction())
        {
            if (OperatingSystem.IsWindows())
            {
                dataProtectionBuilder.ProtectKeysWithDpapi();
            }
        }
        else
        {
            if (OperatingSystem.IsWindows())
            {
                dataProtectionBuilder.ProtectKeysWithDpapi();
            }
        }

        services.AddAntiforgery(options =>
        {
            options.HeaderName = "X-CSRF-TOKEN";
            options.SuppressXFrameOptionsHeader = false;
            options.Cookie.Name = "__RequestVerificationToken";
            options.Cookie.HttpOnly = true;
            options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
            options.Cookie.SameSite = SameSiteMode.Strict;
        });

        return services;
    }

    public static IServiceCollection AddSecurityOptions(this IServiceCollection services)
    {
        services.Configure<CookiePolicyOptions>(options =>
        {
            options.CheckConsentNeeded = context => true;
            options.MinimumSameSitePolicy = SameSiteMode.Strict;
            options.HttpOnly = Microsoft.AspNetCore.CookiePolicy.HttpOnlyPolicy.Always;
            options.Secure = CookieSecurePolicy.SameAsRequest;
        });

        return services;
    }
}
```

### 6.5 Crear Model Binder para archivos - `src/AuthService.Api/ModelBinders/FileDataModelBinder.cs`

```csharp
using AuthService.Application.Interfaces;
using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace AuthService.Api.ModelBinders;

public class FileDataModelBinder : IModelBinder
{
    public Task BindModelAsync(ModelBindingContext bindingContext)
    {
        var modelName = bindingContext.ModelName;
        var valueProviderResult = bindingContext.ValueProvider.GetValue(modelName);

        if (valueProviderResult == ValueProviderResult.None)
        {
            return Task.CompletedTask;
        }

        var httpContext = bindingContext.HttpContext;
        if (httpContext.Request.HasFormContentType &&
            httpContext.Request.Form.Files.TryGetValue(modelName, out var file))
        {
            bindingContext.Result = ModelBindingResult.Success(new FormFileAdapter(file));
        }

        return Task.CompletedTask;
    }
}

public class FileDataModelBinderProvider : IModelBinderProvider
{
    public IModelBinder? GetBinder(ModelBinderProviderContext context)
    {
        if (context.Metadata.ModelType == typeof(IFileData))
        {
            return new FileDataModelBinder();
        }

        return null;
    }
}
```

---

## PASO 7: CREAR CONTROLLERS EN API

```csharp
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace AuthService.Api.Extensions;

public static class AuthenticationExtensions
{
    public static IServiceCollection AddJwtAuthentication(
        this IServiceCollection services, IConfiguration configuration)
    {
        var jwtSettings = configuration.GetSection("JwtSettings");
        var secretKey = jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JWT SecretKey not configured");
        var key = Encoding.UTF8.GetBytes(secretKey);

        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = true,
                ValidIssuer = jwtSettings["Issuer"],
                ValidateAudience = true,
                ValidAudience = jwtSettings["Audience"],
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            };
        });

        services.AddAuthorizationBuilder()
            .AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));

        return services;
    }
}
```

---

## PASO 7: CREAR CONTROLLERS EN API

### 7.1 Crear AuthController - `src/AuthService.Api/Controllers/AuthController.cs`

```csharp
using AuthService.Application.DTOs;
using AuthService.Application.DTOs.Email;
using AuthService.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace AuthService.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class AuthController(IAuthService authService) : ControllerBase
{
    [HttpGet("profile")]
    [Authorize]
    public async Task<ActionResult<object>> GetProfile()
    {
        var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == "sub" || c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier");
        if (userIdClaim == null || string.IsNullOrEmpty(userIdClaim.Value))
        {
            return Unauthorized();
        }

        var user = await authService.GetUserByIdAsync(userIdClaim.Value);
        if (user == null)
        {
            return NotFound();
        }
        return Ok(new
        {
            success = true,
            message = "Perfil obtenido exitosamente",
            data = user
        });
    }

    [HttpPost("profile/by-id")]
    [EnableRateLimiting("ApiPolicy")]
    public async Task<ActionResult<object>> GetProfileById([FromBody] GetProfileByIdDto request)
    {
        if (string.IsNullOrEmpty(request.UserId))
        {
            return BadRequest(new
            {
                success = false,
                message = "El userId es requerido"
            });
        }

        var user = await authService.GetUserByIdAsync(request.UserId);
        if (user == null)
        {
            return NotFound(new
            {
                success = false,
                message = "Usuario no encontrado"
            });
        }

        return Ok(new
        {
            success = true,
            message = "Perfil obtenido exitosamente",
            data = user
        });
    }
    [HttpPost("register")]
    [RequestSizeLimit(10 * 1024 * 1024)] // 10MB
    [EnableRateLimiting("AuthPolicy")]
    public async Task<ActionResult<RegisterResponseDto>> Register([FromForm] RegisterDto registerDto)
    {
        var result = await authService.RegisterAsync(registerDto);
        return StatusCode(201, result);
    }

    [HttpPost("login")]
    [EnableRateLimiting("AuthPolicy")]
    public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginDto loginDto)
    {
        var result = await authService.LoginAsync(loginDto);
        return Ok(result);
    }

    [HttpPost("verify-email")]
    [EnableRateLimiting("ApiPolicy")]
    public async Task<ActionResult<EmailResponseDto>> VerifyEmail([FromBody] VerifyEmailDto verifyEmailDto)
    {
        var result = await authService.VerifyEmailAsync(verifyEmailDto);
        return Ok(result);
    }

    [HttpPost("resend-verification")]
    [EnableRateLimiting("AuthPolicy")]
    public async Task<ActionResult<EmailResponseDto>> ResendVerification([FromBody] ResendVerificationDto resendDto)
    {
        var result = await authService.ResendVerificationEmailAsync(resendDto);

        if (!result.Success)
        {
            if (result.Message.Contains("no encontrado", StringComparison.OrdinalIgnoreCase))
            {
                return NotFound(result);
            }
            if (result.Message.Contains("ya ha sido verificado", StringComparison.OrdinalIgnoreCase) ||
                result.Message.Contains("ya verificado", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(result);
            }
            return StatusCode(503, result);
        }

        return Ok(result);
    }

    [HttpPost("forgot-password")]
    [EnableRateLimiting("AuthPolicy")]
    public async Task<ActionResult<EmailResponseDto>> ForgotPassword([FromBody] ForgotPasswordDto forgotPasswordDto)
    {
        var result = await authService.ForgotPasswordAsync(forgotPasswordDto);

        if (!result.Success)
        {
            return StatusCode(503, result);
        }

        return Ok(result);
    }

    [HttpPost("reset-password")]
    [EnableRateLimiting("AuthPolicy")]
    public async Task<ActionResult<EmailResponseDto>> ResetPassword([FromBody] ResetPasswordDto resetPasswordDto)
    {
        var result = await authService.ResetPasswordAsync(resetPasswordDto);
        return Ok(result);
    }
}
```

### 7.2 Crear UsersController - `src/AuthService.Api/Controllers/UsersController.cs`

```csharp
using AuthService.Application.DTOs;
using AuthService.Application.Interfaces;
using AuthService.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace AuthService.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class UsersController(IUserManagementService userManagementService) : ControllerBase
{
    private async Task<bool> CurrentUserIsAdmin()
    {
        var userId = User.Claims.FirstOrDefault(c => c.Type == "sub" || c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value;
        if (string.IsNullOrEmpty(userId)) return false;
        var roles = await userManagementService.GetUserRolesAsync(userId);
        return roles.Contains(RoleConstants.ADMIN_ROLE);
    }

    [HttpPut("{userId}/role")]
    [Authorize]
    [EnableRateLimiting("ApiPolicy")]
    public async Task<ActionResult<UserResponseDto>> UpdateUserRole(string userId, [FromBody] UpdateUserRoleDto dto)
    {
        if (!await CurrentUserIsAdmin())
        {
            return StatusCode(403, new { success = false, message = "Forbidden" });
        }

        var result = await userManagementService.UpdateUserRoleAsync(userId, dto.RoleName);
        return Ok(result);
    }

    [HttpGet("{userId}/roles")]
    [Authorize]
    public async Task<ActionResult<IReadOnlyList<string>>> GetUserRoles(string userId)
    {
        var roles = await userManagementService.GetUserRolesAsync(userId);
        return Ok(roles);
    }

    [HttpGet("by-role/{roleName}")]
    [Authorize]
    [EnableRateLimiting("ApiPolicy")]
    public async Task<ActionResult<IReadOnlyList<UserResponseDto>>> GetUsersByRole(string roleName)
    {
        if (!await CurrentUserIsAdmin())
        {
            return StatusCode(403, new { success = false, message = "Forbidden" });
        }

        var users = await userManagementService.GetUsersByRoleAsync(roleName);
        return Ok(users);
    }
}
```

### 7.3 Crear HealthController - `src/AuthService.Api/Controllers/HealthController.cs`

```csharp
using Microsoft.AspNetCore.Mvc;

namespace AuthService.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult GetHealth()
    {
        var response = new
        {
            status = "Healthy",
            timestamp = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
            service = "KinalSports Authentication Service"
        };

        return Ok(response);
    }
}
```

### 7.4 Crear Middleware de excepciones - `src/AuthService.Api/Middlewares/GlobalExceptionMiddleware.cs`

```csharp
using AuthService.Application.Exceptions;
using System.Net;

namespace AuthService.Api.Middlewares;

public class GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (BusinessException ex)
        {
            logger.LogError($"Business exception: {ex.Message}");
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)HttpStatusCode.BadRequest;

            await context.Response.WriteAsJsonAsync(new
            {
                success = false,
                message = ex.Message,
                code = ex.Code,
                errors = ex.Errors
            });
        }
        catch (Exception ex)
        {
            logger.LogError($"Unhandled exception: {ex.Message}");
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;

            await context.Response.WriteAsJsonAsync(new
            {
                success = false,
                message = "Internal server error",
                details = ex.Message
            });
        }
    }
}
```

### 7.5 Actualizar Program.cs - `src/AuthService.Api/Program.cs`

```csharp
using AuthService.Api.Extensions;
using AuthService.Api.Middlewares;
using AuthService.Api.ModelBinders;
using AuthService.Persistence.Data;
using NetEscapades.AspNetCore.SecurityHeaders.Infrastructure;
using Serilog;
using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Hosting.Server.Features;

var builder = WebApplication.CreateBuilder(args);

builder.Host.UseSerilog((context, services, loggerConfiguration) =>
    loggerConfiguration
        .ReadFrom.Configuration(context.Configuration)
        .ReadFrom.Services(services));

builder.Services.AddControllers(options =>
{
    options.ModelBinderProviders.Insert(0, new FileDataModelBinderProvider());
})
.AddJsonOptions(o =>
{
    o.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
});

builder.Services.AddApiDocumentation();
builder.Services.AddApplicationServices(builder.Configuration);
builder.Services.AddJwtAuthentication(builder.Configuration);
builder.Services.AddRateLimitingPolicies();
builder.Services.AddSecurityPolicies(builder.Configuration);
builder.Services.AddSecurityOptions();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseSerilogRequestLogging();

app.UseSecurityHeaders(policies => policies
    .AddDefaultSecurityHeaders()
    .RemoveServerHeader()
    .AddFrameOptionsDeny()
    .AddXssProtectionBlock()
    .AddContentTypeOptionsNoSniff()
    .AddReferrerPolicyStrictOriginWhenCrossOrigin()
    .AddContentSecurityPolicy(builder =>
    {
        builder.AddDefaultSrc().Self();
        builder.AddScriptSrc().Self().UnsafeInline();
        builder.AddStyleSrc().Self().UnsafeInline();
        builder.AddImgSrc().Self().Data();
        builder.AddFontSrc().Self().Data();
        builder.AddConnectSrc().Self();
        builder.AddFrameAncestors().None();
        builder.AddBaseUri().Self();
        builder.AddFormAction().Self();
    })
    .AddCustomHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()")
    .AddCustomHeader("Cache-Control", "no-store, no-cache, must-revalidate, private")
);

app.UseMiddleware<GlobalExceptionMiddleware>();

app.UseHttpsRedirection();
app.UseCors("DefaultCorsPolicy");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.MapHealthChecks("/health");
app.MapGet("/health", () =>
{
    var response = new
    {
        status = "Healthy",
        timestamp = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    };
    return Results.Ok(response);
});

app.MapHealthChecks("/api/v1/health");

var startupLogger = app.Services.GetRequiredService<ILogger<Program>>();
app.Lifetime.ApplicationStarted.Register(() =>
{
    try
    {
        var server = app.Services.GetRequiredService<IServer>();
        var addressesFeature = server.Features.Get<IServerAddressesFeature>();
        var addresses = (IEnumerable<string>?)addressesFeature?.Addresses ?? app.Urls;

        if (addresses != null && addresses.Any())
        {
            foreach (var addr in addresses)
            {
                var health = $"{addr.TrimEnd('/')}/health";
                startupLogger.LogInformation("AuthService API is running at {Url}. Health endpoint: {HealthUrl}", addr, health);
            }
        }
        else
        {
            startupLogger.LogInformation("AuthService API started. Health endpoint: /health");
        }
    }
    catch (Exception ex)
    {
        startupLogger.LogWarning(ex, "Failed to determine the listening addresses for startup log");
    }
});

using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

    try
    {
        logger.LogInformation("Checking database connection...");

        await context.Database.EnsureCreatedAsync();

        logger.LogInformation("Database ready. Running seed data...");
        await DataSeeder.SeedAsync(context);

        logger.LogInformation("Database initialization completed successfully");
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "An error occurred while initializing the database");
        throw;
    }
}

app.Run();
```

---

## PASO 8: CONFIGURAR appsettings.json

Crear `src/AuthService.Api/appsettings.json`:

```json
{
    "ConnectionStrings": {
        "DefaultConnection": "Host=localhost;Database=auth_service;Username=postgres;Password=Root1234!;Port=5432"
    },
    "JwtSettings": {
        "SecretKey": "MyVerySecretKeyForJWTTokenAuthenticationWith256Bits!",
        "Issuer": "AuthService",
        "Audience": "AuthService",
        "ExpiryInMinutes": 30
    },
    "CloudinarySettings": {
        "CloudName": "your_cloud_name",
        "ApiKey": "your_api_key",
        "ApiSecret": "your_api_secret",
        "Folder": "auth_service/profiles"
    },
    "SmtpSettings": {
        "Enabled": true,
        "Host": "smtp.gmail.com",
        "Port": "587",
        "UseImplicitSsl": false,
        "Username": "your_email@gmail.com",
        "Password": "your_app_password",
        "FromEmail": "your_email@gmail.com",
        "FromName": "AuthDotnet",
        "Timeout": "30000",
        "UseFallback": false
    },
    "AppSettings": {
        "FrontendUrl": "http://localhost:3000"
    },
    "Security": {
        "AllowedOrigins": ["http://localhost:3000", "https://localhost:3001"],
        "AdminAllowedOrigins": ["https://admin.localhost"]
    }
}
```

---

## PASO 9: INSTALAR CLOUDINARY

```bash
cd src/AuthService.Application
dotnet add package CloudinaryDotNet
cd ../..
```

---

## PASO 🔟: EJECUTAR Y PROBAR

app.UseHttpsRedirection();
app.UseCors("DefaultCorsPolicy");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Health checks
app.MapHealthChecks("/health");
app.MapGet("/health", () =>
{
var response = new
{
status = "Healthy",
timestamp = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
};
return Results.Ok(response);
});

app.Run();

````

---

## PASO 8: CONFIGURAR appsettings.json

```bash
# Desde la raíz del proyecto

# Restaurar dependencias
dotnet restore

# Compilar
dotnet build

# Ejecutar migraciones (si no se hicieron en paso 3.6)
cd src/AuthService.Api
dotnet ef database update \
  --project ../AuthService.Persistence/AuthService.Persistence.csproj \
  --startup-project .
cd ../..

# Iniciar la API
cd src/AuthService.Api
dotnet run

# La API estará en: https://localhost:5001
# Swagger en: https://localhost:5001/swagger
````

---

## 📋 RESUMEN DE RELACIONES ENTRE CAPAS

```
┌─────────────────────────────────────────────────┐
│           CAPA PRESENTATION (API)               │
│ - Controllers (AuthController, UsersController) │
│ - Middlewares (GlobalExceptionMiddleware)       │
│ - Extensions (DI, JWT, CORS, Rate Limiting)     │
│ - Program.cs (Configuración central)            │
└─────────────┬───────────────────────────────────┘
              │ DEPENDE DE
              ↓
┌─────────────────────────────────────────────────┐
│       CAPA APPLICATION (Lógica de negocio)      │
│ - Services (AuthService, EmailService, etc)     │
│ - DTOs (Transferencia de datos)                 │
│ - Interfaces (Contratos)                        │
│ - Validators (Validación)                       │
│ - Exceptions (Errores personalizados)           │
└─────────────┬───────────────────────────────────┘
              │ DEPENDE DE
              ↓
┌─────────────────────────────────────────────────┐
│           CAPA DOMAIN (Entidades)               │
│ - Entities (User, Role, UserProfile, etc)       │
│ - Enums (Estados, roles)                        │
│ - Constants (Valores fijos)                     │
│ - Interfaces (Contratos de repos)               │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│     CAPA PERSISTENCE (Acceso a datos)           │
│ - DbContext (ApplicationDbContext)              │
│ - Repositories (UserRepository, RoleRepository) │
│ - Migrations (Control de versiones BD)          │
│ DEPENDE DE: Domain                              │
└─────────────────────────────────────────────────┘
```

---

## FLUJO DE UNA SOLICITUD: EJEMPLO `POST /api/v1/auth/register`

```
1. Solicitud llega a AuthController.Register()
   ↓
2. Controller deserializa [FromForm] RegisterDto
   ↓
3. Controller llama authService.RegisterAsync(registerDto)
   ↓
4. AuthService (Application) valida datos:
   - ¿Email duplicado? → userRepository.ExistsByEmailAsync()
   - ¿Username duplicado? → userRepository.ExistsByUsernameAsync()
   ↓
5. AuthService crea entidad User (Domain)
   - Genera ID único
   - Hash de contraseña → passwordHashService.HashPassword()
   ↓
6. AuthService guarda usuario:
   - userRepository.AddAsync(user)
   - Esto persiste en BD usando ApplicationDbContext
   ↓
7. AuthService envia email:
   - emailService.SendVerificationEmailAsync()
   ↓
8. AuthService retorna RegisterResponseDto
   ↓
9. Controller retorna 201 Created con respuesta
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
