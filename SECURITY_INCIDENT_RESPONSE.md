# Respuesta a Incidente de Seguridad - Claves Expuestas

## Resumen del Incidente
Se detectaron claves JWT y credenciales de Supabase expuestas en el commit `c5461a2` del repositorio.

## Acciones Tomadas

### 1. Eliminación de Secretos del Código
- ✅ Removidas las claves hardcodeadas de `supabase-config/setup.ps1`
- ✅ Removidas las claves hardcodeadas de `supabase-config/setup.sh`
- ✅ Archivos actualizados para usar variables de entorno

### 2. Actualización de .gitignore
- ✅ Añadidos los archivos de configuración con secretos al .gitignore
- ✅ Prevención de futuros commits accidentales de archivos sensibles

### 3. Variables de Entorno
- ✅ El archivo `.env.local` ya contiene las variables necesarias
- ✅ El archivo `.env.example` está configurado como plantilla sin valores reales

## Acciones Requeridas URGENTES

### 1. Revocar y Regenerar Claves Comprometidas

⚠️ **IMPORTANTE**: Las siguientes claves han sido expuestas y DEBEN ser revocadas inmediatamente:

1. **JWT Anon Key**:
   - `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzU3NzQyOTcxLCJleHAiOjE5MTU0MjI5NzF9.KGlAaVNGKwAz_s_f102zrqTKmeEL-Xm09kMKEoTH_qw`

2. **Service Role Key**:
   - `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NTc3NDI5NzEsImV4cCI6MTkxNTQyMjk3MX0.vGarszHoycKKOjRjktk_NScacq4gAhwsZai4nnw6NfM`

### 2. Pasos para Regenerar las Claves

1. **Accede a tu panel de Supabase**:
   - Ve a la configuración de tu proyecto
   - Navega a Settings > API

2. **Regenera las claves**:
   - Haz clic en "Regenerate JWT Secret"
   - Esto generará nuevas claves anon y service_role

3. **Actualiza tu archivo `.env.local`**:
   ```bash
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-nueva-clave-anon
   SUPABASE_SERVICE_ROLE_KEY=tu-nueva-clave-service-role
   ```

4. **Actualiza las claves en producción**:
   - Actualiza las variables de entorno en tu servidor de producción
   - Reinicia los servicios para aplicar los cambios

### 3. Limpieza del Historial de Git

Para eliminar completamente las claves del historial de Git:

```bash
# Opción 1: Usando BFG Repo-Cleaner (recomendado)
bfg --replace-text passwords.txt repo.git

# Opción 2: Usando git filter-branch
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch supabase-config/setup.ps1 supabase-config/setup.sh" \
  --prune-empty --tag-name-filter cat -- --all

# Fuerza el push al repositorio remoto
git push origin --force --all
git push origin --force --tags
```

### 4. Monitoreo

- Revisa los logs de acceso de Supabase para detectar cualquier acceso no autorizado
- Considera implementar rotación automática de claves
- Configura alertas para detectar commits con secretos

## Prevención Futura

1. **Usa herramientas de detección de secretos**:
   - Instala pre-commit hooks con `detect-secrets` o `gitleaks`
   - Configura GitGuardian o similar en tu repositorio

2. **Nunca hardcodees secretos**:
   - Siempre usa variables de entorno
   - Usa un gestor de secretos para producción

3. **Revisa antes de commitear**:
   - Siempre revisa los cambios con `git diff` antes de hacer commit
   - Usa `git add -p` para revisar cambios línea por línea

## Contacto

Si detectas cualquier actividad sospechosa o necesitas ayuda adicional, contacta inmediatamente al equipo de seguridad.