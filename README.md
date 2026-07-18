Aquí tienes un **README.md** técnico y completo para tu proyecto de la Piscina La Elisa, basado en los archivos que me compartiste.

---

# Piscina La Elisa · Sitio Web

> Landing page moderna y responsiva para la Piscina La Elisa en Boyeros, La Habana. Muestra precios, servicios, galería de fotos, ubicación y contacto directo por WhatsApp.

## 📋 Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Tecnologías Utilizadas](#tecnologías-utilizadas)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Requisitos de Instalación](#requisitos-de-instalación)
- [Configuración](#configuración)
- [Desarrollo Local](#desarrollo-local)
- [Despliegue](#despliegue)
- [Personalización](#personalización)
- [SEO y Metadatos](#seo-y-metadatos)
- [Mantenimiento](#mantenimiento)
- [Créditos](#créditos)
- [Licencia](#licencia)

---

## Descripción General

Sitio web estático de una sola página (SPA) para promocionar el alquiler de una piscina privada. Incluye:

- **Hero** con animaciones y llamado a la acción
- **Sección de precios** con servicios incluidos y adicionales
- **Galería dinámica** que carga imágenes desde el servidor
- **Lightbox** para visualizar fotos a tamaño completo
- **Contacto** con enlaces directos a WhatsApp y teléfono
- **Mapa interactivo** de Google Maps
- **Diseño 100% responsivo** (mobile-first)
- **SEO optimizado** con meta tags y datos estructurados

### Características Técnicas

- Carga dinámica de imágenes vía API (`/api/gallery`)
- Animaciones de aparición con Intersection Observer
- Navegación suave (scroll behavior)
- Botón flotante de WhatsApp sticky
- Favicon y meta tags para redes sociales
- Soporte para modo oscuro del navegador

---

## Tecnologías Utilizadas

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **HTML5** | - | Estructura semántica |
| **CSS3** | - | Estilos y animaciones |
| **JavaScript (ES6)** | - | Interactividad y carga dinámica |
| **Google Fonts** | - | Fuentes Poppins & Baloo 2 |
| **Node.js** | v18+ | Servidor backend (si aplica) |
| **Express** | v4.x | API para servir imágenes |
| **Fetch API** | - | Carga de imágenes desde el servidor |

---

## Estructura del Proyecto

```
piscina-la-elisa/
├── index.html                 # Página principal
├── styles.css                 # Todos los estilos (CSS puro)
├── app.js                     # Lógica JavaScript (animaciones, galería, lightbox)
├── public/
│   ├── images/
│   │   ├── logo.webp          # Logo circular de la marca
│   │   └── gallery/           # Carpeta para fotos de la piscina
│   │       ├── foto1.webp
│   │       ├── foto2.webp
│   │       └── ... (todas las imágenes se cargan automáticamente)
│   ├── favicon.ico
│   ├── favicon-32x32.png
│   ├── favicon-16x16.png
│   ├── apple-touch-icon.png
│   └── site.webmanifest
├── server.js                  # Servidor Express (si usas backend)
├── package.json               # Dependencias y scripts
└── README.md                  # Este archivo
```

---

## Requisitos de Instalación

### Prerrequisitos

- Node.js v18 o superior
- npm o yarn
- Git (opcional, para control de versiones)

### Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/piscina-la-elisa.git
cd piscina-la-elisa
```

---

## Configuración

### 1. Instalar Dependencias

Si usas un servidor Node.js con Express:

```bash
npm install express
```

### 2. Estructura de Imágenes

Coloca todas las fotos de la piscina en la carpeta:

```
public/images/gallery/
```

**Formatos soportados:** `.webp`, `.jpg`, `.jpeg`, `.png` (se recomienda `.webp` para mejor rendimiento)

El script `app.js` cargará automáticamente todas las imágenes de esta carpeta.

### 3. Variables de Entorno (Opcional)

Si personalizas el puerto del servidor, crea un archivo `.env`:

```env
PORT=3000
```

---

## Desarrollo Local

### Opción 1: Servidor Node.js (Recomendado)

1. Inicia el servidor:
```bash
node server.js
```

2. Abre tu navegador en:
```
http://localhost:3000
```

### Opción 2: Servidor Estático (Sin Node.js)

Si solo quieres ver el HTML estático sin backend:

1. Usa la extensión **Live Server** de VS Code
2. O usa Python:
```bash
python -m http.server 8000
```
3. O usa Node.js `http-server`:
```bash
npx http-server .
```

**Nota:** Sin el servidor Express, la galería no cargará imágenes dinámicamente (el endpoint `/api/gallery` no estará disponible).

---

## Despliegue

### Opción 1: Hosting Estático (Vercel, Netlify, Cloudflare Pages)

1. Sube todo el proyecto a tu proveedor
2. Asegúrate de que la carpeta `public/images/gallery/` esté incluida
3. Si usas Vercel, configura las rutas para servir archivos estáticos

### Opción 2: Servidor VPS / Hosting Compartido

1. Sube todos los archivos a tu servidor
2. Instala Node.js en el servidor
3. Ejecuta el servidor con PM2 (para mantenerlo activo):
```bash
npm install -g pm2
pm2 start server.js --name "piscina-elisa"
```

### Opción 3: Hostinger (u otro proveedor con cPanel)

1. Sube los archivos a la carpeta `public_html`
2. Si no usas Node.js, elimina la dependencia del backend y usa un script estático
3. Configura el archivo `.htaccess` si es necesario

---

## Personalización

### Cambiar Colores

Edita las variables CSS en `styles.css`:

```css
:root {
  --blue: #29b6d8;          /* Color principal */
  --blue-deep: #14688a;     /* Azul oscuro */
  --yellow: #f5b700;        /* Amarillo de acento */
  --yellow-soft: #ffce40;   /* Amarillo claro */
}
```

### Cambiar Precios

1. **En el HTML** (línea ~120):
```html
<span class="price__amount">12 000 <small>CUP</small></span>
```

2. **En el meta description** (línea ~8):
```html
<meta name="description" content="Piscina La Elisa en Boyeros. Desde 12 000 CUP..." />
```

### Cambiar Números de WhatsApp

Busca en `index.html` las líneas con `wa.me/` y reemplaza los números:

```html
<a href="https://wa.me/5353603933?text=...">   <!-- Cámbialo -->
```

### Agregar o Quitar Servicios

Edita la sección de "Servicios adicionales" en `index.html` (líneas ~145-165):

```html
<li>
  <span class="addon__name">
    <span class="plan__ico"><!-- SVG --></span>
    Tu nuevo servicio
  </span>
  <span class="addon__price">500</span>
</li>
```

---

## SEO y Metadatos

### Meta Description (aparece en Google)

```html
<meta name="description" content="Piscina La Elisa en Boyeros. Desde 12 000 CUP hasta 15 personas. Incluye música y dominó. Servicios adicionales: horno, nevera con hielo y wifi. Abierto de 10:00 AM a 6:00 PM." />
```

### Favicon y PWA

El proyecto incluye:
- `favicon.ico`
- `favicon-32x32.png`
- `favicon-16x16.png`
- `apple-touch-icon.png`
- `site.webmanifest` (para instalación como app en móviles)

### Datos Estructurados (Schema.org)

El sitio **no** incluye datos estructurados actualmente. Se recomienda agregar JSON-LD para mejorar el SEO:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Piscina La Elisa",
  "address": "Boyeros, La Habana, Cuba",
  "priceRange": "12000 CUP"
}
</script>
```

### Verificación de Google Search Console

Agrega el registro TXT en Hostinger:

| Tipo | Nombre | Valor |
|------|--------|-------|
| TXT | `@` | `google-site-verification=TU_CODIGO` |

---

## Mantenimiento

### Agregar Nuevas Fotos

1. Coloca las imágenes en `public/images/gallery/`
2. El sitio las cargará automáticamente (sin necesidad de modificar código)
3. **Recomendación:** Usa formato `.webp` para mejor rendimiento

### Actualizar Precios

1. Edita el precio en `index.html`
2. Actualiza la meta description
3. Re-indexa en Google Search Console

### Limpiar Caché del Navegador

Los archivos `styles.css` y `app.js` tienen versionado con `?v=5`:

```html
<link rel="stylesheet" href="/css/styles.css?v=5" />
<script src="/js/app.js?v=5"></script>
```

Incrementa el número `v` cada vez que hagas cambios para forzar la recarga.

---

## Créditos

- **Diseño y Desarrollo:** Andy Clemente Gago
- **Framework:** CSS puro + JavaScript vanilla
- **Fuentes:** Google Fonts (Poppins + Baloo 2)
- **Iconos:** SVG personalizados

---

## Licencia

**© 2026 Piscina La Elisa. Todos los derechos reservados.**

---

## Contacto

Para consultas técnicas o soporte:
- 📧 Email: andyclemente@devisisoft.com
- 📱 WhatsApp: +53 53603933
- 🌐 LinkedIn: [Andy Clemente Gago](https://www.linkedin.com/in/andy-clemente-gago-7590362a4)
