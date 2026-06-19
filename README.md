# Lubricentro Central | Módulo Dragonfish v1.0

Sistema compacto de gestión operativa y facturación de mostrador estilo ERP búnker, optimizado para flujos rápidos de trabajo mediante comandos de teclado y terminal interactiva.

## 🛠️ Arquitectura del Sistema

- **Backend:** Node.js (ES Modules) + Express v4
- **Persistencia & ORM:** Prisma ORM v5 conectado a MySQL 8.4 (Instancia en la nube Aiven)
- **Frontend:** Interfaz unificada monocromática optimizada (Modo Búnker) construida en Vanilla HTML5, CSS Custom Properties y JavaScript Asincrónico (Fetch API).

## 🗃️ Modelo de Datos Primario

El esquema relacional cuenta con indexación única de artículos para búsquedas elásticas multicriterio de tres dígitos (`001` al `020` correlativos):

- `User`: Control de operadores y roles de terminal.
- `Category`: Segmentación del maestro de artículos.
- `Product`: Catálogo de existencias indexado por código único (`code`).
- `Appointment`: Planificación del monitor de turnos del taller.

## 🚀 Despliegue Local del Entorno

1. Instalar dependencias en el núcleo del servidor:
   ```bash
   cd Backend
   npm install
   ```
