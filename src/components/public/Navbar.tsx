'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { User, ShoppingCart, Menu, X } from 'lucide-react'

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

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

        {/* Icons */}
        <div className="flex items-center gap-5">
          <Link href="/login" className="text-white hover:text-emerald-500 transition-colors">
            <User size={20} />
          </Link>
          <button className="text-white hover:text-emerald-500 transition-colors relative">
            <ShoppingCart size={20} />
            <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-slate-950">
              0
            </span>
          </button>
          
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
        </div>
      )}
    </nav>
  )
}
