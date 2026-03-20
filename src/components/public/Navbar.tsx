'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { User, Menu, X, LogOut, Settings, BookOpen, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase-client'

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [perfil, setPerfil] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [adminSubmenuOpen, setAdminSubmenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  // Cargar usuario actual
  useEffect(() => {
    const loadUser = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)

        if (user) {
          // Obtener perfil del usuario
          const { data: perfilData } = await supabase
            .from('perfiles')
            .select('id, nombre_completo, rol')
            .eq('id', user.id)
            .single()
          setPerfil(perfilData)
        }
      } catch (error) {
        console.error('Error loading user:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { name: 'INICIO', href: '/' },
    { name: 'CURSOS', href: '/cursos' },
    { name: 'CONTÁCTANOS', href: '/contacto' },
  ]

  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true
    if (path !== '/' && pathname.startsWith(path)) return true
    return false
  }

  const handleLogout = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      setUser(null)
      setPerfil(null)
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-slate-900/95 backdrop-blur-md py-3 shadow-lg' : 'bg-transparent py-6'
      }`}
    >
      <div className="container mx-auto px-6 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-white text-xl shadow-lg shadow-emerald-500/20">
            C
          </div>
          <div className="flex flex-col">
            <span className="text-white font-bold leading-none tracking-tight">CAPACITAR</span>
            <span className="text-emerald-500 text-xs font-bold leading-none">& CRECER</span>
          </div>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`transition-all text-sm tracking-widest ${
                isActive(link.href)
                  ? 'text-emerald-500 font-black border-b-2 border-emerald-500 pb-1'
                  : 'text-slate-300 hover:text-emerald-500 font-medium'
              }`}
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Right Side - Auth & User */}
        <div className="flex items-center gap-4">
          {!loading && (
            <>
              {user ? (
                // Usuario logueado
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-all border border-emerald-500/30"
                  >
                    <User size={18} />
                    <span className="text-sm font-semibold hidden sm:inline">
                      {perfil?.nombre_completo || user.email?.split('@')[0]}
                    </span>
                  </button>

                  {/* Dropdown menu */}
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-2 z-50">
                      {/* Mostrar email */}
                      <div className="px-4 py-2 border-b border-slate-700 text-xs text-slate-400">
                        {user.email}
                      </div>

                      {/* Dashboard para alumnos */}
                      {perfil?.rol === 'alumno' && (
                        <Link
                          href="/dashboard"
                          className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:bg-slate-700 hover:text-emerald-400 transition-colors"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <BookOpen size={16} />
                          <span>Mis Cursos</span>
                        </Link>
                      )}

                      {/* Admin panel with submenu */}
                      {perfil?.rol === 'admin' && (
                        <div className="relative">
                          <button
                            onClick={() => setAdminSubmenuOpen(!adminSubmenuOpen)}
                            className="w-full flex items-center gap-2 px-4 py-2 text-slate-300 hover:bg-slate-700 hover:text-emerald-400 transition-colors justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <Settings size={16} />
                              <span>Panel Admin</span>
                            </div>
                            <ChevronRight
                              size={14}
                              className={`transition-transform ${
                                adminSubmenuOpen ? 'rotate-90' : ''
                              }`}
                            />
                          </button>

                          {/* Admin Submenu */}
                          {adminSubmenuOpen && (
                            <div className="absolute left-0 right-0 top-full mt-1 bg-slate-700 border border-slate-600 rounded-lg shadow-lg py-2 text-sm">
                              <Link
                                href="/admin"
                                className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:bg-slate-600 hover:text-emerald-400 transition-colors"
                                onClick={() => {
                                  setAdminSubmenuOpen(false)
                                  setDropdownOpen(false)
                                }}
                              >
                                <Settings size={14} />
                                <span>Dashboard</span>
                              </Link>
                              <Link
                                href="/admin/alumnos"
                                className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:bg-slate-600 hover:text-emerald-400 transition-colors"
                                onClick={() => {
                                  setAdminSubmenuOpen(false)
                                  setDropdownOpen(false)
                                }}
                              >
                                <User size={14} />
                                <span>Gestión de Usuarios</span>
                              </Link>
                              <Link
                                href="/admin/cursos"
                                className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:bg-slate-600 hover:text-emerald-400 transition-colors"
                                onClick={() => {
                                  setAdminSubmenuOpen(false)
                                  setDropdownOpen(false)
                                }}
                              >
                                <BookOpen size={14} />
                                <span>Gestión de Cursos</span>
                              </Link>
                              <Link
                                href="/admin/categorias"
                                className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:bg-slate-600 hover:text-emerald-400 transition-colors"
                                onClick={() => {
                                  setAdminSubmenuOpen(false)
                                  setDropdownOpen(false)
                                }}
                              >
                                <BookOpen size={14} />
                                <span>Gestión de Categorías</span>
                              </Link>
                              <Link
                                href="/admin/cupones"
                                className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:bg-slate-600 hover:text-emerald-400 transition-colors"
                                onClick={() => {
                                  setAdminSubmenuOpen(false)
                                  setDropdownOpen(false)
                                }}
                              >
                                <Settings size={14} />
                                <span>Gestión de Cupones</span>
                              </Link>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Logout */}
                      <button
                        onClick={() => {
                          setDropdownOpen(false)
                          handleLogout()
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-slate-300 hover:bg-red-600/20 hover:text-red-400 transition-colors border-t border-slate-700 mt-1"
                      >
                        <LogOut size={16} />
                        <span>Cerrar Sesión</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                // No logueado
                <div className="flex items-center gap-3">
                  <Link
                    href="/login"
                    className="px-4 py-2 text-slate-300 hover:text-emerald-400 transition-colors font-semibold text-sm"
                  >
                    Iniciar Sesión
                  </Link>
                  <Link
                    href="/registro"
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold text-sm transition-colors"
                  >
                    Registrarse
                  </Link>
                </div>
              )}
            </>
          )}

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-slate-900 border-t border-slate-800 p-6 space-y-4 animate-in fade-in slide-in-from-top-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`block transition-all ${
                isActive(link.href) ? 'text-emerald-500 font-bold' : 'text-white font-medium'
              }`}
            >
              {link.name}
            </Link>
          ))}

          {user && (
            <>
              <div className="border-t border-slate-700 pt-4 space-y-3">
                {perfil?.rol === 'alumno' && (
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 text-slate-300 hover:text-emerald-400"
                  >
                    <BookOpen size={16} />
                    <span>Mis Cursos</span>
                  </Link>
                )}
                {perfil?.rol === 'admin' && (
                  <div>
                    <button
                      onClick={() => setAdminSubmenuOpen(!adminSubmenuOpen)}
                      className="w-full flex items-center gap-2 text-slate-300 hover:text-emerald-400 justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Settings size={16} />
                        <span>Panel Admin</span>
                      </div>
                      <ChevronRight
                        size={14}
                        className={`transition-transform ${
                          adminSubmenuOpen ? 'rotate-90' : ''
                        }`}
                      />
                    </button>
                    {adminSubmenuOpen && (
                      <div className="mt-2 pl-6 space-y-2 border-l border-slate-700 py-2">
                        <Link
                          href="/admin"
                          onClick={() => {
                            setAdminSubmenuOpen(false)
                            setMobileMenuOpen(false)
                          }}
                          className="flex items-center gap-2 text-slate-300 hover:text-emerald-400 text-sm"
                        >
                          <Settings size={14} />
                          <span>Dashboard</span>
                        </Link>
                        <Link
                          href="/admin/alumnos"
                          onClick={() => {
                            setAdminSubmenuOpen(false)
                            setMobileMenuOpen(false)
                          }}
                          className="flex items-center gap-2 text-slate-300 hover:text-emerald-400 text-sm"
                        >
                          <User size={14} />
                          <span>Gestión de Usuarios</span>
                        </Link>
                        <Link
                          href="/admin/cursos"
                          onClick={() => {
                            setAdminSubmenuOpen(false)
                            setMobileMenuOpen(false)
                          }}
                          className="flex items-center gap-2 text-slate-300 hover:text-emerald-400 text-sm"
                        >
                          <BookOpen size={14} />
                          <span>Gestión de Cursos</span>
                        </Link>
                        <Link
                          href="/admin/categorias"
                          onClick={() => {
                            setAdminSubmenuOpen(false)
                            setMobileMenuOpen(false)
                          }}
                          className="flex items-center gap-2 text-slate-300 hover:text-emerald-400 text-sm"
                        >
                          <BookOpen size={14} />
                          <span>Gestión de Categorías</span>
                        </Link>
                        <Link
                          href="/admin/cupones"
                          onClick={() => {
                            setAdminSubmenuOpen(false)
                            setMobileMenuOpen(false)
                          }}
                          className="flex items-center gap-2 text-slate-300 hover:text-emerald-400 text-sm"
                        >
                          <Settings size={14} />
                          <span>Gestión de Cupones</span>
                        </Link>
                      </div>
                    )}
                  </div>
                )}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    handleLogout()
                  }}
                  className="w-full flex items-center gap-2 text-red-400 hover:text-red-300"
                >
                  <LogOut size={16} />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
