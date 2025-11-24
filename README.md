# TuBarrio

Plataforma de reporte de problemas sociales para la participación ciudadana.

## Descripción

TuBarrio es una plataforma diseñada para conectar a los ciudadanos con las soluciones a los problemas sociales de su comunidad. Permite a los usuarios reportar incidencias como baches, problemas de alumbrado, acumulación de basura, cuestiones de seguridad y más, facilitando la participación ciudadana y el seguimiento de las soluciones.

## Características

-   **Reporte de Incidencias**: Los usuarios pueden crear reportes detallados de problemas en su barrio, incluyendo título, descripción, tipo de problema, ubicación y adjuntar imágenes como evidencia.
-   **Gestión de Reportes**: Los usuarios pueden ver, editar y eliminar sus propios reportes.
-   **Comentarios y Apoyos**: Los ciudadanos pueden comentar en los reportes existentes y apoyar aquellos que consideren importantes.
-   **Estado de Reportes**: Los reportes tienen un estado (Abierto, En proceso, Resuelto) que puede ser actualizado por el autor.
-   **Autenticación Segura**: Registro e inicio de sesión de usuarios utilizando Supabase Auth.
-   **Compresión de Imágenes**: Las imágenes se comprimen automáticamente antes de subirse para optimizar el rendimiento.

## Tecnologías Utilizadas

-   **React**: Biblioteca de JavaScript para construir interfaces de usuario.
-   **TypeScript**: Superset de JavaScript que añade tipado estático.
-   **Tailwind CSS**: Framework CSS utility-first para un diseño rápido y responsivo.
-   **React Router**: Para la navegación y el enrutamiento de la aplicación.
-   **Lucide React**: Colección de iconos.
-   **Supabase**: Backend como servicio para autenticación, base de datos y almacenamiento de archivos.
-   **Vite**: Herramienta de construcción rápida para el desarrollo.
-   **browser-image-compression**: Para la compresión de imágenes en el cliente.
-   **react-hot-toast**: Para notificaciones toast.

## Configuración del Entorno

Para ejecutar este proyecto localmente, necesitarás tener Node.js instalado.

### 1. Instalación de Dependencias

```bash
npm install
```

### 2. Configuración de Supabase

Este proyecto utiliza Supabase para la gestión de usuarios, base de datos y almacenamiento de archivos.

-   **Variables de Entorno**: Crea un archivo `.env.local` en la raíz del proyecto y añade tus credenciales de Supabase. Puedes obtenerlas desde la configuración de tu proyecto Supabase (Project Settings > API):

    ```
    VITE_SUPABASE_URL="TU_SUPABASE_PROJECT_URL"
    VITE_SUPABASE_ANON_KEY="TU_SUPABASE_ANON_KEY"
    ```

-   **Esquema de Base de Datos**: Asegúrate de que las tablas `profiles`, `reports` y `comments` existen en tu esquema `public` con las políticas RLS (Row Level Security) adecuadas. El esquema actual de tu proyecto Supabase ya incluye estas tablas y políticas.

-   **Storage Buckets**: Crea los siguientes buckets en Supabase Storage: `report_images`, `comment_images`, `avatars`. Configura las políticas de seguridad para permitir la subida y descarga de imágenes por usuarios autenticados.

### 3. Ejecutar la Aplicación

```bash
npm run dev
```

La aplicación se ejecutará en `http://localhost:3000`.

## Despliegue

Para desplegar la aplicación en producción, puedes usar el comando de construcción:

```bash
npm run build
```

Esto generará una carpeta `dist` con los archivos estáticos listos para ser servidos por cualquier proveedor de hosting estático (Netlify, Vercel, etc.).