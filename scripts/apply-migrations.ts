import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function applyMigrations() {
  console.log('🔄 Aplicando migraciones a la BD...\n')

  try {
    // SQL para actualizar el enum tipo_acceso
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TYPE tipo_acceso_new AS ENUM ('gratis', 'pago-inmediato', 'pago', 'gratis_cert_pago', 'cotizar');
        ALTER TABLE cursos ALTER COLUMN tipo_acceso TYPE tipo_acceso_new USING tipo_acceso::text::tipo_acceso_new;
        DROP TYPE tipo_acceso;
        ALTER TYPE tipo_acceso_new RENAME TO tipo_acceso;
      `
    })

    if (error) {
      throw error
    }

    console.log('✅ Migraciones aplicadas exitosamente')
  } catch (err: any) {
    console.error('❌ Error:', err.message)
    console.log('\n⚠️  Método automático no disponible.')
    console.log('Ejecuta este SQL manualmente en Supabase console:\n')
    console.log(`
      -- Paso 1: Crear nuevo enum con todos los valores
      CREATE TYPE tipo_acceso_new AS ENUM ('gratis', 'pago-inmediato', 'pago', 'gratis_cert_pago', 'cotizar');
      
      -- Paso 2: Convertir la columna al nuevo tipo
      ALTER TABLE cursos 
      ALTER COLUMN tipo_acceso TYPE tipo_acceso_new USING tipo_acceso::text::tipo_acceso_new;
      
      -- Paso 3: Eliminar el tipo viejo
      DROP TYPE tipo_acceso;
      
      -- Paso 4: Renombrar el tipo nuevo
      ALTER TYPE tipo_acceso_new RENAME TO tipo_acceso;
    `)
  }
}

applyMigrations()
