'use client'

import Link from 'next/link'
import { Mail, Phone, MapPin, Facebook, Instagram, Linkedin } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-[#111827] text-white pt-16 pb-8 border-t border-gray-800">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-[#28B4AD] rounded-lg flex items-center justify-center font-bold text-white text-xl">
                C
              </div>
              <div className="flex flex-col">
                <span className="text-white font-bold leading-none tracking-tight">CAPACITAR</span>
                <span className="text-[#28B4AD] text-xs font-bold leading-none">& CRECER</span>
              </div>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed">
              Más de 10 años capacitando a profesionales y empresas con excelencia y compromiso.
            </p>
            <div className="flex gap-4">
              <a href="#" className="p-2 bg-gray-800 rounded-full hover:bg-[#28B4AD] transition-colors">
                <Facebook size={18} />
              </a>
              <a href="#" className="p-2 bg-gray-800 rounded-full hover:bg-[#28B4AD] transition-colors">
                <Instagram size={18} />
              </a>
              <a href="#" className="p-2 bg-gray-800 rounded-full hover:bg-[#28B4AD] transition-colors">
                <Linkedin size={18} />
              </a>
            </div>
          </div>

          {/* Enlaces Rápidos */}
          <div>
            <h3 className="font-bold mb-6 text-lg text-white">Explorar</h3>
            <ul className="space-y-3">
              <li><Link href="/" className="text-gray-400 hover:text-[#28B4AD] transition-colors text-sm">Inicio</Link></li>
              <li><Link href="/cursos" className="text-gray-400 hover:text-[#28B4AD] transition-colors text-sm">Catálogo de Cursos</Link></li>
              <li><Link href="/nosotros" className="text-gray-400 hover:text-[#28B4AD] transition-colors text-sm">Sobre Nosotros</Link></li>
              <li><Link href="/contacto" className="text-gray-400 hover:text-[#28B4AD] transition-colors text-sm">Contacto</Link></li>
            </ul>
          </div>

          {/* Cursos Populares */}
          <div>
            <h3 className="font-bold mb-6 text-lg text-white">Cursos</h3>
            <ul className="space-y-3">
              <li><Link href="#" className="text-gray-400 hover:text-[#28B4AD] transition-colors text-sm">Manipulación de Alimentos</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-[#28B4AD] transition-colors text-sm">Excel Avanzado</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-[#28B4AD] transition-colors text-sm">Liderazgo de Equipos</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-[#28B4AD] transition-colors text-sm">Ventas Digitales</Link></li>
            </ul>
          </div>

          {/* Contacto Directo */}
          <div>
            <h3 className="font-bold mb-6 text-lg text-white">Contacto</h3>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-gray-400 text-sm">
                <Mail size={18} className="text-[#28B4AD]" />
                contacto@capacitarycrecer.cl
              </li>
              <li className="flex items-center gap-3 text-gray-400 text-sm">
                <Phone size={18} className="text-[#28B4AD]" />
                +56 9 2964 2878
              </li>
              <li className="flex items-center gap-3 text-gray-400 text-sm">
                <MapPin size={18} className="text-[#28B4AD]" />
                Santiago, Chile
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-xs">
            © {new Date().getFullYear()} Capacitar y Crecer. Todos los derechos reservados.
          </p>
          <div className="flex gap-6">
            <Link href="/politica-de-privacidad" className="text-gray-500 hover:text-white text-xs">Privacidad</Link>
            <Link href="/terminos" className="text-gray-500 hover:text-white text-xs">Términos</Link>
          </div>
          <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest flex items-center gap-1">
            Desarrollado por <span className="text-[#28B4AD]">Daniel Aldea</span>
          </p>
        </div>
      </div>
    </footer>
  )
}
