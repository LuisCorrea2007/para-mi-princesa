# Guía de Instalación y Ejecución en macOS 💻🍎

## Resumen Rápido

**Método más fácil (Docker):**
```bash
git clone https://github.com/tu-usuario/nuestro-espacio.git
cd nuestro-espacio
cp .env.example .env
docker-compose up -d
```

**Método automático (Script):**
```bash
./scripts/install-mac.sh
```

---

## Prerrequisitos

### 1. Instalar Homebrew (Gestor de paquetes para macOS)

Si no tienes Homebrew instalado:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Después de instalar, sigue las instrucciones que aparecen en pantalla para agregar Homebrew a tu PATH.

### 2. Verificar Node.js

```bash
node --version
```

Debe mostrar v18.x.x o superior. Si no:

```bash
brew install node@18
```

### 3. Opciones Disponibles

| Método | Dificultad | Requiere | Recomendado para |
|--------|-----------|----------|------------------|
| **Docker** | Fácil | Docker Desktop | Producción, facilidad |
| **Nativo SQLite** | Medio | Nada extra | Desarrollo rápido |
| **Nativo PostgreSQL** | Avanzado | PostgreSQL | Producción, escalabilidad |

---

## Método 1: Docker (Recomendado) ⭐

### Paso 1: Instalar Docker Desktop

**Opción A: Descargar desde la web**
1. Ve a [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)
2. Descarga la versión para Mac
3. Arrastra Docker a la carpeta Aplicaciones
4. Abre Docker Desktop y completa la configuración

**Opción B: Usar Homebrew**
```bash
brew install --cask docker
```

### Paso 2: Clonar el proyecto

```bash
git clone https://github.com/tu-usuario/nuestro-espacio.git
cd nuestro-espacio
```

### Paso 3: Configurar variables de entorno

```bash
cp .env.example .env
```

### Paso 4: Iniciar la aplicación

```bash
docker-compose up -d
```

### Paso 5: Verificar que todo esté corriendo

```bash
docker-compose ps
```

Deberías ver 3 contenedores: `postgres`, `backend`, y `frontend`.

### Paso 6: Acceder a la aplicación

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Base de datos**: localhost:5432

### Comandos útiles de Docker

```bash
# Ver logs en tiempo real
docker-compose logs -f

# Ver logs solo del backend
docker-compose logs -f backend

# Detener la aplicación
docker-compose down

# Reiniciar
docker-compose restart

# Reconstruir contenedores
docker-compose up -d --build

# Limpiar todo (incluyendo volúmenes)
docker-compose down -v
```

---

## Método 2: Instalación Nativa con SQLite (Más Simple)

Ideal para desarrollo rápido sin necesidad de Docker.

### Paso 1: Clonar el proyecto

```bash
git clone https://github.com/tu-usuario/nuestro-espacio.git
cd nuestro-espacio
```

### Paso 2: Configurar para SQLite

Editar el archivo `.env` y cambiar la línea de DATABASE_URL:

```bash
# Abrir el archivo
nano .env

# Cambiar esta línea:
DATABASE_URL="file:./dev.db"
```

O usar este comando:
```bash
sed -i '' 's|DATABASE_URL=.*|DATABASE_URL="file:./dev.db"|' .env
```

### Paso 3: Instalar dependencias del backend

```bash
cd backend
npm install

# Crear directorios necesarios
mkdir -p uploads/photos/{original,compressed,thumbnails}
mkdir -p uploads/videos/{original,compressed}
mkdir -p uploads/avatars
mkdir -p uploads/temp
mkdir -p backups
mkdir -p logs
```

### Paso 4: Configurar base de datos

```bash
npx prisma migrate dev --name init
npx prisma db seed
```

### Paso 5: Iniciar el backend

```bash
npm run dev
```

El backend estará corriendo en http://localhost:5000

### Paso 6: En otra terminal, instalar y ejecutar el frontend

```bash
cd frontend
npm install
npm run dev
```

El frontend estará corriendo en http://localhost:5173

---

## Método 3: Instalación Nativa con PostgreSQL

Para producción o si prefieres PostgreSQL nativo.

### Paso 1: Instalar PostgreSQL

```bash
brew install postgresql
brew services start postgresql
```

### Paso 2: Crear base de datos

```bash
createdb nuestro_espacio
```

### Paso 3: Configurar .env

```bash
sed -i '' 's|DATABASE_URL=.*|DATABASE_URL="postgresql://'"$(whoami)"'@localhost:5432/nuestro_espacio"|' .env
```

### Paso 4: Seguir los pasos 3-6 del Método 2

---

## Script de Instalación Automática 🚀

Existe un script que automatiza todo el proceso:

```bash
cd nuestro-espacio
chmod +x scripts/install-mac.sh
./scripts/install-mac.sh
```

El script te hará preguntas interactivas y configurará todo automáticamente.

---

## Solución de Problemas Comunes

### Docker no inicia

1. Abre Docker Desktop manualmente desde Aplicaciones
2. Espera a que el ícono del barco se ponga verde
3. Verifica en la terminal: `docker ps`

### Error de permisos en macOS

```bash
# Dar permisos de ejecución
chmod +x scripts/*.sh

# Si hay problemas con archivos subidos
sudo chown -R $(whoami) backend/uploads
```

### Puerto ya en uso

Si el puerto 3000 o 5000 está ocupado:

```bash
# Ver qué usa el puerto
lsof -i :3000
lsof -i :5000

# Matar el proceso (cuidado)
kill -9 <PID>
```

O cambia los puertos en `docker-compose.yml` o `.env`.

### Node.js versión incorrecta

```bash
# Usar nvm para manejar versiones
brew install nvm
nvm install 18
nvm use 18
```

### PostgreSQL no inicia

```bash
# Reiniciar servicio
brew services restart postgresql

# Ver estado
brew services list
```

### Errores de Prisma

```bash
# Resetear base de datos
npx prisma migrate reset

# Regenerar cliente
npx prisma generate
```

---

## Verificación de Instalación Exitosa

### Para Docker:

```bash
docker-compose ps
# Debe mostrar 3 contenedores "Up"

curl http://localhost:5000/api/health
# Debe responder con JSON de estado
```

### Para instalación nativa:

```bash
# Backend debe estar corriendo en puerto 5000
curl http://localhost:5000/api/health

# Frontend debe estar corriendo en puerto 5173
# Abre http://localhost:5173 en tu navegador
```

---

## Primeros Pasos Después de Instalar

1. **Abre la aplicación** en tu navegador
2. **Registra tu cuenta** con email y contraseña
3. **Configura tu perfil** (nombre, foto, fecha de aniversario)
4. **Invita a tu pareja** usando el sistema de invitación
5. **¡Comienza a crear recuerdos!**

---

## Comandos de Mantenimiento

### Backup

```bash
# Con Docker
docker-compose exec backend npm run backup

# Nativo
cd backend
npm run backup
```

### Restaurar backup

```bash
# Con Docker
docker-compose exec backend npm run restore -- --file=backups/backup-fecha.zip

# Nativo
cd backend
npm run restore -- --file=backups/backup-fecha.zip
```

### Limpieza

```bash
cd backend
npm run cleanup
```

### Actualizar la aplicación

```bash
git pull
docker-compose down
docker-compose up -d --build
```

---

## Desinstalación

### Docker:

```bash
cd nuestro-espacio
docker-compose down -v
# Opcional: eliminar imágenes
docker rmi nuestro-espacio-backend nuestro-espacio-fronted
```

### Nativo:

```bash
# Eliminar base de datos
dropdb nuestro_espacio

# Eliminar directorio del proyecto
rm -rf nuestro-espacio
```

---

## Soporte

Si tienes problemas:

1. Revisa los logs: `docker-compose logs` o revisa `backend/logs/`
2. Consulta el README.md principal
3. Abre un issue en GitHub
4. Verifica que todos los prerrequisitos estén instalados correctamente

---

**¡Disfruta de Nuestro Espacio! 💕**
