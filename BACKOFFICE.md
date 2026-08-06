# Panel de administración · Piscina La Elisa

Guía para acceder y usar el *backoffice* del sitio: edición de precios, calendario de reservas y gestión de la galería de fotos, todo desde el celular.

---

## 1. Acceso al panel

Con el servidor corriendo, entra a:

```
http://TU-SERVIDOR:PUERTO/admin
```

En local normalmente es:

```
http://localhost:3000/admin
```

Si el panel no responde, revisa que el servidor esté levantado (`npm start`) y que uses el puerto correcto.

## 2. Credenciales

El panel está protegido por un **usuario y contraseña maestro** definidos **en el servidor** (variables de entorno), **no** en el JavaScript del navegador.

Valores por defecto:

| Variable | Valor por defecto |
|----------|-------------------|
| `ADMIN_USER` | `admin` |
| `ADMIN_PASS` | `admin` |
| `ADMIN_SECRET` | `cambia-esto-por-una-frase-secreta-larga` |

### Cambiar las credenciales (obligatorio antes de publicar)

1. Copia el archivo de ejemplo:
   ```bash
   cp .env.example .env
   ```
2. Edita `.env` y cambia `ADMIN_USER`, `ADMIN_PASS` y sobre todo `ADMIN_SECRET`:
   ```env
   ADMIN_USER=mi_usuario
   ADMIN_PASS=mi_clave_fuerte
   ADMIN_SECRET=una-frase-larga-e-irrepetible-para-la-sesion
   ```
3. Reinicia el servidor.

> Sin archivo `.env`, el servidor usa los valores por defecto (`admin` / `admin`).

## 3. Cómo funciona la sesión

- Al iniciar sesión correctamente se crea una cookie firmada con **JWT** usando `ADMIN_SECRET`.
- La cookie es **httpOnly** y `same-site=lax`, así que el navegador no la lee desde JavaScript.
- Todas las rutas `/api/admin/*` validan esa cookie; si no es válida responden `401`.
- La sesión dura **8 horas** o hasta pulsar **Salir**.

## 4. Pantallas del panel (3 pestañas)

### a) Precios
Formulario para modificar los valores que muestra la sección pública `#info`:
- Precio base, personas incluidas, precio por cada persona extra, tope de personas y anticipo.
- Precio de los adicionales: horno, nevera, wifi.
- Al **Guardar cambios** se escribe `data/prices.json` y la web lo muestra al instante.

### b) Calendario
Mismo calendario de disponibilidad en modo administrador:
- **Tocar un día disponible** abre una hoja inferior para crear una **reserva** (nombre, teléfono, notas) o **bloquear el día** (mantenimiento, sin datos).
- **Tocar un día reservado o bloqueado** muestra el detalle con opciones **Editar** o **Eliminar / liberar**.
- Los clientes públicos **no** ven estos datos privados: solo reciben el estado (disponible / reservado / bloqueado) vía `GET /api/availability`.

### c) Galería
- **Subir fotos**: selecciona una o varias (jpg, png o webp; máx. 5 MB cada una). El servidor las redimensiona y convierte a **webp** automáticamente.
- **Reordenar**: flechas ▲▼ para subir/bajar posición (en escritorio también puedes arrastrar para arriba/abajo con toggles).
- **Portada**: la estrella marca la foto destacada (etiqueta "Portada" amarilla).
- **Eliminar**: borra la foto de la lista y del archivo en el servidor.

## 5. Dónde vive la información

| Archivo | Contenido |
|---------|-----------|
| `data/prices.json` | Valores de precios y servicios |
| `data/reserved.json` | Reservas y bloqueos (`{"YYYY-MM-DD": {...}}`) |
| `data/gallery.json` | Metadata de las fotos (orden, portada, fecha de subida) |
| `public/images/gallery/` | Las imágenes físicas de la galería |
| `.env` | Credenciales y secreto del admin (NO subir a Git) |

## 6. Endpoints

Protegidos (requieren cookie de sesión):

| Método | Ruta |
|--------|------|
| POST | `/api/admin/login` |
| POST | `/api/admin/logout` |
| GET  | `/api/admin/session` |
| PUT  | `/api/admin/prices` |
| GET  | `/api/admin/reservations?month=YYYY-MM` |
| POST | `/api/admin/reservations` |
| PUT  | `/api/admin/reservations/:date` |
| DELETE | `/api/admin/reservations/:date` |
| GET  | `/api/admin/gallery` |
| POST | `/api/admin/gallery` (multipart, campo `photos`) |
| PUT  | `/api/admin/gallery/order` |
| DELETE | `/api/admin/gallery/:id` |

Públicos (sin sesión):

| Método | Ruta |
|--------|------|
| GET | `/api/prices` |
| GET | `/api/gallery` |
| GET | `/api/availability?month=YYYY-MM` |

## 7. Reglas y buenas prácticas

- **Cambia siempre** las credenciales y el `ADMIN_SECRET` antes de publicar.
- Sirve el sitio por **HTTPS** y protege `/admin` con capas extra si lo deseas (IP permitida, etc.).
- Añade `data/` y `.env` a tu `.gitignore` para no subirlos al repositorio.
- Las fotos subidas se redimensionan y convierten a `.webp` para que la web cargue rápido en móvil.