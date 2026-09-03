#!/bin/bash

# ============================================
# Script de Instalación para macOS
# Nuestro Espacio - Aplicación para Parejas
# ============================================

set -e  # Detener si hay error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funciones de logging
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar si estamos en macOS
if [[ "$(uname)" != "Darwin" ]]; then
    log_warning "Este script está diseñado para macOS. Puedes continuar pero algunos comandos pueden no funcionar."
    read -p "¿Continuar? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

log_info "🚀 Iniciando instalación de Nuestro Espacio en macOS..."

# Paso 1: Verificar Homebrew
log_info "Verificando Homebrew..."
if ! command -v brew &> /dev/null; then
    log_warning "Homebrew no está instalado."
    read -p "¿Instalar Homebrew ahora? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    else
        log_error "Homebrew es requerido para esta instalación."
        exit 1
    fi
else
    log_success "Homebrew ya está instalado"
fi

# Paso 2: Verificar Node.js
log_info "Verificando Node.js..."
if ! command -v node &> /dev/null || [[ $(node -v | cut -d'v' -f2 | cut -d'.' -f1) -lt 18 ]]; then
    log_warning "Node.js 18+ no está instalado o es una versión antigua."
    read -p "¿Instalar Node.js 18 ahora? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        brew install node@18
        brew link node@18 --force
    else
        log_error "Node.js 18+ es requerido."
        exit 1
    fi
else
    log_success "Node.js $(node -v) ya está instalado"
fi

# Paso 3: Preguntar método de instalación
log_info "Selecciona el método de instalación:"
echo "1) Docker (Recomendado - requiere Docker Desktop)"
echo "2) Nativo (SQLite - más simple para desarrollo)"
echo "3) Nativo (PostgreSQL - requiere PostgreSQL instalado)"
read -p "Opción [1-3]: " install_method

case $install_method in
    1)
        # Instalación con Docker
        log_info "Verificando Docker..."
        if ! command -v docker &> /dev/null; then
            log_warning "Docker no está instalado."
            read -p "¿Instalar Docker Desktop ahora? (y/n) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                brew install --cask docker
                log_success "Docker Desktop instalado."
                log_info "⚠️  Debes abrir Docker Desktop manualmente para completarlo."
                open -a Docker
                log_info "Esperando a que Docker inicie (30 segundos)..."
                sleep 30
            else
                log_error "Docker es requerido para este método."
                exit 1
            fi
        else
            log_success "Docker ya está instalado"
        fi
        
        # Copiar .env
        log_info "Configurando variables de entorno..."
        if [ ! -f .env ]; then
            cp .env.example .env
            log_success "Archivo .env creado"
        else
            log_warning "El archivo .env ya existe, saltando..."
        fi
        
        # Iniciar Docker Compose
        log_info "Iniciando contenedores Docker..."
        docker-compose up -d
        
        log_success "¡Instalación completada con Docker!"
        log_info "La aplicación estará disponible en: http://localhost:3000"
        log_info "Para ver logs: docker-compose logs -f"
        log_info "Para detener: docker-compose down"
        ;;
        
    2|3)
        # Instalación nativa
        
        # Instalar dependencias del backend
        log_info "Instalando dependencias del backend..."
        cd backend
        npm install
        log_success "Dependencias del backend instaladas"
        
        # Configurar base de datos
        if [ "$install_method" = "2" ]; then
            # SQLite
            log_info "Configurando SQLite..."
            cd ..
            sed -i '' 's|DATABASE_URL=.*|DATABASE_URL="file:./backend/dev.db"|' .env
            cd backend
            
            # Crear directorios
            log_info "Creando estructura de directorios..."
            mkdir -p uploads/photos/{original,compressed,thumbnails}
            mkdir -p uploads/videos/{original,compressed}
            mkdir -p uploads/avatars
            mkdir -p uploads/temp
            mkdir -p backups
            mkdir -p logs
            log_success "Directorios creados"
            
            # Ejecutar migraciones
            log_info "Ejecutando migraciones de Prisma..."
            npx prisma migrate dev --name init
            npx prisma db seed
            log_success "Base de datos configurada"
            
        else
            # PostgreSQL
            log_info "Verificando PostgreSQL..."
            if ! command -v psql &> /dev/null; then
                log_warning "PostgreSQL no está instalado."
                read -p "¿Instalar PostgreSQL ahora? (y/n) " -n 1 -r
                echo
                if [[ $REPLY =~ ^[Yy]$ ]]; then
                    brew install postgresql
                    brew services start postgresql
                    log_success "PostgreSQL instalado e iniciado"
                else
                    log_error "PostgreSQL es requerido para este método."
                    exit 1
                fi
            else
                log_success "PostgreSQL ya está instalado"
            fi
            
            # Crear base de datos
            log_info "Creando base de datos..."
            createdb nuestro_espacio 2>/dev/null || log_warning "La base de datos ya existe"
            
            # Actualizar .env
            cd ..
            sed -i '' 's|DATABASE_URL=.*|DATABASE_URL="postgresql://'"$(whoami)"'@localhost:5432/nuestro_espacio"|' .env
            cd backend
            
            # Crear directorios
            log_info "Creando estructura de directorios..."
            mkdir -p uploads/photos/{original,compressed,thumbnails}
            mkdir -p uploads/videos/{original,compressed}
            mkdir -p uploads/avatars
            mkdir -p uploads/temp
            mkdir -p backups
            mkdir -p logs
            log_success "Directorios creados"
            
            # Ejecutar migraciones
            log_info "Ejecutando migraciones de Prisma..."
            npx prisma migrate dev --name init
            npx prisma db seed
            log_success "Base de datos configurada"
        fi
        
        cd ..
        
        # Instalar dependencias del frontend
        log_info "Instalando dependencias del frontend..."
        cd frontend
        npm install
        log_success "Dependencias del frontend instaladas"
        cd ..
        
        # Hacer ejecutables los scripts
        log_info "Configurando permisos..."
        chmod +x scripts/*.sh
        log_success "Permisos configurados"
        
        log_success "¡Instalación nativa completada!"
        log_info ""
        log_info "Para iniciar la aplicación:"
        log_info "  Terminal 1: cd backend && npm run dev"
        log_info "  Terminal 2: cd frontend && npm run dev"
        log_info ""
        log_info "Backend: http://localhost:5000"
        log_info "Frontend: http://localhost:5173"
        ;;
        
    *)
        log_error "Opción inválida"
        exit 1
        ;;
esac

log_info ""
log_success "============================================"
log_success "   ¡Nuestro Espacio está listo! 💕         "
log_success "============================================"
log_info ""
log_info "Próximos pasos:"
log_info "1. Abre tu navegador en la URL mostrada arriba"
log_info "2. Registra tu cuenta de usuario"
log_info "3. Invita a tu pareja usando el código de invitación"
log_info "4. ¡Disfruten su espacio privado!"
log_info ""
log_info "Documentación completa en README.md"
log_info ""
