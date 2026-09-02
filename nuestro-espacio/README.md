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
- Node.js + Express.js
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

## 🚀 Instalación Rápida

### Prerrequisitos
- Node.js 18+
- Docker y Docker Compose (opcional)
- npm o yarn

### Opción 1: Docker (Recomendado)

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/nuestro-espacio.git
cd nuestro-espacio

# Copiar variables de entorno
cp .env.example .env

# Iniciar con Docker Compose
docker-compose up -d

# La aplicación estará disponible en http://localhost:3000
```

### Opción 2: Instalación Manual

```bash
# Instalar dependencias del backend
cd backend
npm install

# Configurar base de datos
cp .env.example .env
npx prisma migrate dev
npx prisma db seed

# Iniciar servidor backend
npm run dev

# En otra terminal, instalar dependencias del frontend
cd frontend
npm install

# Iniciar frontend
npm run dev
```

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
└── docker-compose.yml
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
