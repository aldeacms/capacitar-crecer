import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { Toaster } from 'sonner'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Por ahora dejamos pasar si no hay user para desarrollo, pero en prod debería redirigir
  // if (!user) redirect('/login')

  const navItems = [
    { label: 'Dashboard', href: '/admin' },
    { label: 'Cursos', href: '/admin/cursos' },
    { label: 'Categorías', href: '/admin/categorias' },
    { label: 'Alumnos', href: '/admin/alumnos' },
    { label: 'Configuración', href: '/admin/config' },
  ]

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Toaster position="top-right" richColors />
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-gray-900 text-white flex flex-col shadow-xl overflow-y-auto">
        <div className="p-6 text-2xl font-bold border-b border-gray-800 shrink-0">
          <span className="text-[#28B4AD]">OTEC</span> Admin
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-4 py-2.5 rounded-lg hover:bg-gray-800 transition-colors duration-200"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-800 text-xs text-gray-500 shrink-0">
          &copy; 2024 Capacitar y Crecer
        </div>
      </aside>

      {/* Main Content Area (Lado Derecho) - Crítico para el scroll horizontal */}
      <div className="flex-1 ml-64 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 shrink-0 bg-white border-b border-gray-200 flex items-center justify-between px-8 z-10">
          <div className="text-gray-500 text-sm">
            Bienvenido, <span className="font-semibold text-gray-800">{user?.email || 'Administrador'}</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-sm text-gray-600 hover:text-gray-900 font-medium">
              Cerrar Sesión
            </button>
          </div>
        </header>

        {/* Page Content - Área escroleable verticalmente */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 bg-slate-50/50">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
