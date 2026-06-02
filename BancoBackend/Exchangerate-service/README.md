# exchangerate-service

Microservicio para administrar tipos de cambio y conversion de montos.

## Endpoints base

- Base path: `http://localhost:3005/exchangerate/v1/ExchangeRate`
- Health: `http://localhost:3005/exchangerate/v1/Health`
- Swagger: `http://localhost:3005/api-docs`

## Endpoints

- `POST /create` (JWT + `ADMIN_ROLE`)
- `GET /` (JWT + `ADMIN_ROLE`, paginacion con `page` y `limit`)
- `GET /:id` (JWT + `ADMIN_ROLE`)
- `PUT /update/:id` (JWT + `ADMIN_ROLE`)
- `DELETE /delete/:id` (JWT + `ADMIN_ROLE`)
- `POST /convert` (publico)
