# Nuestro Espacio 💕

Una aplicación web completa y autocontenida para parejas. Totalmente self-hosted, sin dependencias externas, APIs de terceros o servicios en la nube.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18-green.svg)
![React](https://img.shields.io/badge/react-18-blue.svg)

## ✨ Características Principales

- 🔐 **Autenticación Segura**: JWT, 2FA opcional, sesiones persistentes
- 💌 **Sistema de Notas**: Con respuestas, reacciones y multimedia
- 📸 **Galería de Fotos**: Procesamiento automático, álbumes, tags
- 📅 **Calendario de Citas**: Eventos, recordatorios, exportación iCal
- 💫 **Lista de Deseos**: Votación colaborativa, presupuestos
- 🎯 **Hitos de Relación**: Timeline cronológico con fotos
- 🔔 **Notificaciones en Tiempo Real**: Socket.IO
- 💾 **Backup Automático**: Base de datos + archivos
- 🌙 **Modo Oscuro/Claro**: Diseño responsive y accesible

## 🚀 Instalación Rápida en macOS

### Método Recomendado: Docker (Más Fácil)

#### 1. Instalar Docker Desktop

```bash
# Usando Homebrew (recomendado)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install --cask docker

# O descarga directamente desde:
# https://www.docker.com/products/docker-desktop/
```

**Importante**: Abre Docker Desktop y espera hasta que veas el indicador verde "Engine running".

#### 2. Clonar y Configurar

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/nuestro-espacio.git
cd nuestro-espacio

# Copiar variables de entorno
cp .env.example .env

# (Opcional) Editar configuración
nano .env
```

#### 3. Iniciar la Aplicación

```bash
# Construir y levantar todos los servicios
docker-compose up -d --build

# Ver logs (opcional)
docker-compose logs -f
```

#### 4. Acceder a la Aplicación

Abre tu navegador y ve a: **http://localhost:3000**

¡Listo! La aplicación está corriendo.

---

## 📋 Comandos Útiles

| Acción | Comando |
|--------|---------|
| **Iniciar** | `docker-compose up -d` |
| **Detener** | `docker-compose down` |
| **Ver logs** | `docker-compose logs -f` |
| **Reiniciar** | `docker-compose restart` |
| **Crear backup** | `docker-compose exec backend npm run backup` |
| **Restaurar** | `docker-compose exec backend npm run restore -- --file backup.tar.gz` |
| **Reset completo** | `docker-compose down -v && rm -rf uploads/* backups/*` |
| **Ver estado** | `docker-compose ps` |
| **Acceder al contenedor** | `docker-compose exec backend bash` |

---

## 🗄️ Base de Datos

La aplicación usa **PostgreSQL** por defecto (configurado en Docker).

### Conexión Directa (para debugging)

```bash
# Conectarse a PostgreSQL
docker-compose exec db psql -U nuestro_espacio -d nuestro_espacio

# Comandos útiles dentro de psql:
\dt           # Listar tablas
\d users      # Ver estructura de tabla
SELECT * FROM "User" LIMIT 5;  # Consultar datos
\q            # Salir
```

### Migraciones

```bash
# Ejecutar migraciones manualmente
docker-compose exec backend npx prisma migrate dev

# Resetear base de datos (CUIDADO: borra todo)
docker-compose exec backend npx prisma migrate reset
```

---

## 📁 Estructura del Proyecto

```
nuestro-espacio/
├── backend/                 # API Node.js + Express
│   ├── src/
│   │   ├── controllers/    # Lógica de negocio
│   │   ├── routes/         # Endpoints API
│   │   ├── middleware/     # Auth, validación, errores
│   │   ├── services/       # Servicios (auth, archivos)
│   │   ├── config/         # Configuración DB
│   │   └── app.js          # Entry point
│   ├── prisma/
│   │   └── schema.prisma   # Modelos de DB
│   ├── uploads/            # Archivos subidos
│   └── backups/            # Backups automáticos
│
├── frontend/               # React + Vite + TypeScript
│   ├── src/
│   │   ├── components/     # Componentes UI
│   │   ├── pages/          # Páginas principales
│   │   ├── services/       # Llamadas API
│   │   ├── stores/         # Zustand (estado global)
│   │   ├── hooks/          # Custom hooks
│   │   └── styles/         # Tailwind CSS
│   └── public/             # Assets estáticos
│
├── docker/                 # Configuración Docker
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   └── nginx.conf
│
├── scripts/                # Scripts de mantenimiento
│   ├── backup.sh
│   └── install-mac.sh
│
├── docker-compose.yml      # Orquestación completa
├── .env.example            # Plantilla de variables
└── README.md               # Esta documentación
```

---

## 🔧 Variables de Entorno (.env)

```bash
# Backend
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://nuestro_espacio:nuestro_espacio@db:5432/nuestro_espacio?schema=public
JWT_SECRET=cambia-esto-en-produccion-abc123xyz
FRONTEND_URL=http://localhost:3000

# Frontend
VITE_API_URL=http://localhost:3001/api

# PostgreSQL
POSTGRES_USER=nuestro_espacio
POSTGRES_PASSWORD=nuestro_espacio
POSTGRES_DB=nuestro_espacio
```

**⚠️ Importante en Producción**: Cambia `JWT_SECRET` por un valor único y seguro.

---

## 🎨 Diseño y Personalización

### Colores Personalizados (Tailwind)

Edita `frontend/tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        50: '#fdf6f4',
        100: '#fae9e2',
        500: '#d4856b', // Terracota
        600: '#c07055',
        700: '#a05a42'
      },
      secondary: {
        400: '#f4d68a', // Dorado
        500: '#e5c46b',
        600: '#d4a94b'
      }
    }
  }
}
```

### Fuentes

La app usa **Playfair Display** (títulos) e **Inter** (cuerpo), cargadas desde Google Fonts en `frontend/index.html`.

---

## 🔒 Seguridad

- ✅ JWT con refresh tokens rotativos
- ✅ Encriptación bcrypt para contraseñas
- ✅ 2FA TOTP opcional (compatible con Google Authenticator)
- ✅ Rate limiting en endpoints sensibles
- ✅ Protección CSRF, XSS, SQL Injection
- ✅ Headers de seguridad con Helmet.js
- ✅ Validación de archivos subidos
- ✅ Límite de tamaño (50MB por archivo)

---

## 💾 Sistema de Backup

### Crear Backup Manual

```bash
# Desde Docker
docker-compose exec backend npm run backup

# El backup se guarda en: /backups/backup-YYYY-MM-DD.tar.gz
```

### Restaurar desde Backup

```bash
# Detener la aplicación
docker-compose down

# Copiar backup al contenedor
docker cp backup-2024-01-01.tar.gz backend:/backups/

# Restaurar
docker-compose exec backend npm run restore -- --file backup-2024-01-01.tar.gz

# Reiniciar
docker-compose up -d
```

### Backup Automático

Configurado para ejecutarse automáticamente los domingos a las 3 AM.

---

## 🐛 Troubleshooting

### Error: "Cannot connect to Docker daemon"

```bash
# Asegúrate de que Docker Desktop esté corriendo
# Busca el ícono de Docker en tu barra de menú
# Si no está, ábrelo desde Applications/Docker

# Verifica que el motor esté activo
docker ps
```

### Error: "Port 3000 already in use"

```bash
# Encuentra qué está usando el puerto
lsof -i :3000

# Mata el proceso (reemplaza PID con el número real)
kill -9 <PID>

# O cambia el puerto en docker-compose.yml
ports:
  - "3001:3000"  # Cambia 3000 por otro puerto
```

### Error: "Database connection failed"

```bash
# Reinicia el contenedor de PostgreSQL
docker-compose restart db

# Espera 10 segundos y verifica
docker-compose logs db

# Si persiste, resetea la DB (CUIDADO: pierde datos)
docker-compose down -v
docker-compose up -d db
sleep 10
docker-compose up -d backend frontend nginx
```

### Error: "Prisma migration failed"

```bash
# Reset de migraciones (desarrollo solamente)
docker-compose exec backend npx prisma migrate reset --force

# O elimina y recrea la DB
docker-compose down -v
docker-compose up -d
```

### Logs en Blanco / No Carga

```bash
# Ver logs detallados
docker-compose logs -f backend
docker-compose logs -f frontend

# Rebuild forzado
docker-compose up -d --build --force-recreate
```

---

## 📊 API Endpoints

### Autenticación
```
POST   /api/auth/register       # Registro
POST   /api/auth/login          # Login
POST   /api/auth/logout         # Logout
POST   /api/auth/refresh        # Refresh token
GET    /api/auth/me             # Usuario actual
PUT    /api/auth/me             # Actualizar perfil
POST   /api/auth/me/avatar      # Subir avatar
```

### Notas
```
GET    /api/notes               # Listar notas
POST   /api/notes               # Crear nota
GET    /api/notes/:id           # Obtener nota
PUT    /api/notes/:id           # Actualizar nota
DELETE /api/notes/:id           # Eliminar nota
POST   /api/notes/:id/replies   # Responder nota
POST   /api/notes/:id/favorite  # Marcar favorita
```

### Fotos
```
GET    /api/photos              # Listar fotos
POST   /api/photos/upload       # Subir foto
DELETE /api/photos/:id          # Eliminar foto
POST   /api/photos/:id/favorite # Marcar favorita
GET    /api/photos/search       # Buscar fotos
```

### Eventos
```
GET    /api/events              # Listar eventos
POST   /api/events              # Crear evento
GET    /api/events/upcoming     # Próximos eventos
DELETE /api/events/:id          # Eliminar evento
POST   /api/events/:id/respond  # Responder invitación
GET    /api/events/export/ical  # Exportar calendario
```

### Deseos
```
GET    /api/wishes              # Listar deseos
POST   /api/wishes              # Crear deseo
POST   /api/wishes/:id/vote     # Votar deseo
POST   /api/wishes/:id/complete # Marcar completado
DELETE /api/wishes/:id          # Eliminar deseo
```

### Admin
```
GET    /api/admin/stats         # Estadísticas
POST   /api/admin/backup        # Crear backup
GET    /api/admin/backups       # Listar backups
GET    /api/admin/export        # Exportar todos los datos
POST   /api/admin/cleanup       # Limpiar archivos
```

---

## 🧪 Datos de Prueba

Para probar la aplicación rápidamente:

1. Registra el primer usuario (crea el espacio de pareja)
2. Registra el segundo usuario (máximo 2 usuarios)
3. ¡Comienza a crear notas, subir fotos y agendar citas!

---

## 📱 Responsive Design

La aplicación está optimizada para:
- 📱 Móviles (320px+)
- 📱 Tablets (768px+)
- 💻 Desktop (1024px+)
- 🖥️ Large Desktop (1440px+)

---

## 🔐 Privacidad

- ✅ Todos los datos se almacenan localmente
- ✅ Sin trackers ni analytics externos
- ✅ Sin conexión a servicios de terceros
- ✅ Encriptación de contraseñas
- ✅ Control total de tus datos

---

## 📄 Licencia

MIT License - Libre uso y modificación.

---

## 🤝 Contribución

1. Fork el repositorio
2. Crea una rama (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📞 Soporte

Para issues o preguntas, abre un issue en GitHub.

---

**Hecho con 💕 para parejas que valoran su privacidad**
