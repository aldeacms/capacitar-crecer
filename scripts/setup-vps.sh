#!/bin/bash
# Script de configuración de VPS para Capacitar y Crecer con PocketBase
# Ejecutar como usuario con privilegios sudo

set -e

echo "========================================"
echo "Configuración de VPS para Capacitar y Crecer"
echo "========================================"

# Variables configurables
POCKETBASE_VERSION="0.22.14"
POCKETBASE_PORT="8090"
NEXTJS_PORT="3000"
DOMAIN="${1:-capacitarycrecer.cl}"
EMAIL_ADMIN="${2:-admin@${DOMAIN}}"

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_step() {
    echo -e "${GREEN}[+]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[x]${NC} $1"
}

# Verificar que se ejecute como root o con sudo
if [ "$EUID" -ne 0 ]; then 
    print_warning "Este script requiere privilegios sudo"
    sudo "$0" "$@"
    exit $?
fi

# Paso 1: Actualizar sistema
print_step "Actualizando sistema..."
apt-get update
apt-get upgrade -y

# Paso 2: Instalar Docker y Docker Compose
print_step "Instalando Docker y Docker Compose..."
apt-get install -y apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Habilitar y iniciar Docker
systemctl enable docker
systemctl start docker

# Agregar usuario actual al grupo docker (opcional)
if [ "$SUDO_USER" != "" ]; then
    usermod -aG docker $SUDO_USER
    print_step "Usuario $SUDO_USER agregado al grupo docker"
fi

# Paso 3: Instalar Nginx (para reverse proxy)
print_step "Instalando Nginx..."
apt-get install -y nginx certbot python3-certbot-nginx

# Configurar firewall (UFW)
print_step "Configurando firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw allow "$POCKETBASE_PORT"
ufw allow "$NEXTJS_PORT"
ufw --force enable

# Paso 4: Crear estructura de directorios
print_step "Creando estructura de directorios..."
mkdir -p /opt/capacitar-y-crecer
mkdir -p /opt/capacitar-y-crecer/pocketbase/{pb_migrations,pb_hooks}
mkdir -p /opt/capacitar-y-crecer/nginx/{conf.d,ssl,logs}
mkdir -p /opt/capacitar-y-crecer/scripts
mkdir -p /opt/capacitar-y-crecer/logs
mkdir -p /opt/capacitar-y-crecer/backups

# Establecer permisos
chown -R $SUDO_USER:$SUDO_USER /opt/capacitar-y-crecer
chmod -R 755 /opt/capacitar-y-crecer

# Paso 5: Crear usuario de sistema para PocketBase (opcional)
print_step "Creando usuario de sistema para PocketBase..."
useradd -r -s /bin/false pocketbase || true

# Paso 6: Crear archivo de entorno de ejemplo
print_step "Creando archivo de entorno de ejemplo..."
cat > /opt/capacitar-y-crecer/.env.example << 'EOF'
# Variables de PocketBase
POCKETBASE_ADMIN_EMAIL=admin@example.com
POCKETBASE_ADMIN_PASSWORD=ChangeMe123!
POCKETBASE_ADMIN_TOKEN=

# Variables de Supabase (durante transición)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Variables de aplicación
RESEND_API_KEY=
RESEND_FROM_EMAIL=

# Dominio
DOMAIN=capacitarycrecer.cl
NEXT_PUBLIC_APP_URL=https://capacitarycrecer.cl
EOF

# Paso 7: Crear script de backup automatizado
print_step "Creando script de backup..."
cat > /opt/capacitar-y-crecer/scripts/backup.sh << 'EOF'
#!/bin/bash
# Script de backup para PocketBase (SQLite) y archivos

BACKUP_DIR="/opt/capacitar-y-crecer/backups"
DATE=$(date +%Y%m%d_%H%M%S)
PB_DATA="/opt/capacitar-y-crecer/pocketbase_data"

mkdir -p "$BACKUP_DIR"

# Backup de base de datos SQLite
if [ -f "$PB_DATA/data.db" ]; then
    sqlite3 "$PB_DATA/data.db" ".backup '$BACKUP_DIR/pocketbase_$DATE.db'"
    gzip "$BACKUP_DIR/pocketbase_$DATE.db"
fi

# Backup de archivos uploads
if [ -d "/opt/capacitar-y-crecer/uploads" ]; then
    tar -czf "$BACKUP_DIR/uploads_$DATE.tar.gz" -C /opt/capacitar-y-crecer/uploads .
fi

# Backup de logs
if [ -d "/opt/capacitar-y-crecer/logs" ]; then
    tar -czf "$BACKUP_DIR/logs_$DATE.tar.gz" -C /opt/capacitar-y-crecer/logs .
fi

# Rotación: mantener últimos 30 días
find "$BACKUP_DIR" -name "*.gz" -type f -mtime +30 -delete
find "$BACKUP_DIR" -name "*.tar.gz" -type f -mtime +30 -delete

echo "Backup completado: $BACKUP_DIR/*_$DATE.*"
EOF

chmod +x /opt/capacitar-y-crecer/scripts/backup.sh

# Paso 8: Configurar cron job para backups diarios
print_step "Configurando cron job para backups..."
(crontab -l 2>/dev/null | grep -v "backup.sh"; echo "0 2 * * * /opt/capacitar-y-crecer/scripts/backup.sh >> /opt/capacitar-y-crecer/logs/backup.log 2>&1") | crontab -

# Paso 9: Configurar Nginx
print_step "Configurando Nginx..."
cat > /etc/nginx/sites-available/capacitar-y-crecer << 'EOF'
server {
    listen 80;
    server_name DOMAIN_PLACEHOLDER www.DOMAIN_PLACEHOLDER;

    # Redirigir a HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name DOMAIN_PLACEHOLDER www.DOMAIN_PLACEHOLDER;

    ssl_certificate /etc/letsencrypt/live/DOMAIN_PLACEHOLDER/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/DOMAIN_PLACEHOLDER/privkey.pem;

    # Configuración SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;

    # Reverse proxy para Next.js
    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Reverse proxy para PocketBase API (solo interno)
    location /api/pb/ {
        internal;
        proxy_pass http://localhost:8090;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Servir archivos estáticos de PocketBase
    location /pb/files/ {
        internal;
        proxy_pass http://localhost:8090;
        proxy_set_header Host $host;
    }

    # Logs
    access_log /var/log/nginx/capacitar-access.log;
    error_log /var/log/nginx/capacitar-error.log;
}
EOF

# Reemplazar dominio placeholder
sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" /etc/nginx/sites-available/capacitar-y-crecer

# Habilitar sitio
ln -sf /etc/nginx/sites-available/capacitar-y-crecer /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx

# Paso 10: Obtener certificado SSL (si dominio está configurado)
if [ "$DOMAIN" != "capacitarycrecer.cl" ]; then
    print_step "Solicitando certificado SSL para $DOMAIN..."
    certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --email "$EMAIL_ADMIN" || {
        print_warning "No se pudo obtener certificado SSL. Verifica que el dominio apunte a este servidor."
    }
fi

# Paso 11: Crear servicio systemd para PocketBase (opcional)
print_step "Creando servicio systemd para PocketBase..."
cat > /etc/systemd/system/pocketbase.service << 'EOF'
[Unit]
Description=PocketBase Server
After=network.target

[Service]
Type=simple
User=pocketbase
Group=pocketbase
WorkingDirectory=/opt/capacitar-y-crecer
ExecStart=/usr/local/bin/pocketbase serve --dir=/opt/capacitar-y-crecer/pocketbase_data
Restart=always
RestartSec=5
Environment="PB_ADMIN_EMAIL=admin@example.com"
Environment="PB_ADMIN_PASSWORD=ChangeMe123!"

[Install]
WantedBy=multi-user.target
EOF

# Paso 12: Instrucciones finales
print_step "Configuración completada!"
echo ""
echo "========================================"
echo "INSTALACIÓN COMPLETADA"
echo "========================================"
echo ""
echo "Pasos siguientes:"
echo "1. Copiar tu proyecto a /opt/capacitar-y-crecer"
echo "2. Configurar variables de entorno en .env.production"
echo "3. Ejecutar: cd /opt/capacitar-y-crecer && docker-compose -f docker-compose.pb.yml up -d"
echo "4. Verificar logs: docker-compose -f docker-compose.pb.yml logs -f"
echo ""
echo "Backups automatizados se ejecutarán diariamente a las 2:00 AM"
echo "Backups almacenados en: /opt/capacitar-y-crecer/backups/"
echo ""
echo "Para obtener soporte: contacto@capacitarycrecer.cl"
echo "========================================"