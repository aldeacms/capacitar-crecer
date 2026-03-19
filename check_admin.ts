import { getSupabaseAdmin } from '@/lib/supabase-admin'

async function checkAdmins() {
  const supabaseAdmin = getSupabaseAdmin()

  try {
    // Obtener usuarios admin
    const { data: admins, error: adminsError } = await supabaseAdmin
      .from('admin_users')
      .select('id, is_active')

    if (adminsError) {
      console.error('Error fetching admin_users:', adminsError)
      return
    }

    console.log('All users in admin_users table:')
    admins?.forEach(a => {
      console.log(`  ID: ${a.id} | Active: ${a.is_active}`)
    })

    const activeAdmins = admins?.filter(a => a.is_active) || []
    console.log(`\nActive admins: ${activeAdmins.length}`)

    if (activeAdmins.length > 0) {
      // Obtener info de auth.users
      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers()
      
      console.log('\nAdmin user details:')
      activeAdmins.forEach(admin => {
        const authUser = users?.find(u => u.id === admin.id)
        if (authUser) {
          console.log(`  Email: ${authUser.email}`)
          console.log(`  ID: ${admin.id}`)
        }
      })
    }
  } catch (err) {
    console.error('Error:', err)
  }
}

checkAdmins()
