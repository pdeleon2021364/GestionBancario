# Auth Node - Servicio de Autenticación

API RESTful de autenticación robusta construida con Node.js, Express y PostgreSQL.

## 📋 Descripción

Servicio de autenticación que proporciona registro, login, gestión de perfiles, verificación de email, recuperación de contraseñas y administración de roles de usuario. Utiliza JWT para autenticación stateless y Argon2 para hashing seguro de contraseñas.

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+ (ESM)
- **Framework**: Express 5.x
- **Base de Datos**: PostgreSQL 14+
- **ORM**: Sequelize 6.x
- **Autenticación**: JWT (jsonwebtoken)
- **Hashing**: Argon2
- **Validación**: express-validator
- **Storage**: Cloudinary (perfiles de usuario)
- **Email**: Nodemailer
- **Seguridad**: Helmet, CORS, Rate Limiting

## 🚀 Instalación

```bash
# Desde la raíz del monorepo
pnpm install

# O específicamente este servicio
pnpm --filter auth-node install
```

## ⚙️ Variables de Entorno

Crear archivo `.env` en `authentication-service/auth-node/`:

```env
# Server
NODE_ENV=development
PORT=3001

# Database PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kinalsports_auth
DB_USERNAME=postgres
DB_PASSWORD=tu_password
DB_SQL_LOGGING=false

# JWT Configuration
JWT_SECRET=tu-secret-key-super-segura
JWT_EXPIRES_IN=30m
JWT_REFRESH_EXPIRES_IN=7d
JWT_ISSUER=KinalSportsAuth
JWT_AUDIENCE=KinalSportsAPI

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_ENABLE_SSL=true
SMTP_USERNAME=tu-email@gmail.com
SMTP_PASSWORD=tu-app-password
EMAIL_FROM=noreply@kinalsports.com
EMAIL_FROM_NAME=KinalSports

# Cloudinary (upload de perfiles)
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
CLOUDINARY_BASE_URL=https://res.cloudinary.com
CLOUDINARY_FOLDER=kinalSports/profiles
CLOUDINARY_DEFAULT_AVATAR_FILENAME=default-avatar.png

# File Upload
UPLOAD_PATH=./uploads

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Security
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
ADMIN_ALLOWED_ORIGINS=http://localhost:5173

# Verification Tokens (en horas)
VERIFICATION_EMAIL_EXPIRY_HOURS=24
PASSWORD_RESET_EXPIRY_HOURS=1
```

## 📂 Estructura

```
auth-node/
├── configs/
│   ├── app.js                    # Configuración principal del servidor
│   ├── db.js                     # Conexión PostgreSQL + Sequelize
│   ├── cors-configuration.js     # Configuración CORS
│   └── helmet-configuration.js   # Headers de seguridad
├── helpers/
│   ├── auth-operations.js        # Lógica de autenticación
│   ├── profile-operations.js     # Gestión de perfiles
│   ├── generate-jwt.js           # Generación de tokens
│   ├── cloudinary-service.js     # Servicio de upload
│   ├── email-service.js          # Envío de emails
│   └── user-db.js                # Operaciones de BD
├── middlewares/
│   ├── validate-JWT.js           # Verificación de tokens
│   ├── validation.js             # Validadores personalizados
│   └── request-limit.js          # Rate limiting
├── src/
│   ├── auth/
│   │   ├── auth.controller.js    # Controladores de autenticación
│   │   ├── auth.routes.js        # Rutas de autenticación
│   │   └── role.model.js         # Modelo de roles
│   └── users/
│       ├── user.controller.js    # Controladores de usuarios
│       ├── user.routes.js        # Rutas de usuarios
│       └── user.model.js         # Modelo de usuario
└── index.js                      # Punto de entrada
```

## 🎯 Scripts Disponibles

```bash
# Desarrollo con auto-reload
pnpm --filter auth-node dev

# Producción
pnpm --filter auth-node start

# Lint
pnpm --filter auth-node lint
pnpm --filter auth-node lint:fix

# Format
pnpm --filter auth-node format
pnpm --filter auth-node format:check
```

## 🔌 Endpoints Principales

### Autenticación

| Método | Endpoint                        | Descripción                    | Auth     |
| ------ | ------------------------------- | ------------------------------ | -------- |
| POST   | `/api/auth/register`            | Registrar nuevo usuario        | No       |
| POST   | `/api/auth/login`               | Iniciar sesión                 | No       |
| POST   | `/api/auth/verify-email`        | Verificar email con token      | No       |
| POST   | `/api/auth/resend-verification` | Reenviar email de verificación | No       |
| POST   | `/api/auth/forgot-password`     | Solicitar reset de contraseña  | No       |
| POST   | `/api/auth/reset-password`      | Resetear contraseña con token  | No       |
| GET    | `/api/auth/profile`             | Obtener perfil del usuario     | Sí (JWT) |

### Gestión de Usuarios (Admin)

| Método | Endpoint                       | Descripción               | Auth       |
| ------ | ------------------------------ | ------------------------- | ---------- |
| PUT    | `/api/users/:userId/role`      | Actualizar rol de usuario | Sí (Admin) |
| GET    | `/api/users/:userId/roles`     | Obtener roles de usuario  | Sí (Admin) |
| GET    | `/api/users/by-role/:roleName` | Listar usuarios por rol   | Sí (Admin) |

### Ejemplo de Request

**Registro:**

```bash
POST http://localhost:3001/api/auth/register
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
POST http://localhost:3001/api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Perfil (con token):**

```bash
GET http://localhost:3001/api/auth/profile
Authorization: Bearer <tu-jwt-token>
```

## 🔐 Roles y Permisos

- **USER**: Usuario estándar (default al registrarse)
- **ADMIN**: Administrador del sistema
- **MODERATOR**: Moderador de contenido
- **SUPER_ADMIN**: Super administrador

Los roles se configuran automáticamente mediante seeds en la base de datos.

## 🗄️ Modelos de Base de Datos

### User

- `id` (UUID, PK)
- `username` (unique)
- `email` (unique)
- `passwordHash`
- `emailVerified`
- `isActive`
- `createdAt`, `updatedAt`

### UserProfile

- `userId` (FK)
- `firstName`
- `lastName`
- `phone`
- `avatar` (URL Cloudinary)
- `bio`

### UserEmail

- `userId` (FK)
- `verificationToken`
- `verificationTokenExpires`

### UserPasswordReset

- `userId` (FK)
- `resetToken`
- `resetTokenExpires`

### Role

- `id` (UUID, PK)
- `name` (USER, ADMIN, etc.)
- `description`

### UserRole (Tabla intermedia many-to-many)

- `userId` (FK)
- `roleId` (FK)

## 🔗 Dependencias con Otros Servicios

- **server-admin**: Consume este servicio para validar tokens JWT de administradores
- **server-user**: Consume este servicio para validar tokens JWT de usuarios
- **client-admin**: Frontend que consume endpoints de autenticación y gestión de usuarios

## 🧪 Testing

```bash
# Ejecutar tests (cuando estén implementados)
pnpm --filter auth-node test
```

## 📝 Notas de Desarrollo

- El servidor escucha en el puerto definido en `.env` (default: 3001)
- Las rutas están prefijadas con `/api`
- Los tokens JWT expiran según configuración en `.env`
- Los emails de verificación y reset de contraseña son válidos por 24 horas
- Las imágenes de perfil se suben a Cloudinary automáticamente
- Rate limiting configurado: 100 requests por 15 minutos por IP

## 👤 Autor

**Braulio Echeverria**

## 📄 Licencia

MIT
