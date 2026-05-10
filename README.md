# Bienvenido a GestionBancario

GestionBancario es una plataforma de gestion bancaria construida con una arquitectura orientada a servicios. El proyecto integra un frontend web, un servicio de autenticacion y varios microservicios especializados para manejar operaciones como cuentas, monedas, tasas de cambio, transacciones y notificaciones.

Este README ofrece una vista general del proyecto sin exponer credenciales, secretos, tokens ni configuraciones sensibles.

## Objetivo Del Proyecto

El objetivo principal es centralizar funcionalidades bancarias comunes en un ecosistema modular, mantenible y facil de extender. Cada servicio tiene una responsabilidad clara, lo que permite trabajar por partes, probar cambios con menor riesgo y escalar componentes de forma independiente.

## Componentes Principales

```text
GestionBancario/
|-- BancoFronted/                 # Aplicacion frontend
|-- authentication-service/       # Servicio de autenticacion
|-- BankAccount-service/          # Gestion de cuentas bancarias
|-- Currency-service/             # Gestion de monedas
|-- Exchangerate-service/         # Gestion de tasas de cambio
|-- Transactions-service/         # Gestion de transacciones
|-- Notification-service/         # Gestion de notificaciones
|-- GestionBancarioManagment/     # API principal de gestion bancaria
|-- Endpoints/                    # Referencias de endpoints
|-- scripts/                      # Scripts de apoyo del workspace
`-- Explicacion y Guia del Proyecto/
```

## Tecnologias Usadas

- React y Vite para el frontend.
- .NET 8 para el servicio principal de autenticacion.
- Node.js para microservicios de negocio.
- PostgreSQL para datos relacionales.
- MongoDB para servicios que trabajan con documentos.
- Docker para apoyar el entorno local de desarrollo.
- pnpm como gestor principal para comandos del workspace.

## Arquitectura General

El sistema esta organizado en servicios independientes que se comunican mediante APIs. Esta separacion ayuda a mantener el codigo ordenado y reduce el acoplamiento entre areas como autenticacion, cuentas, divisas, transacciones y notificaciones.

La aplicacion frontend consume las APIs disponibles y actua como punto de entrada para los usuarios. Los servicios backend gestionan la logica de negocio, validaciones, persistencia y comunicacion entre dominios.

## Inicio Rapido

Instala las dependencias globales del workspace:

```powershell
pnpm install
pnpm install:services
```

Levanta los servicios Node desde la raiz:

```powershell
pnpm dev
```

Para ejecutar el frontend:

```powershell
cd BancoFronted
pnpm install
pnpm dev
```

Para ejecutar el servicio de autenticacion, consulta la guia interna del proyecto y usa los scripts incluidos dentro de `authentication-service/auth-service`.

## Configuracion

El proyecto utiliza archivos de entorno para definir conexiones, URLs internas, claves y parametros de ejecucion. Por seguridad:

- No publiques archivos `.env` con valores reales.
- No subas credenciales, tokens, llaves privadas ni contrasenas.
- Usa archivos `.env.example` cuando sea necesario documentar variables sin valores sensibles.
- Manten la configuracion real solo en entornos locales o administrados.

## Documentacion Interna

La carpeta `Explicacion y Guia del Proyecto/` contiene informacion mas detallada para desarrollo local, solucion de problemas y flujo de ejecucion. Esa documentacion puede incluir detalles operativos, por lo que debe tratarse como referencia interna del equipo.

## Buenas Practicas

- Trabaja en ramas separadas para nuevas funcionalidades o correcciones.
- Revisa que los servicios necesarios esten activos antes de probar flujos completos.
- Ejecuta pruebas o verificaciones locales antes de integrar cambios.
- Manten los endpoints y variables documentados sin revelar informacion sensible.
- Evita mezclar cambios de configuracion local con cambios funcionales del codigo.

## Estado Del Proyecto

GestionBancario esta pensado como un proyecto modular en evolucion. Su estructura permite seguir agregando servicios, endpoints, validaciones y mejoras de interfaz sin perder una organizacion clara.

Bienvenido al proyecto. La idea es que puedas entrar, entender el mapa general y empezar a trabajar sin tener que perseguir detalles por todo el repositorio.
