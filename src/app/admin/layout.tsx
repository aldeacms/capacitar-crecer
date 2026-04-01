'use server'

import Link from 'next/link'
import { Toaster } from 'sonner'
import { LogOut, Shield } from 'lucide-react'
import { requireAdmin } from '@/lib/pocketbase-server'
import { clearServerAuth } from '@/lib/pocketbase-server'
import SidebarNav from '@/components/admin/SidebarNav'

async function handleLogout() {
  'use server'
  await clearServerAuth()
  // Note: Redirect happens client-side via form submission
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireAdmin()
  const userInitials = user?.email
    ? user.email
        .split('@')[0]
        .split('')
        .slice(0, 2)
        .map((c: string) => c.toUpperCase())
        .join('')
    : 'AD'

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Toaster position="top-right" richColors />
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-gray-900 text-white flex flex-col shadow-xl overflow-y-auto">
        <div className="p-6 border-b border-gray-800/50 shrink-0">
          <Link href="/admin" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-[#28B4AD] rounded-lg flex items-center justify-center">
              <Shield size={18} className="text-white" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-lg font-bold text-white">OTEC</span>
              <span className="text-xs text-[#28B4AD] font-semibold">Admin</span>
            </div>
          </Link>
        </div>

        <SidebarNav />

        <div className="p-4 border-t border-gray-800/50 text-xs text-gray-500 shrink-0">
          &copy; 2025 Capacitar y Crecer
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 ml-64 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 shrink-0 bg-white border-b border-gray-200/80 flex items-center justify-between px-8 z-10 shadow-sm">
          <div className="text-gray-600 text-sm">
            Bienvenido, <span className="font-semibold text-gray-900">{user?.email || 'Administrador'}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#28B4AD] to-teal-600 flex items-center justify-center text-white text-sm font-semibold">
                {userInitials}
              </div>
              <form action={handleLogout}>
                <button
                  type="submit"
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
                >
                  <LogOut size={16} />
                  <span>Salir</span>
                </button>
              </form>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 bg-gray-50">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
