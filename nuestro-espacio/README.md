# Nuestro Espacio 💕

Una aplicación web completa y autocontenida para parejas, diseñada para funcionar 100% self-hosted sin dependencias de servicios externos.

## ✨ Características Principales

- **🔐 Autenticación Segura**: Registro, login, recuperación de contraseña y 2FA opcional
- **📝 Sistema de Notas**: Notas con hilos de conversación, reacciones y multimedia
- **📸 Galería de Fotos**: Subida masiva, procesamiento automático y álbumes personalizados
- **📅 Calendario de Citas**: Eventos, recordatorios y sugerencias personalizadas
- **💫 Lista de Deseos**: Planes compartidos con votación y seguimiento
- **📖 Diario de la Relación**: Timeline cronológico con hitos importantes
- **🔔 Notificaciones en Tiempo Real**: Socket.io para actualizaciones instantáneas
- **💾 Backup Automático**: Sistema completo de backup y restauración

## 🛠️ Stack Tecnológico

### Backend
- Node.js 18+ + Express.js
- PostgreSQL / SQLite
- Prisma ORM
- JWT Authentication
- Socket.io
- Sharp (procesamiento de imágenes)

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- Zustand + React Query
- React Hook Form + Zod

---

## 🍎 Instalación en macOS

### Prerrequisitos para macOS

Antes de comenzar, asegúrate de tener instaladas las siguientes herramientas en tu Mac:

#### 1. Instalar Homebrew (si no lo tienes)
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### 2. Instalar Node.js 18+
```bash
brew install node@18
```

#### 3. Instalar Docker Desktop para Mac (Opción Recomendada)
- Descarga desde: [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)
- O usa Homebrew:
```bash
brew install --cask docker
```

#### 4. Alternativa: PostgreSQL nativo (para instalación manual)
```bash
brew install postgresql
brew services start postgresql
```

#### 5. Verificar instalaciones
```bash
node --version    # Debe mostrar v18.x.x o superior
npm --version     # Debe mostrar 9.x.x o superior
docker --version  # Si usas Docker
```

---

## 🚀 Métodos de Instalación

### Opción 1: Docker (Recomendado para macOS) ⭐

Esta es la forma más fácil y rápida de ejecutar la aplicación en tu Mac.

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/nuestro-espacio.git
cd nuestro-espacio

# 2. Copiar variables de entorno
cp .env.example .env

# 3. Asegurar permisos correctos en macOS
chmod +x scripts/*.sh

# 4. Iniciar con Docker Compose
docker-compose up -d

# 5. Ver logs (opcional)
docker-compose logs -f

# La aplicación estará disponible en http://localhost:3000
# El backend API en http://localhost:5000
```

**Detener la aplicación:**
```bash
docker-compose down
```

**Reiniciar:**
```bash
docker-compose restart
```

**Ver estado:**
```bash
docker-compose ps
```

---

### Opción 2: Instalación Manual Nativa en macOS

Si prefieres correr todo nativamente en tu Mac sin Docker:

#### Paso 1: Preparar el entorno

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/nuestro-espacio.git
cd nuestro-espacio

# Copiar variables de entorno
cp .env.example .env
```

#### Paso 2: Configurar Base de Datos

**Opción A: Usando SQLite (Más simple, recomendado para desarrollo)**

Editar `.env` y cambiar:
```env
DATABASE_URL="file:./dev.db"
```

Luego ejecutar:
```bash
cd backend
npx prisma migrate dev
npx prisma db seed
```

**Opción B: Usando PostgreSQL nativo**

```bash
# Crear base de datos
createdb nuestro_espacio

# Actualizar .env con:
# DATABASE_URL="postgresql://$(whoami)@localhost:5432/nuestro_espacio"

cd backend
npx prisma migrate dev
npx prisma db seed
```

#### Paso 3: Instalar y ejecutar Backend

```bash
cd backend

# Instalar dependencias
npm install

# Crear directorios necesarios
mkdir -p uploads/photos/{original,compressed,thumbnails}
mkdir -p uploads/videos/{original,compressed}
mkdir -p uploads/avatars
mkdir -p uploads/temp
mkdir -p backups
mkdir -p logs

# Ejecutar migraciones (si no lo hiciste antes)
npx prisma migrate dev

# Iniciar en modo desarrollo
npm run dev
```

El backend estará corriendo en `http://localhost:5000`

#### Paso 4: Instalar y ejecutar Frontend (en otra terminal)

```bash
cd frontend

# Instalar dependencias
npm install

# Iniciar en modo desarrollo
npm run dev
```

El frontend estará corriendo en `http://localhost:5173`

---

### Opción 3: Script de Instalación Automática para macOS

```bash
# Desde el directorio del proyecto
cd nuestro-espacio

# Ejecutar script de instalación
./scripts/install-mac.sh
```

Este script automatiza todos los pasos anteriores.

---

## 📁 Estructura del Proyecto

```
nuestro-espacio/
├── backend/           # Servidor API
│   ├── src/
│   │   ├── config/    # Configuración
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   ├── prisma/        # Schema y migraciones
│   ├── uploads/       # Archivos subidos
│   └── backups/       # Backups automáticos
├── frontend/          # Aplicación React
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── stores/
│   │   └── services/
│   └── public/
├── docker/            # Configuración Docker
├── scripts/           # Scripts de mantenimiento
│   ├── backup.sh      # Script de backup completo
│   ├── restore.sh     # Script de restauración
│   └── install-mac.sh # Instalación automática macOS
├── docker-compose.yml
├── .env.example       # Variables de entorno de ejemplo
├── README.md          # Documentación principal
└── INSTALACION_MACOS.md  # Guía detallada para macOS
```

## 🔧 Scripts Disponibles

### Backend
```bash
npm run dev          # Desarrollo con hot-reload
npm run build        # Compilar para producción
npm run start        # Iniciar en producción
npm run backup       # Crear backup completo
npm run restore      # Restaurar desde backup
npm run cleanup      # Limpiar archivos temporales
npm run migrate      # Ejecutar migraciones
npm run seed         # Datos de prueba
```

### Frontend
```bash
npm run dev          # Desarrollo
npm run build        # Compilar para producción
npm run preview      # Vista previa de producción
```

## 🔐 Variables de Entorno

Crear un archivo `.env` basado en `.env.example`:

```env
# Backend
NODE_ENV=development
PORT=5000
DATABASE_URL="postgresql://user:password@localhost:5432/nuestro_espacio"
JWT_SECRET=tu_secreto_muy_seguro
JWT_REFRESH_SECRET=tu_secreto_refresh
UPLOAD_MAX_SIZE=10485760

# Frontend
VITE_API_URL=http://localhost:5000/api
```

## 💾 Sistema de Backup

### Backup Automático
El sistema realiza backups automáticos configurables:
- Diario: 2:00 AM
- Semanal: Domingos 3:00 AM
- Mensual: Día 1, 4:00 AM

### Backup Manual
```bash
# Desde el backend
npm run backup

# O usando el script
./scripts/backup.sh
```

### Restaurar Backup
```bash
npm run restore -- --file=backups/backup-2024-01-01.zip
```

## 🔒 Seguridad

- HTTPS obligatorio en producción
- Rate limiting en endpoints sensibles
- Protección contra XSS, CSRF, SQL Injection
- Encriptación de contraseñas con bcrypt
- JWT con refresh tokens
- Validación de todos los inputs
- Headers de seguridad con Helmet.js

## 📱 Responsive Design

La aplicación está diseñada con enfoque mobile-first y es completamente responsive:
- Mobile: 320px+
- Tablet: 768px+
- Desktop: 1024px+

## 🎨 Personalización

### Colores
Los colores pueden personalizarse en `frontend/src/styles/tailwind.config.js`:
- Primario: Terracota suave
- Secundario: Dorado
- Fondo: Crema/Beige
- Acentos: Tonos cálidos

### Tipografía
- Títulos: Playfair Display
- Cuerpo: Inter

## 🤝 Contribución

1. Fork el repositorio
2. Crea una rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Distribuido bajo la licencia MIT. Ver `LICENSE` para más información.

## 🆘 Soporte

Para issues y preguntas:
- GitHub Issues: [Reportar bug](https://github.com/tu-usuario/nuestro-espacio/issues)
- Email: soporte@nuestro-espacio.local

## 🙏 Agradecimientos

Gracias por usar Nuestro Espacio. ¡Esperamos que disfruten esta herramienta para fortalecer su relación! 💕

---

**Hecho con ❤️ para parejas en todo el mundo**
