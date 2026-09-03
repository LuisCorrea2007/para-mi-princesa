# Nuestro Espacio 💑

> Una aplicación web completa, privada y auto-alojada para parejas. Sin nubes externas, sin terceros, solo ustedes dos.

![Estado](https://img.shields.io/badge/estado-listo_para_usar-success)
![Licencia](https://img.shields.io/badge/licencia-MIT-blue)
![Stack](https://img.shields.io/badge/stack-React_+_Node_+_PostgreSQL-orange)

## 🌟 Características Principales

- 🔒 **Privacidad Total**: Tus datos viven en tu servidor (o tu Mac), no en la nube de nadie
- 📸 **Galería Privada**: Almacenamiento local de fotos y videos con procesamiento automático
- 💌 **Notas y Respuestas**: Sistema de hilos de conversación románticos
- 📅 **Calendario de Citas**: Planifica el futuro juntos con recordatorios
- 🎁 **Lista de Deseos**: Sueños compartidos y metas de pareja
- ⏱️ **Contador de Tiempo**: Segundos exactos desde su inicio
- 💾 **Backup Automático**: Scripts integrados para nunca perder un recuerdo
- 📱 **Responsive**: Diseñado para verse perfecto en móvil y escritorio

---

## 🍎 Instalación en macOS - Método Recomendado (Docker)

**¿Por qué Docker?** Es la forma más fiable, limpia y rápida de ejecutar **Nuestro Espacio** en una Mac. Todo viene empaquetado y aislado, evitando conflictos de versiones de Node.js, base de datos o librerías de imágenes.

### Paso 1: Instalar Docker Desktop para Mac

1.  Abre tu terminal presionando `Cmd + Espacio`, escribe "Terminal" y presiona Enter

2.  **Opción A - Con Homebrew** (altamente recomendado):
    ```bash
    brew install --cask docker
    ```

3.  **Opción B - Sin Homebrew**:
    *   Ve a [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/)
    *   Descarga la versión para Mac (elige chip M1/M2/M3 o Intel según tu Mac)
    *   Abre el archivo `.dmg` descargado
    *   Arrastra el icono de Docker a tu carpeta de Aplicaciones

4.  **Importante**: Abre la aplicación **Docker Desktop** desde tu carpeta de Aplicaciones. 
    *   Espera a que el indicador **verde** aparezca en la barra de menú superior
    *   Esto significa que el motor de Docker está corriendo correctamente
    *   La primera vez puede pedirte permisos de administrador - acéptalos

### Paso 2: Clonar el Proyecto

En tu terminal, navega a donde quieras guardar el proyecto y clónalo:

```bash
# Navega a tu carpeta de proyectos preferida (ejemplos)
cd ~/Documents
# o
cd ~/Projects

# Clona el repositorio
git clone https://github.com/tu-usuario/nuestro-espacio.git

# Entra en la carpeta del proyecto
cd nuestro-espacio
```

### Paso 3: Configurar Variables de Entorno

El proyecto incluye un archivo `.env.example` con valores por defecto que funcionan perfectamente para desarrollo local en macOS.

```bash
# Copiar el archivo de ejemplo
cp .env.example .env
```

> **Nota importante**: La configuración por defecto ya funciona en macOS sin cambios. Solo necesitas editar el archivo `.env` si tienes otros servicios ocupando los puertos `3000` (frontend) o `5432` (base de datos).

Si quieres verificar o cambiar algo:
```bash
nano .env
# Usa Ctrl+X para salir, presiona Y para guardar cambios
```

### Paso 4: Construir y Ejecutar la Aplicación

Con Docker Desktop abierto (debes ver el icono verde en la barra de menú) y estando dentro de la carpeta `nuestro-espacio` en tu terminal, ejecuta:

```bash
docker-compose up -d --build
```

**¿Qué hace este comando?**
*   `docker-compose`: Herramienta para gestionar múltiples contenedores Docker simultáneamente
*   `up`: Crea e inicia todos los contenedores definidos
*   `-d`: "Detached mode" - se ejecuta en segundo plano (no bloquea tu terminal)
*   `--build`: Fuerza la construcción de las imágenes desde cero (necesario la primera vez)

**¿Qué está sucediendo internamente?**
1.  Docker descarga las imágenes base oficiales (Node.js 18, PostgreSQL 15, Nginx)
2.  Construye la imagen personalizada del backend instalando todas las dependencias
3.  Construye la imagen del frontend y compila la aplicación React para producción
4.  Crea una red interna segura entre todos los servicios
5.  Inicializa la base de datos PostgreSQL
6.  Ejecuta automáticamente las migraciones de Prisma para crear todas las tablas
7.  Inicia el servidor backend y el proxy Nginx

⏱️ **La primera vez puede tardar 3-5 minutos** dependiendo de tu conexión a internet. ¡Es completamente normal!

**Para ver el progreso en tiempo real:**
```bash
docker-compose logs -f
```
*(Presiona `Ctrl + C` cuando quieras dejar de ver los logs. Esto NO detiene el servidor).*

Busca mensajes como:
*   `"Backend running on port 4000"`
*   `"nginx: ready"`
*   `"database system is ready to accept connections"`

### Paso 5: ¡Acceder a la Aplicación!

Una vez que los contenedores estén funcionando, abre tu navegador web favorito (Safari, Chrome, Firefox) y visita:

## 👉 [http://localhost:3000](http://localhost:3000)

¡Deberías ver la pantalla de bienvenida de **Nuestro Espacio**! 🎉

**Primeros pasos:**
1.  Registra tu cuenta (la primera cuenta creada será la administradora)
2.  Configura tu perfil y fecha de aniversario
3.  ¡Comienza a crear recuerdos!

---

## 🛠️ Comandos Útiles para el Día a Día

Guarda esta tabla de referencia rápida. Todos estos comandos se ejecutan desde la carpeta `nuestro-espacio` en tu terminal.

| ¿Qué quieres hacer? | Comando | Notas |
| :--- | :--- | :--- |
| **Apagar la app** | `docker-compose down` | Detiene los contenedores temporalmente |
| **Encender la app** | `docker-compose up -d` | Inicia los contenedores existentes |
| **Reiniciar** | `docker-compose restart` | Útil si algo falla o se congela |
| **Ver logs en vivo** | `docker-compose logs -f` | Presiona `Ctrl+C` para salir |
| **Ver logs del backend** | `docker-compose logs -f backend` | Filtra por servicio |
| **Ver logs de la BD** | `docker-compose logs -f db` | Para debuggear problemas de DB |
| **Actualizar la app** | `git pull && docker-compose up -d --build` | Trae cambios y reconstruye |
| **Borrar TODO** ⚠️ | `docker-compose down -v` | **Elimina BD y datos permanentes** |

### Entrar a la Terminal del Backend

Si necesitas ejecutar comandos directamente dentro del contenedor del backend:

```bash
docker-compose exec backend bash
```

Una vez dentro puedes usar npm, prisma, etc. Para salir, escribe `exit`.

### Ver el Estado de los Contenedores

```bash
docker-compose ps
```

Muestra qué contenedores están corriendo, sus puertos y estado.

---

## 💾 Gestión de Backups (Copias de Seguridad)

Tu privacidad y seguridad son lo más importante. El sistema incluye scripts automáticos para respaldar **toda** tu información: base de datos + fotos + archivos.

Los backups se guardan en la carpeta `backups/` dentro de tu proyecto, accesible directamente desde tu Mac en Finder.

### Crear un Backup Manual

```bash
docker-compose exec backend npm run backup
```

Esto creará un archivo comprimido `.tar.gz` con fecha y hora en la carpeta `backups/`:
```
backups/backup-completo-2024-01-15-14-30-00.tar.gz
```

### Restaurar desde un Backup

Si necesitas recuperar tus datos (después de un reinicio total, por ejemplo):

```bash
# Primero asegúrate de que el archivo exista en la carpeta backups/
# Luego ejecuta:
docker-compose exec backend npm run restore -- --file nombre-del-backup.tar.gz
```

### Backups Automáticos

El sistema está configurado para hacer backups automáticos. Revisa tu archivo `.env`:

```env
BACKUP_SCHEDULE="0 3 * * *"      # Todos los días a las 3 AM (cron format)
BACKUP_RETENTION_DAYS=30         # Mantener backups de los últimos 30 días
```

Puedes personalizar estos valores según tus necesidades.

---

## 🐛 Solución de Problemas Comunes en macOS

### ❌ Error: "Port 3000 already in use"

**Problema**: Otro programa está usando el puerto 3000 (común si tienes otros proyectos de Node.js corriendo).

**Solución Opción A** - Cierra el otro programa:
```bash
# Encuentra qué proceso usa el puerto 3000
lsof -i :3000

# Mata el proceso (reemplaza PID con el número que aparezca)
kill -9 PID
```

**Solución Opción B** - Cambia el puerto en `.env`:
```bash
# Edita el archivo .env
nano .env

# Cambia esta línea:
FRONTEND_PORT=3001

# Guarda (Ctrl+X, Y, Enter) y reinicia:
docker-compose down && docker-compose up -d
```

Ahora accede en `http://localhost:3001`

---

### ❌ Error: "Database connection failed" al iniciar

**Problema**: La base de datos tarda un poco más en arrancar que el backend.

**Solución**:
```bash
# Espera 10 segundos y reinicia solo el backend
docker-compose restart backend
```

Si persiste, revisa los logs de la base de datos:
```bash
docker-compose logs db
```

---

### ❌ Error: "Permission denied" al subir fotos

**Problema**: En macOS, los permisos de carpetas montadas en Docker pueden ser delicados.

**Solución**:
```bash
# Crea las carpetas si no existen
mkdir -p uploads/photos uploads/avatars uploads/videos backups logs

# Da permisos de escritura (temporal para pruebas)
chmod -R 777 uploads backups logs

# Reinicia el backend
docker-compose restart backend
```

**Solución permanente y más segura**:
```bash
# Ajusta los permisos con tu usuario de Mac
sudo chown -R $(whoami):staff uploads backups logs
```

---

### ❌ Quiero empezar desde cero (borrar todo)

**Advertencia**: Esto eliminará todos los usuarios, fotos, notas y configuraciones. ¡No hay vuelta atrás!

```bash
# 1. Detener y borrar volúmenes (incluye la base de datos completa)
docker-compose down -v

# 2. Borrar archivos subidos manualmente
rm -rf uploads/*

# 3. Volver a construir y levantar
docker-compose up -d --build
```

Ahora tendrás la aplicación como recién instalada.

---

### ❌ Docker no responde o se queda "Starting"

**Solución**:
1.  Abre Docker Desktop (la aplicación gráfica)
2.  Ve a Settings (icono de engranaje) → Resources
3.  Aumenta la memoria RAM asignada (mínimo 4GB recomendado, ideal 8GB)
4.  Aumenta el CPU allocation (mínimo 2 CPUs)
5.  Reinicia Docker Desktop completamente (Quit Docker desde el menú y vuélvelo a abrir)
6.  Ejecuta: `docker-compose down && docker-compose up -d --build`

---

### ❌ Error: "Cannot find module" o problemas de dependencias

**Solución**: Reconstruye el contenedor del backend sin caché:
```bash
docker-compose build --no-cache backend
docker-compose up -d
```

---

## 🏗️ Arquitectura Técnica

Este proyecto es un **Monorepo** diseñado para ser 100% self-hosted y portable entre servidores.

### Tecnologías Utilizadas

| Capa | Tecnología | Propósito |
| :--- | :--- | :--- |
| **Frontend** | React 18 + Vite + TypeScript | Interfaz rápida, moderna y tipada |
| **Estilos** | Tailwind CSS + Framer Motion | Diseño responsive y animaciones fluidas |
| **Estado** | Zustand + React Query | Gestión eficiente del estado |
| **Backend** | Node.js + Express.js | API RESTful robusta y escalable |
| **Base de Datos** | PostgreSQL 15 | Almacenamiento relacional seguro |
| **ORM** | Prisma | Type-safe queries y migraciones fáciles |
| **Auth** | JWT + Bcrypt | Sesiones seguras y contraseñas encriptadas |
| **Archivos** | Multer + Sharp | Subida y procesamiento de imágenes |
| **Tiempo Real** | Socket.IO | Notificaciones instantáneas |
| **Proxy** | Nginx | Servidor web de alto rendimiento |
| **Contenedores** | Docker + Docker Compose | Portabilidad y aislamiento total |

### Estructura de Directorios

```
nuestro-espacio/
├── backend/              # Código del servidor API
│   ├── src/
│   │   ├── controllers/  # Lógica de negocio y handlers
│   │   ├── middleware/   # Auth, validaciones, seguridad
│   │   ├── routes/       # Endpoints de la API
│   │   ├── services/     # Servicios (archivos, email, backup)
│   │   └── utils/        # Funciones auxiliares
│   ├── prisma/           # Schema y migraciones de BD
│   ├── uploads/          # Archivos temporales internos
│   └── package.json
├── frontend/             # Código de la interfaz React
│   ├── src/
│   │   ├── components/   # Componentes reutilizables
│   │   ├── pages/        # Vistas principales
│   │   ├── hooks/        # Custom hooks de React
│   │   ├── stores/       # Estado global (Zustand)
│   │   └── utils/        # Funciones helper
│   └── package.json
├── docker/               # Configuración Docker
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   └── nginx.conf
├── scripts/              # Scripts de mantenimiento
│   ├── backup.sh
│   └── restore.sh
├── uploads/              # 📁 TUS FOTOS Y ARCHIVOS (Persistente en tu Mac)
├── backups/              # 💾 TUS COPIAS DE SEGURIDAD (Persistente en tu Mac)
├── logs/                 # Registros del sistema
├── docker-compose.yml    # Orquestación de contenedores
├── .env                  # ⚙️ Tu configuración (NO compartir)
└── README.md             # Este archivo
```

### Flujo de Datos

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│  Navegador  │ ───► │    Nginx    │ ───► │   Backend   │
│ localhost   │      │  (Puerto    │      │   (Node.js) │
│   :3000     │      │    80)      │      │  (Puerto    │
└─────────────┘      └─────────────┘      │    4000)    │
                                          └──────┬──────┘
                                                 │
                    ┌────────────────────────────┼────────────────────────────┐
                    │                            │                            │
                    ▼                            ▼                            ▼
            ┌───────────────┐           ┌───────────────┐           ┌───────────────┐
            │  PostgreSQL   │           │   Sistema de  │           │    Backups    │
            │   (Puerto     │           │   Archivos    │           │   (Carpeta    │
            │    5432)      │           │  (/uploads)   │           │   /backups)   │
            └───────────────┘           └───────────────┘           └───────────────┘
```

---

## 🔐 Seguridad y Privacidad

- **Sin terceros**: Ningún dato sale de tu computadora
- **Encriptación**: Contraseñas hasheadas con bcrypt, tokens JWT firmados
- **Aislamiento**: Docker protege el sistema operativo anfitrión
- **Backups**: Tú controlas dónde y cuándo se guardan las copias
- **HTTPS listo**: Configuración incluida para cuando uses un dominio propio

### Recomendaciones de Seguridad

1.  **Nunca compartas tu carpeta `nuestro-espacio`** públicamente (contiene tu `.env` con secretos)
2.  **Cambia las claves secretas** en `.env` antes de desplegar en un servidor público
3.  **Haz backups regulares** en un disco externo o servicio en la nube encriptado
4.  **Mantén Docker actualizado** para tener los últimos parches de seguridad
5.  **Usa contraseñas fuertes** para las cuentas de usuario

---

## 📝 Primeros Pasos Después de Instalar

1.  **Registra tu cuenta**: La primera cuenta creada será la administradora por defecto
2.  **Invita a tu pareja**: Desde el panel de configuración, genera un enlace o código de invitación seguro
3.  **Configura su fecha especial**: Establece la fecha de aniversario para activar el contador de tiempo
4.  **Sube su primera foto**: Prueba la galería con una foto especial para verificar que todo funciona
5.  **Escribe una nota**: Deja un mensaje bonito para que tu pareja lo descubra
6.  **Programa un backup**: Configura los backups automáticos en `.env`

---

## 🚀 Despliegue en Producción (Opcional)

Si quieres acceder a tu aplicación desde fuera de tu red local:

### Opción 1: Ngrok (Rápido y temporal)
```bash
brew install ngrok
ngrok http 3000
```

### Opción 2: Servidor propio con dominio
1.  Adquiere un dominio
2.  Configura DNS apuntando a tu IP pública
3.  Usa Nginx Proxy Manager o Caddy para HTTPS automático
4.  Configura reglas de firewall en tu router

### Opción 3: VPS en la nube
1.  Alquila un VPS (DigitalOcean, Linode, Hetzner)
2.  Sube el proyecto via Git
3.  Ejecuta `docker-compose up -d`
4.  Configura HTTPS con Let's Encrypt

---

## 🤝 Contribución y Licencia

Este proyecto es de código abierto bajo la licencia **MIT**. Siéntete libre de modificarlo, mejorarlo y adaptarlo a tus necesidades personales.

```
Copyright (c) 2024 Nuestro Espacio

Se concede permiso, gratuitamente, a cualquier persona que obtenga una copia
de este software y los archivos de documentación asociados (el "Software"),
para usar, copiar, modificar, fusionar, publicar, distribuir, sublicenciar
y/o vender copias del Software...
```

**Desarrollado con ❤️ para preservar momentos especiales.**

¿Tienes dudas, sugerencias o encontraste un bug? Abre un issue en el repositorio.

---

## 📞 Soporte

Para problemas específicos de macOS o Docker:
1.  Revisa la sección de [Solución de Problemas](#-solución-de-problemas-comunes-en-macos)
2.  Consulta los logs: `docker-compose logs -f`
3.  Verifica que Docker Desktop esté corriendo (icono verde)
4.  Asegúrate de tener al menos 4GB de RAM disponibles

**Recursos útiles:**
*   [Documentación oficial de Docker para Mac](https://docs.docker.com/desktop/mac/)
*   [Comandos esenciales de Docker](https://docs.docker.com/engine/reference/commandline/cli/)
