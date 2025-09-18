# PowerShell Script para configurar Supabase Self-Hosted en Windows

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Supabase Self-Hosted Setup Script (Windows)" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Verificar que Docker está instalado
try {
    docker --version | Out-Null
    Write-Host "✓ Docker está instalado" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker no está instalado. Por favor instala Docker Desktop primero." -ForegroundColor Red
    Write-Host "Descarga desde: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
    exit 1
}

# Verificar que Docker Compose está instalado
try {
    docker-compose --version | Out-Null
    Write-Host "✓ Docker Compose está instalado" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker Compose no está instalado." -ForegroundColor Red
    exit 1
}

# Función para generar JWT secret
function Generate-JWTSecret {
    $bytes = New-Object byte[] 32
    [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    return [Convert]::ToBase64String($bytes).Replace("=", "").Replace("+", "").Replace("/", "").Substring(0, 32)
}

# Crear archivo .env si no existe
if (!(Test-Path ".env")) {
    Write-Host "Creando archivo .env..." -ForegroundColor Yellow

    $jwtSecret = Generate-JWTSecret
    $postgresPassword = Generate-JWTSecret

    $envContent = @"
# Database
POSTGRES_PASSWORD=$postgresPassword
POSTGRES_DB=postgres

# JWT
JWT_SECRET=$jwtSecret

# Auth
GOTRUE_SITE_URL=https://supabase.ycm360.com
GOTRUE_URI_ALLOW_LIST=https://ycm360.com,http://localhost:3000,http://localhost:3001

# Email (configure con tus credenciales SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_ADMIN_EMAIL=admin@ycm360.com

# Anon and Service Keys (debes generar estas con tu JWT_SECRET)
ANON_KEY=tu-anon-key-aqui
SERVICE_ROLE_KEY=tu-service-role-key-aqui
"@

    $envContent | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host "✓ Archivo .env creado" -ForegroundColor Green
    Write-Host "⚠ Por favor edita el archivo .env y configura las credenciales SMTP" -ForegroundColor Yellow
} else {
    Write-Host "✓ Archivo .env ya existe" -ForegroundColor Green
}

# Crear directorios necesarios
if (!(Test-Path "data\postgres")) {
    New-Item -ItemType Directory -Path "data\postgres" -Force | Out-Null
}
if (!(Test-Path "data\storage")) {
    New-Item -ItemType Directory -Path "data\storage" -Force | Out-Null
}
Write-Host "✓ Directorios creados" -ForegroundColor Green

# Función para verificar servicios
function Check-Services {
    Write-Host "`nVerificando servicios..." -ForegroundColor Yellow

    # Auth service
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:9999/health" -Method GET -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Host "✓ Auth service está funcionando" -ForegroundColor Green
        }
    } catch {
        Write-Host "✗ Auth service no responde" -ForegroundColor Red
    }

    # REST API
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -ErrorAction SilentlyContinue
        Write-Host "✓ REST API está funcionando" -ForegroundColor Green
    } catch {
        if ($_.Exception.Response.StatusCode -eq 404) {
            Write-Host "✓ REST API está funcionando" -ForegroundColor Green
        } else {
            Write-Host "✗ REST API no responde" -ForegroundColor Red
        }
    }

    # Storage
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5000/status" -Method GET -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Host "✓ Storage service está funcionando" -ForegroundColor Green
        }
    } catch {
        Write-Host "✗ Storage service no responde" -ForegroundColor Red
    }
}

# Menú principal
Write-Host "`n¿Qué deseas hacer?" -ForegroundColor Yellow
Write-Host "1) Iniciar servicios de Supabase"
Write-Host "2) Detener servicios de Supabase"
Write-Host "3) Reiniciar servicios de Supabase"
Write-Host "4) Ver logs de servicios"
Write-Host "5) Verificar estado de servicios"
Write-Host "6) Salir"

$option = Read-Host "Selecciona una opción"

switch ($option) {
    "1" {
        Write-Host "Iniciando servicios de Supabase..." -ForegroundColor Yellow
        docker-compose up -d
        Start-Sleep -Seconds 10
        Check-Services
    }
    "2" {
        Write-Host "Deteniendo servicios de Supabase..." -ForegroundColor Yellow
        docker-compose down
        Write-Host "✓ Servicios detenidos" -ForegroundColor Green
    }
    "3" {
        Write-Host "Reiniciando servicios de Supabase..." -ForegroundColor Yellow
        docker-compose restart
        Start-Sleep -Seconds 10
        Check-Services
    }
    "4" {
        Write-Host "Mostrando logs (Ctrl+C para salir)..." -ForegroundColor Yellow
        docker-compose logs -f
    }
    "5" {
        Check-Services
    }
    "6" {
        Write-Host "Adiós!" -ForegroundColor Green
        exit 0
    }
    default {
        Write-Host "Opción inválida" -ForegroundColor Red
        exit 1
    }
}

Write-Host "`n================================================" -ForegroundColor Green
Write-Host "Configuración completada!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host "`nURLs de los servicios:"
Write-Host "  Auth:     http://localhost:9999 -> https://supabase.ycm360.com/auth/v1"
Write-Host "  REST API: http://localhost:3000 -> https://supabase.ycm360.com/rest/v1"
Write-Host "  Realtime: http://localhost:4000 -> https://supabase.ycm360.com/realtime/v1"
Write-Host "  Storage:  http://localhost:5000 -> https://supabase.ycm360.com/storage/v1"
Write-Host "`nRecuerda configurar tu servidor web (nginx) con la configuración proporcionada" -ForegroundColor Yellow