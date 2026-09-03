# 🧪 Manual de Pruebas - Nuestro Espacio

Guía completa para probar todas las funcionalidades de la aplicación.

---

## 📋 Tabla de Contenidos

1. [Preparación del Entorno](#preparación-del-entorno)
2. [Prueba 1: Registro y Autenticación](#prueba-1-registro-y-autenticación)
3. [Prueba 2: Sistema de Notas](#prueba-2-sistema-de-notas)
4. [Prueba 3: Galería de Fotos](#prueba-3-galería-de-fotos)
5. [Prueba 4: Calendario de Eventos](#prueba-4-calendario-de-eventos)
6. [Prueba 5: Lista de Deseos](#prueba-5-lista-de-deseos)
7. [Prueba 6: Hitos de Relación](#prueba-6-hitios-de-relación)
8. [Prueba 7: Backup y Exportación](#prueba-7-backup-y-exportación)
9. [Checklist Final](#checklist-final)

---

## Preparación del Entorno

### Requisitos Previos

- ✅ Docker Desktop instalado y corriendo en tu Mac
- ✅ Navegador web (Chrome, Safari, Firefox)
- ✅ Terminal de macOS

### Paso 1: Iniciar la Aplicación

```bash
cd nuestro-espacio
docker-compose up -d --build
```

### Paso 2: Verificar que Todo esté Corriendo

```bash
docker-compose ps
```

Deberías ver 4 contenedores con estado "Up":
- `db` (PostgreSQL)
- `backend` (Node.js API)
- `frontend` (React)
- `nginx` (Proxy reverso)

### Paso 3: Abrir la Aplicación

1. Abre tu navegador
2. Ve a: **http://localhost:3000**
3. Deberías ver la página de login/registro

---

## Prueba 1: Registro y Autenticación

### Objetivo: Verificar el sistema de usuarios

#### Paso 1.1: Registrar Primer Usuario

1. Haz clic en "Registrarse" o "Crear cuenta"
2. Completa el formulario:
   - Email: `usuario1@ejemplo.com`
   - Contraseña: `password123`
   - Nombre: `Alex`
   - Fecha de aniversario: Selecciona una fecha especial
3. Haz clic en "Registrarse"

**Resultado Esperado:**
- ✅ Mensaje de éxito
- ✅ Redirección al dashboard
- ✅ Token guardado en localStorage

#### Paso 1.2: Registrar Segundo Usuario

1. Cierra sesión (Settings → Logout)
2. Registra otro usuario:
   - Email: `usuario2@ejemplo.com`
   - Contraseña: `password123`
   - Nombre: `Jordan`
3. Intenta registrar un tercer usuario

**Resultado Esperado:**
- ✅ Segundo usuario creado exitosamente
- ✅ Tercer usuario rechazado (máximo 2 usuarios)

#### Paso 1.3: Login

1. Cierra sesión
2. Ingresa credenciales del usuario 1
3. Haz clic en "Ingresar"

**Resultado Esperado:**
- ✅ Login exitoso
- ✅ Redirección al dashboard
- ✅ Nombre de usuario visible en header

#### Paso 1.4: Perfil de Usuario

1. Ve a Settings → Perfil
2. Actualiza tu nombre
3. Sube una foto de perfil (avatar)

**Resultado Esperado:**
- ✅ Perfil actualizado
- ✅ Avatar visible en toda la app

---

## Prueba 2: Sistema de Notas

### Objetivo: Probar creación, edición y respuestas de notas

#### Paso 2.1: Crear Nota

1. Ve a sección "Notas"
2. Haz clic en "Nueva Nota"
3. Completa:
   - Título: "Te amo ❤️"
   - Contenido: "Eres lo mejor que me ha pasado..."
   - Categoría: "Amor"
4. Guarda la nota

**Resultado Esperado:**
- ✅ Nota creada y visible en la lista
- ✅ Aparece con fecha actual
- ✅ Icono de categoría correcto

#### Paso 2.2: Responder Nota

1. Como segundo usuario, abre la nota creada
2. Escribe una respuesta: "Yo también te amo 💕"
3. Envía la respuesta

**Resultado Esperado:**
- ✅ Respuesta visible inmediatamente
- ✅ Notificación al autor original

#### Paso 2.3: Reaccionar a Nota

1. En cualquier nota, haz clic en el botón de reacción
2. Selecciona un emoji (❤️, ⭐, 😊)

**Resultado Esperado:**
- ✅ Reacción visible con contador
- ✅ Cambio de color al reaccionar

#### Paso 2.4: Marcar como Favorita

1. Haz clic en el ícono de estrella en una nota
2. Filtra por "Favoritas"

**Resultado Esperado:**
- ✅ Estrella marcada/desmarcada
- ✅ Filtro muestra solo favoritas

#### Paso 2.5: Buscar Notas

1. Usa la barra de búsqueda
2. Escribe una palabra clave del contenido

**Resultado Esperado:**
- ✅ Resultados filtrados en tiempo real
- ✅ Búsqueda insensible a mayúsculas

---

## Prueba 3: Galería de Fotos

### Objetivo: Probar subida y procesamiento de imágenes

#### Paso 3.1: Subir Foto Individual

1. Ve a sección "Fotos"
2. Haz clic en "Subir Foto"
3. Selecciona una imagen JPG/PNG de tu computadora
4. Agrega una descripción: "Nuestra primera cita"
5. Sube la foto

**Resultado Esperado:**
- ✅ Foto subida exitosamente
- ✅ Tres versiones creadas (original, compressed, thumbnail)
- ✅ Miniatura visible en galería

#### Paso 3.2: Subida Múltiple

1. Selecciona 3-5 fotos a la vez
2. Sube las fotos

**Resultado Esperado:**
- ✅ Todas las fotos procesadas
- ✅ Barra de progreso visible
- ✅ Vista previa de cada foto

#### Paso 3.3: Marcar como Favorita

1. Haz clic en el corazón de una foto
2. Filtra por "Favoritas"

**Resultado Esperado:**
- ✅ Foto marcada como favorita
- ✅ Filtro funciona correctamente

#### Paso 3.4: Ver Foto en Grande

1. Haz clic en cualquier foto
2. Navega entre fotos con flechas del teclado

**Resultado Esperado:**
- ✅ Lightbox se abre
- ✅ Navegación con teclado funciona
- ✅ Botón de cerrar visible

---

## Prueba 4: Calendario de Eventos

### Objetivo: Probar creación y gestión de citas

#### Paso 4.1: Crear Evento

1. Ve a sección "Calendario"
2. Haz clic en una fecha
3. Completa:
   - Título: "Cena romántica"
   - Descripción: "Restaurante italiano"
   - Hora: 20:00
   - Lugar: "Centro de la ciudad"
   - Categoría: "Romántico"
4. Guarda el evento

**Resultado Esperado:**
- ✅ Evento visible en calendario
- ✅ Marcador de color según categoría
- ✅ Recordatorio configurado

#### Paso 4.2: Responder a Evento

1. Como segundo usuario, ve al evento
2. Responde: "Aceptar"

**Resultado Esperado:**
- ✅ Estado de respuesta visible
- ✅ Notificación al creador

#### Paso 4.3: Ver Próximos Eventos

1. En Dashboard, revisa widget "Próximos Eventos"

**Resultado Esperado:**
- ✅ Lista de eventos futuros
- ✅ Ordenados por fecha
- ✅ Máximo 3-5 eventos mostrados

#### Paso 4.4: Exportar Calendario

1. Ve a Calendario → Exportar
2. Descarga archivo .ics

**Resultado Esperado:**
- ✅ Archivo descargado
- ✅ Formato compatible con Google Calendar/Apple Calendar

---

## Prueba 5: Lista de Deseos

### Objetivo: Probar sistema colaborativo de deseos

#### Paso 5.1: Crear Deseo

1. Ve a sección "Deseos"
2. Haz clic en "Nuevo Deseo"
3. Completa:
   - Título: "Viaje a París"
   - Descripción: "Visitar la Torre Eiffel"
   - Categoría: "Viajes"
   - Prioridad: 8/10
   - Presupuesto: $3000
4. Crea el deseo

**Resultado Esperado:**
- ✅ Deseo visible en la lista
- ✅ Barra de prioridad coloreada
- ✅ Voto automático del creador

#### Paso 5.2: Votar Deseo

1. Como segundo usuario, vota el deseo
2. Dale upvote (+1)

**Resultado Esperado:**
- ✅ Voto registrado
- ✅ Prioridad recalculada
- ✅ Contador de votos actualizado

#### Paso 5.3: Comentar Deseo

1. Agrega un comentario: "¡Me encantaría ir!"

**Resultado Esperado:**
- ✅ Comentario visible
- ✅ Fecha y autor mostrados

#### Paso 5.4: Marcar como Completado

1. Haz clic en "Completar" en un deseo

**Resultado Esperado:**
- ✅ Estado cambiado a completado
- ✅ Icono de check visible
- ✅ Fecha de completado registrada

---

## Prueba 6: Hitos de Relación

### Objetivo: Probar timeline de la relación

#### Paso 6.1: Crear Hito

1. Ve a sección "Hitos"
2. Haz clic en "Nuevo Hito"
3. Completa:
   - Título: "Primer beso"
   - Descripción: "Bajo las estrellas"
   - Fecha: Una fecha pasada
   - Foto: Opcional
4. Guarda el hito

**Resultado Esperado:**
- ✅ Hito visible en timeline
- ✅ Orden cronológico correcto
- ✅ Foto asociada (si se subió)

#### Paso 6.2: Ver Timeline

1. Revisa la vista de línea de tiempo

**Resultado Esperado:**
- ✅ Hitos ordenados por fecha
- ✅ Diseño visual atractivo
- ✅ Scroll suave

---

## Prueba 7: Backup y Exportación

### Objetivo: Verificar sistema de respaldo de datos

#### Paso 7.1: Crear Backup Manual

1. Ve a Settings → Admin
2. Haz clic en "Crear Backup"

**Resultado Esperado:**
- ✅ Backup generado exitosamente
- ✅ Archivo en /backups/
- ✅ Registro en base de datos

#### Paso 7.2: Ver Backups Existentes

1. Ve a Backups list

**Resultado Esperado:**
- ✅ Lista de backups con fechas
- ✅ Tamaño de cada backup visible
- ✅ Opción de eliminar

#### Paso 7.3: Exportar Todos los Datos

1. Haz clic en "Exportar Datos"
2. Descarga el archivo JSON

**Resultado Esperado:**
- ✅ Archivo JSON descargado
- ✅ Contiene todos los datos de la app
- ✅ Formato legible

#### Paso 7.4: Ver Estadísticas

1. Ve a Dashboard → Stats

**Resultado Esperado:**
- ✅ Contadores correctos (notas, fotos, eventos)
- ✅ Uso de almacenamiento calculado
- ✅ Gráficos o números visibles

---

## Checklist Final

Marca cada ítem probado:

### Autenticación
- [ ] Registro primer usuario
- [ ] Registro segundo usuario
- [ ] Rechazo tercer usuario
- [ ] Login exitoso
- [ ] Logout funciona
- [ ] Actualizar perfil
- [ ] Subir avatar

### Notas
- [ ] Crear nota
- [ ] Editar nota
- [ ] Eliminar nota
- [ ] Responder nota
- [ ] Reaccionar con emoji
- [ ] Marcar favorita
- [ ] Archivar nota
- [ ] Buscar notas
- [ ] Filtrar por categoría

### Fotos
- [ ] Subir foto individual
- [ ] Subida múltiple
- [ ] Procesamiento automático
- [ ] Ver en lightbox
- [ ] Marcar favorita
- [ ] Añadir descripción
- [ ] Eliminar foto

### Eventos
- [ ] Crear evento
- [ ] Editar evento
- [ ] Eliminar evento
- [ ] Responder invitación
- [ ] Ver calendario mensual
- [ ] Ver próximos eventos
- [ ] Exportar iCal

### Deseos
- [ ] Crear deseo
- [ ] Votar deseo
- [ ] Comentar deseo
- [ ] Marcar completado
- [ ] Eliminar deseo
- [ ] Filtrar por categoría

### Hitos
- [ ] Crear hito
- [ ] Ver timeline
- [ ] Asociar foto
- [ ] Eliminar hito

### Admin
- [ ] Crear backup
- [ ] Ver lista backups
- [ ] Exportar datos
- [ ] Ver estadísticas
- [ ] Ver uso almacenamiento

### UI/UX
- [ ] Diseño responsive (móvil)
- [ ] Modo oscuro/claro
- [ ] Animaciones suaves
- [ ] Notificaciones toast
- [ ] Loaders/skeletons
- [ ] Empty states atractivos

---

## 🎉 ¡Felicitaciones!

Si has completado todas las pruebas, tu aplicación está funcionando correctamente.

### Siguientes Pasos:

1. **Personaliza** colores y diseño
2. **Agrega** tus propias fotos y notas
3. **Configura** backups automáticos
4. **Disfruta** de tu espacio privado para parejas

---

## 🆘 Solución de Problemas Comunes

### "No puedo subir fotos"
- Verifica que Docker tenga acceso a tu carpeta de uploads
- Revisa logs: `docker-compose logs backend`

### "Las notas no aparecen en tiempo real"
- Verifica que Socket.IO esté conectado
- Revisa consola del navegador (F12)

### "Error de conexión a base de datos"
- Reinicia PostgreSQL: `docker-compose restart db`
- Espera 10 segundos antes de retry

### "El frontend no carga"
- Limpia caché del navegador
- Verifica que nginx esté corriendo: `docker-compose ps`

---

**Documentación creada para macOS con Docker**
Última actualización: 2024
