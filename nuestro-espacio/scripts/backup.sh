#!/bin/bash

# ===========================================
# SCRIPT DE BACKUP COMPLETO
# Nuestro Espacio - Backup System
# ===========================================

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración
BACKUP_DIR="${BACKUP_PATH:-./backups}"
UPLOADS_DIR="${UPLOAD_PATH:-./uploads}"
DB_NAME="${POSTGRES_DB:-nuestro_espacio}"
DB_USER="${POSTGRES_USER:-nuestro_espacio}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="backup_${TIMESTAMP}.zip"
BACKUP_PATH_FULL="${BACKUP_DIR}/${BACKUP_FILE}"

# Funciones de logging
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar dependencias
check_dependencies() {
    log_info "Verificando dependencias..."
    
    if ! command -v pg_dump &> /dev/null; then
        log_error "pg_dump no está instalado. Por favor instala PostgreSQL client."
        exit 1
    fi
    
    if ! command -v zip &> /dev/null; then
        log_error "zip no está instalado. Por favor instala zip."
        exit 1
    fi
    
    log_success "Dependencias verificadas"
}

# Crear directorio de backup si no existe
ensure_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        log_info "Creando directorio de backup: $BACKUP_DIR"
        mkdir -p "$BACKUP_DIR"
    fi
}

# Backup de base de datos
backup_database() {
    local temp_db_file="/tmp/nuestro_espacio_db_${TIMESTAMP}.sql"
    
    log_info "Iniciando backup de base de datos..."
    
    # Obtener DATABASE_URL del .env si existe
    if [ -f ".env" ]; then
        export $(grep -v '^#' .env | xargs)
    fi
    
    # Backup con pg_dump
    if [ -n "$DATABASE_URL" ]; then
        pg_dump "$DATABASE_URL" > "$temp_db_file"
    else
        pg_dump -U "$DB_USER" -h localhost "$DB_NAME" > "$temp_db_file"
    fi
    
    # Comprimir el SQL
    gzip "$temp_db_file"
    
    log_success "Backup de base de datos completado: ${temp_db_file}.gz"
    echo "${temp_db_file}.gz"
}

# Backup de archivos subidos
backup_uploads() {
    log_info "Iniciando backup de archivos subidos..."
    
    if [ -d "$UPLOADS_DIR" ]; then
        tar -czf "/tmp/nuestro_espacio_uploads_${TIMESTAMP}.tar.gz" -C "$(dirname $UPLOADS_DIR)" "$(basename $UPLOADS_DIR)"
        log_success "Backup de uploads completado"
        echo "/tmp/nuestro_espacio_uploads_${TIMESTAMP}.tar.gz"
    else
        log_warning "Directorio de uploads no encontrado: $UPLOADS_DIR"
        echo ""
    fi
}

# Crear backup completo
create_backup() {
    local backup_type="${1:-full}" # full, database, files
    
    log_info "=========================================="
    log_info "Iniciando backup - Tipo: $backup_type"
    log_info "=========================================="
    
    ensure_backup_dir
    
    local temp_dir="/tmp/nuestro_espacio_backup_${TIMESTAMP}"
    mkdir -p "$temp_dir"
    
    # Backup de base de datos
    if [ "$backup_type" = "full" ] || [ "$backup_type" = "database" ]; then
        db_backup=$(backup_database)
        cp "$db_backup" "$temp_dir/"
    fi
    
    # Backup de archivos
    if [ "$backup_type" = "full" ] || [ "$backup_type" = "files" ]; then
        uploads_backup=$(backup_uploads)
        if [ -n "$uploads_backup" ]; then
            cp "$uploads_backup" "$temp_dir/"
        fi
    fi
    
    # Copiar archivo .env (opcional, solo configuración)
    if [ "$backup_type" = "full" ] && [ -f ".env" ]; then
        cp .env "$temp_dir/.env.backup"
        log_info "Archivo .env incluido en el backup"
    fi
    
    # Crear ZIP final
    log_info "Comprimiendo backup..."
    cd /tmp
    zip -r "$BACKUP_PATH_FULL" "nuestro_espacio_backup_${TIMESTAMP}"
    
    # Limpiar archivos temporales
    rm -rf "$temp_dir"
    rm -f "$db_backup" "$uploads_backup"
    
    # Obtener tamaño del backup
    backup_size=$(du -h "$BACKUP_PATH_FULL" | cut -f1)
    
    log_success "=========================================="
    log_success "Backup completado exitosamente!"
    log_success "Archivo: $BACKUP_FILE"
    log_success "Tamaño: $backup_size"
    log_success "=========================================="
    
    # Registrar backup en la base de datos (si está disponible)
    # Esto se haría vía API en producción
}

# Limpieza de backups antiguos
cleanup_old_backups() {
    local retention_days="${1:-30}"
    
    log_info "Limpiando backups antiguos (más de $retention_days días)..."
    
    find "$BACKUP_DIR" -name "backup_*.zip" -type f -mtime +$retention_days -delete
    
    log_success "Limpieza completada"
}

# Listar backups disponibles
list_backups() {
    log_info "Backups disponibles:"
    echo ""
    
    if [ -d "$BACKUP_DIR" ]; then
        ls -lh "$BACKUP_DIR"/backup_*.zip 2>/dev/null || echo "No hay backups disponibles"
    else
        echo "Directorio de backups no encontrado"
    fi
}

# Restaurar desde backup
restore_backup() {
    local backup_file="$1"
    
    if [ -z "$backup_file" ]; then
        log_error "Debes especificar un archivo de backup"
        exit 1
    fi
    
    if [ ! -f "$backup_file" ]; then
        log_error "Archivo de backup no encontrado: $backup_file"
        exit 1
    fi
    
    log_warning "=========================================="
    log_warning "RESTAURACIÓN DE BACKUP"
    log_warning "=========================================="
    log_warning "Esto sobrescribirá los datos actuales"
    read -p "¿Estás seguro de continuar? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        log_info "Restauración cancelada"
        exit 0
    fi
    
    # Extraer backup
    temp_dir="/tmp/nuestro_espacio_restore_$(date +%s)"
    mkdir -p "$temp_dir"
    unzip "$backup_file" -d "$temp_dir"
    
    # Restaurar base de datos
    db_file=$(find "$temp_dir" -name "*.sql.gz" | head -1)
    if [ -n "$db_file" ]; then
        log_info "Restaurando base de datos..."
        gunzip -c "$db_file" | psql -U "$DB_USER" -h localhost "$DB_NAME"
        log_success "Base de datos restaurada"
    fi
    
    # Restaurar archivos
    uploads_file=$(find "$temp_dir" -name "*uploads*.tar.gz" | head -1)
    if [ -n "$uploads_file" ]; then
        log_info "Restaurando archivos subidos..."
        tar -xzf "$uploads_file" -C "./"
        log_success "Archivos restaurados"
    fi
    
    # Limpiar
    rm -rf "$temp_dir"
    
    log_success "=========================================="
    log_success "Restauración completada!"
    log_success "=========================================="
}

# Mostrar ayuda
show_help() {
    echo "Nuestro Espacio - Sistema de Backup"
    echo ""
    echo "Uso: $0 [comando] [opciones]"
    echo ""
    echo "Comandos:"
    echo "  create [full|database|files]  Crear backup (default: full)"
    echo "  restore <archivo>             Restaurar desde backup"
    echo "  list                          Listar backups disponibles"
    echo "  cleanup [días]                Limpiar backups antiguos (default: 30)"
    echo "  help                          Mostrar esta ayuda"
    echo ""
    echo "Ejemplos:"
    echo "  $0 create                     Crear backup completo"
    echo "  $0 create database            Crear solo backup de BD"
    echo "  $0 restore backup_20240101.zip Restaurar backup específico"
    echo "  $0 cleanup 60                 Limpiar backups de más de 60 días"
}

# Main
main() {
    case "${1:-help}" in
        create)
            check_dependencies
            create_backup "${2:-full}"
            ;;
        restore)
            check_dependencies
            restore_backup "$2"
            ;;
        list)
            list_backups
            ;;
        cleanup)
            cleanup_old_backups "${2:-30}"
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            log_error "Comando desconocido: $1"
            show_help
            exit 1
            ;;
    esac
}

main "$@"
