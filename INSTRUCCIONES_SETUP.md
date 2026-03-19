# 🔧 INSTRUCCIONES: Configurar Admin User

**Tiempo:** 5 minutos
**Dificultad:** ⭐ Muy fácil
**Usuario Admin:** daniel@lifefocus.agency

---

## 📋 PASO 1: Abre Supabase Dashboard

1. Ve a: **https://app.supabase.com**
2. Login con tu cuenta
3. Selecciona tu proyecto: **capacitar-y-crecer**

---

## 📝 PASO 2: Abre SQL Editor

1. En el menú lateral izquierdo, ve a: **SQL Editor**
2. Haz clic en el botón **+ New Query**
3. Se abrirá una ventana de editor SQL

---

## 🔗 PASO 3: Copia el SQL

Opción A (Desde archivo):
```
File → SETUP_ADMIN.sql (en tu proyecto)
```

Opción B (Copia directamente):
```sql
-- Crear tabla admin_users
CREATE TABLE public.admin_users (
    id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- Habilitar RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Política de seguridad
CREATE POLICY "Admins can view own record" ON public.admin_users
  FOR SELECT TO authenticated
  USING (id = auth.uid());

-- Insertar admin user
INSERT INTO public.admin_users (id, is_active)
VALUES ('7983c049-fa7b-42d9-bfba-41fbdfc57eb2', true)
ON CONFLICT (id) DO UPDATE SET is_active = true;
```

---

## 🚀 PASO 4: Ejecuta el SQL

1. **Pega el SQL** en el editor
2. Haz clic en el botón azul **▶ RUN** (arriba a la derecha)
3. Espera a que se complete (unos 2-3 segundos)

**Resultado esperado:** Verás un mensaje verde ✅ "1 row inserted"

---

## ✅ PASO 5: Verifica que funciona

1. En tu navegador, ve a: **http://localhost:3000/login**
2. Login con:
   - **Email:** daniel@lifefocus.agency
   - **Contraseña:** (la que uses normalmente)
3. Si el login funciona, navega a: **http://localhost:3000/admin**
4. Deberías ver: **"Dashboard Administrativo"** con métricas

---

## ❓ Si algo falla

### Error: "relation does not exist"
- La tabla no se creó bien
- Intenta ejecutar el SQL otra vez

### Error: "permission denied"
- Tu usuario Supabase no tiene permisos
- Verifica que estés usando SUPABASE_SERVICE_ROLE_KEY (no la ANON key)

### Login no funciona
- Verifica que el email sea exacto: **daniel@lifefocus.agency**
- Asegúrate de tener el servidor Next.js corriendo: `npm run dev`

---

## 📞 Soporte

Si todo esto no funciona, corre en tu terminal:
```bash
cd /Users/daniel/Desktop/Antigravity/Capacitar\ y\ Crecer
NEXT_PUBLIC_SUPABASE_URL="https://qablhrycgplkgmzurtke.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhYmxocnljZ3Bsa2dtenVydGtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUzMTgyMCwiZXhwIjoyMDg5MTA3ODIwfQ.VCsRgKCtU2_Re8Ea1iuBVT1t0jfZ5_Gu1Oujd--ABiM" \
node scripts/setup-admin.mjs
```

Esto verificará si todo está bien configurado.

---

## ✅ Checklist Final

- [ ] SQL ejecutado en Supabase
- [ ] Tabla `admin_users` creada
- [ ] Usuario insertado
- [ ] Login funciona
- [ ] `/admin` es accesible
- [ ] Dashboard se muestra

**Una vez completes esto, tu LMS estará listo para funcionar! 🚀**
