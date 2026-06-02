# GestionBancarioManagment - Perfil de Usuario con Foto

Esta carpeta incluye la funcionalidad de registro de usuarios con foto de perfil opcional, edición de perfil y visualización de perfil protegido.

## Variables de entorno necesarias

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CLOUDINARY_FOLDER` (por ejemplo: `gestionbancario/profiles`)
- `CLOUDINARY_BASE_URL` (opcional)
- `CLOUDINARY_DEFAULT_AVATAR_FILENAME` (puede ser una URL pública o un public_id de Cloudinary)
- `UPLOAD_PATH` (ruta temporal, por ejemplo: `./uploads`)
- `JWT_SECRET`
- `DB_DIALECT` (`postgres` o `sqlite`)
- `DB_NAME`, `DB_USER`, `DB_PASS`, `DB_HOST`, `DB_PORT` cuando uses PostgreSQL
- `DB_STORAGE` cuando uses SQLite (por ejemplo: `:memory:` o `./database.sqlite`)
- `EMAIL_USER`, `EMAIL_PASS` para envío opcional de verificación por correo

## Instalación

```powershell
cd GestionBancarioManagment
pnpm install
```

## Ejecutar

```powershell
pnpm start
```

## Pruebas

```powershell
pnpm test
```

## Endpoints

### Registro de usuario

`POST /gestionbanco/v1/auth/register`

- Acepta `multipart/form-data`
- Campos: `nombre`, `email`, `password`
- Archivo opcional: `profilePicture`
- También acepta `profilePictureUrl` para guardar una URL externa directamente

Ejemplo con curl:

```bash
curl -X POST http://localhost:3006/gestionbanco/v1/auth/register \
  -F "nombre=Juan Pérez" \
  -F "email=juan@example.com" \
  -F "password=Password123" \
  -F "profilePicture=@./avatar.png"
```

### Obtener perfil

`GET /gestionbanco/v1/auth/profile`

Header necesario:

`Authorization: Bearer <token>`

Ejemplo:

```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:3006/gestionbanco/v1/auth/profile
```

### Actualizar perfil

`PUT /gestionbanco/v1/auth/profile`

- Puede enviar `profilePicture` como archivo
- Puede enviar `profilePictureUrl` como URL externa
- Puede enviar `removePhoto=true` para restablecer al avatar por defecto

Ejemplo:

```bash
curl -X PUT http://localhost:3006/gestionbanco/v1/auth/profile \
  -H "Authorization: Bearer $TOKEN" \
  -F "nombre=Juan Actualizado" \
  -F "profilePicture=@./avatar.png"
```

## Comportamiento esperado

- Si no se sube foto, el usuario recibe un avatar por defecto.
- Si se sube foto, se valida tipo y tamaño y se guarda temporalmente antes de subir a Cloudinary.
- El archivo temporal se elimina tras la subida.
- Si se actualiza la foto, se borra la imagen previa de Cloudinary si no es un URL externa.
- Si la carga falla, el registro continúa con el avatar por defecto.
- Respuestas JSON uniformes con `success`, `message` y `user`.
