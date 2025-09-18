#!/bin/bash

echo "================================================"
echo "Supabase Self-Hosted Setup Script"
echo "================================================"

# Colores para la salida
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para generar JWT secret
generate_jwt_secret() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-32
}

# Verificar que Docker está instalado
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker no está instalado. Por favor instala Docker primero.${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Docker Compose no está instalado. Por favor instala Docker Compose primero.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker y Docker Compose están instalados${NC}"

# Crear archivo .env si no existe
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creando archivo .env...${NC}"

    # Generar JWT secret
    JWT_SECRET=$(generate_jwt_secret)

    cat > .env <<EOL
# Database
POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
POSTGRES_DB=postgres

# JWT
JWT_SECRET=$JWT_SECRET

# Auth
GOTRUE_SITE_URL=https://supabase.ycm360.com
GOTRUE_URI_ALLOW_LIST=https://ycm360.com,http://localhost:3000,http://localhost:3001

# Email (configure con tus credenciales SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_ADMIN_EMAIL=admin@ycm360.com

# Anon and Service Keys (generadas con el JWT_SECRET)
ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzU3NzQyOTcxLCJleHAiOjE5MTU0MjI5NzF9.KGlAaVNGKwAz_s_f102zrqTKmeEL-Xm09kMKEoTH_qw
SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NTc3NDI5NzEsImV4cCI6MTkxNTQyMjk3MX0.vGarszHoycKKOjRjktk_NScacq4gAhwsZai4nnw6NfM
EOL

    echo -e "${GREEN}✓ Archivo .env creado${NC}"
    echo -e "${YELLOW}⚠ Por favor edita el archivo .env y configura las credenciales SMTP${NC}"
else
    echo -e "${GREEN}✓ Archivo .env ya existe${NC}"
fi

# Crear directorios necesarios
mkdir -p data/postgres
mkdir -p data/storage
echo -e "${GREEN}✓ Directorios creados${NC}"

# Función para verificar el estado de los servicios
check_services() {
    echo -e "\n${YELLOW}Verificando servicios...${NC}"

    # Auth service
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:9999/health | grep -q "200"; then
        echo -e "${GREEN}✓ Auth service está funcionando${NC}"
    else
        echo -e "${RED}✗ Auth service no responde${NC}"
    fi

    # REST API
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|404"; then
        echo -e "${GREEN}✓ REST API está funcionando${NC}"
    else
        echo -e "${RED}✗ REST API no responde${NC}"
    fi

    # Realtime
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/socket/websocket | grep -q "400\|426"; then
        echo -e "${GREEN}✓ Realtime service está funcionando${NC}"
    else
        echo -e "${RED}✗ Realtime service no responde${NC}"
    fi

    # Storage
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/status | grep -q "200"; then
        echo -e "${GREEN}✓ Storage service está funcionando${NC}"
    else
        echo -e "${RED}✗ Storage service no responde${NC}"
    fi
}

# Menú principal
echo -e "\n${YELLOW}¿Qué deseas hacer?${NC}"
echo "1) Iniciar servicios de Supabase"
echo "2) Detener servicios de Supabase"
echo "3) Reiniciar servicios de Supabase"
echo "4) Ver logs de servicios"
echo "5) Verificar estado de servicios"
echo "6) Configurar base de datos inicial"
echo "7) Salir"

read -p "Selecciona una opción: " option

case $option in
    1)
        echo -e "${YELLOW}Iniciando servicios de Supabase...${NC}"
        docker-compose up -d
        sleep 10
        check_services
        ;;
    2)
        echo -e "${YELLOW}Deteniendo servicios de Supabase...${NC}"
        docker-compose down
        echo -e "${GREEN}✓ Servicios detenidos${NC}"
        ;;
    3)
        echo -e "${YELLOW}Reiniciando servicios de Supabase...${NC}"
        docker-compose restart
        sleep 10
        check_services
        ;;
    4)
        echo -e "${YELLOW}Mostrando logs (Ctrl+C para salir)...${NC}"
        docker-compose logs -f
        ;;
    5)
        check_services
        ;;
    6)
        echo -e "${YELLOW}Configurando base de datos inicial...${NC}"
        # Aquí puedes agregar comandos SQL para configurar la BD
        docker-compose exec db psql -U postgres -c "CREATE SCHEMA IF NOT EXISTS auth;"
        docker-compose exec db psql -U postgres -c "CREATE SCHEMA IF NOT EXISTS storage;"
        echo -e "${GREEN}✓ Base de datos configurada${NC}"
        ;;
    7)
        echo -e "${GREEN}Adiós!${NC}"
        exit 0
        ;;
    *)
        echo -e "${RED}Opción inválida${NC}"
        exit 1
        ;;
esac

echo -e "\n${GREEN}================================================${NC}"
echo -e "${GREEN}Configuración completada!${NC}"
echo -e "${GREEN}================================================${NC}"
echo -e "\nURLs de los servicios:"
echo -e "  Auth:     http://localhost:9999 -> https://supabase.ycm360.com/auth/v1"
echo -e "  REST API: http://localhost:3000 -> https://supabase.ycm360.com/rest/v1"
echo -e "  Realtime: http://localhost:4000 -> https://supabase.ycm360.com/realtime/v1"
echo -e "  Storage:  http://localhost:5000 -> https://supabase.ycm360.com/storage/v1"
echo -e "\n${YELLOW}Recuerda configurar tu servidor web (nginx) con la configuración proporcionada${NC}"