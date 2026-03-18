# Documento de Arquitectura y Roadmap: Plataforma OTEC a Medida

## 1. Descripción General del Proyecto
Desarrollo de una plataforma web integral para una OTEC (Organismo Técnico de Capacitación) en Chile. El sistema unifica un sitio web corporativo, un catálogo dinámico de cursos (landings públicas), un entorno virtual de aprendizaje (LMS a medida) y un panel de administración. 

El objetivo principal es reemplazar un ecosistema fragmentado de WordPress/Plugins por una solución robusta en **Next.js (App Router), Supabase (Auth/PostgreSQL), Tailwind CSS y Transbank Webpay Plus**.

## 2. Desafíos y Características Únicas (Core Business Logic)
* **Modelos de Acceso Híbrido:** Un mismo curso puede tener diferentes flujos de conversión:
    * *Cotizar / SENCE:* Generación de leads sin acceso e-learning.
    * *Venta Directa:* Pago inmediato vía Transbank.
    * *Freemium:* Acceso gratuito al contenido, Certificado bloqueado por pago.
* **Cursos "Sin Capa E-learning":** Si no hay lecciones, es solo landing/presencial.
* **Validación de RUT Chileno:** Requisito estricto en el registro (algoritmo Módulo 11).
* **Motor de Evaluaciones Dinámico:** Quizzes que actúan como bloqueadores de avance (ej. 80% para aprobar).
* **Certificación Segura:** PDFs con RUT estampado y código QR dinámico para validación pública.

## 3. Plan de Acción Detallado (Roadmap)

### Fase 1: Setup, Arquitectura Base y Autenticación
* 1.1. Inicialización de Next.js (App Router, Tailwind, TS) y conexión a Supabase.
* 1.2. Diseño de Base de Datos (SQL: perfiles, cursos, modulos, lecciones, evaluaciones, matriculas).
* 1.3. Sistema de Autenticación con validación de RUT.

### Fase 2: Panel de Administración (Back-Office)
* 2.1. Dashboard y CRUD de Cursos.
* 2.2. Constructor de Currículum (Módulos y Lecciones con drag & drop).
* 2.3. Constructor del Motor de Evaluaciones (Quizzes dinámicos).

### Fase 3: Catálogo Público y Landings
* 3.1. UI/UX Global (Navbar, Footer).
* 3.2. Página de Inicio y Catálogo con buscador/filtros.
* 3.3. Landings de Curso Dinámicas (`/cursos/[slug]`) con lógica condicional de botones.

### Fase 4: El Aula Virtual (Vista Alumno) y Evaluador Dinámico
* 4.1. Dashboard del Alumno (Mis Cursos y progreso).
* 4.2. Visor de Lecciones (Video, texto, marcar como completado).
* 4.3. Motor de Rendición de Quizzes con lógica de bloqueo por puntaje.

### Fase 5: Pasarela de Pagos y Motor de Certificados
* 5.1. Integración Transbank (Webpay Plus) en Next.js.
* 5.2. Motor de Certificados PDF (`react-pdf` o `jsPDF` con QR).
* 5.3. Sistema de Validación Pública (`/validar/[id]`).

### Fase 6: Despliegue y Preparación para Producción
* 6.1. Dockerización (Dockerfile optimizado).
* 6.2. CI/CD y despliegue en VPS.