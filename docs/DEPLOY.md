# Proceso de Deploy — Capacitar y Crecer

## Servidor de producción

| | |
|---|---|
| **URL** | https://cyc.luam.cl (temporal) → https://capacitarycrecer.cl (definitivo) |
| **Servidor** | Hetzner VPS `lifefocus-vps` — `204.168.156.157` |
| **Directorio** | `/var/www/capacitar-y-crecer` |
| **Puerto** | `3002` (interno Docker `3000`) |
| **Repo** | https://github.com/aldeacms/capacitar-crecer.git |

---

## Flujo de trabajo estándar

```
Cambios locales → pruebas en localhost:3000 → git push → deploy en producción
```

**Importante:** Siempre probar localmente antes de hacer push y deploy.

---

## 1. Desarrollo local

```bash
npm run dev        # http://localhost:3000
npm run build      # verificar que el build no rompe
```

---

## 2. Subir cambios a GitHub

```bash
git add <archivos>
git commit -m "descripción del cambio"
git push origin main
```

---

## 3. Actualizar producción

Conectarse al servidor:
```bash
ssh -i /tmp/deploy_key root@204.168.156.157
```

En el servidor, ejecutar:
```bash
cd /var/www/capacitar-y-crecer

# Bajar cambios del repo
git pull origin main

# Rebuild y reiniciar el container
docker compose up -d --build
```

El build tarda ~2 minutos. El container anterior sigue sirviendo tráfico hasta que el nuevo está listo.

---

## 4. Verificar el deploy

```bash
# Ver estado del container
docker ps

# Ver logs en tiempo real
docker logs capacitar-y-crecer -f

# Ver últimas 50 líneas de logs
docker logs capacitar-y-crecer --tail 50
```

---

## 5. Actualizar variables de entorno

Si hay cambios en las variables de entorno (`.env.production`):

1. Editar el archivo en el servidor:
```bash
nano /var/www/capacitar-y-crecer/.env.production
nano /var/www/capacitar-y-crecer/.env   # (copia del anterior, usada por docker compose)
```

2. Reiniciar el container:
```bash
cd /var/www/capacitar-y-crecer && docker compose up -d
```

---

## 6. Rollback (revertir un deploy)

```bash
cd /var/www/capacitar-y-crecer

# Ver commits disponibles
git log --oneline -10

# Volver a un commit anterior
git checkout <hash-del-commit>

# Rebuild con la versión anterior
docker compose up -d --build
```

---

## Migración de dominio (cuando esté listo)

Cuando se migre de `cyc.luam.cl` a `capacitarycrecer.cl`:

```bash
# 1. Actualizar Nginx
sed -i 's/cyc.luam.cl/capacitarycrecer.cl/g' /etc/nginx/sites-available/cyc-luam
mv /etc/nginx/sites-available/cyc-luam /etc/nginx/sites-available/capacitarycrecer
mv /etc/nginx/sites-enabled/cyc-luam /etc/nginx/sites-enabled/capacitarycrecer
nginx -t && systemctl reload nginx

# 2. Obtener nuevo certificado SSL
certbot --nginx -d capacitarycrecer.cl -m daniel@luam.cl
```

---

## Otros containers en el mismo servidor

| Container | Puerto | Proyecto |
|---|---|---|
| `lifefocuscrm-web` | 3000 | LifeFocus CRM |
| `lifefocuscrm-bot` | 3001 | LifeFocus WhatsApp Bot |
| `capacitar-y-crecer` | 3002 | Este proyecto |
