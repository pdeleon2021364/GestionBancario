# notification-service

Microservicio stateless para envio de correos transaccionales y reportes PDF.

## Endpoints base

- Base path: `http://localhost:3010/notification/v1/notify`
- Health: `http://localhost:3010/notification/v1/Health`
- Swagger: `http://localhost:3010/api-docs`

## Endpoints

- `POST /email`
  - Body: `{ to, subject, tipo, monto, saldo }`
- `POST /pdf`
  - Body: `{ toEmail, subject, title, entityName, data, fields, filename }`

## Seguridad

No requiere JWT. La autenticacion se delega a los microservicios consumidores.
