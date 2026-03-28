'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, BookOpen, Tag, Ticket, Users, Settings, FileText, CreditCard, LucideIcon } from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  exact?: boolean
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, exact: true },
  { label: 'Cursos', href: '/admin/cursos', icon: BookOpen },
  { label: 'Categorías', href: '/admin/categorias', icon: Tag },
  { label: 'Cupones', href: '/admin/cupones', icon: Ticket },
  { label: 'Alumnos', href: '/admin/alumnos', icon: Users },
  { label: 'Páginas', href: '/admin/paginas', icon: FileText },
  { label: 'Pagos', href: '/admin/pagos', icon: CreditCard },
  { label: 'Configuración', href: '/admin/config', icon: Settings },
]

export default function SidebarNav() {
  const pathname = usePathname()

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <nav className="flex-1 p-4 space-y-2">
      {navItems.map((item) => {
        const Icon = item.icon
        const active = isActive(item.href, item.exact)

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
              active
                ? 'bg-white/10 text-white border-l-2 border-[#28B4AD] pl-3'
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Icon size={20} className="shrink-0" />
            <span className="text-sm font-medium">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
