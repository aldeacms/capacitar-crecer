'use client'

import Link from 'next/link'
import { ArrowRight, Clock, BookOpen, CheckCircle2 } from 'lucide-react'

interface CourseCardProps {
  id: string
  titulo: string
  slug: string
  descripcion_breve: string
  imagen_url?: string
  tipo_acceso: string
  precio_curso: number
  categoria_nombre?: string
  lessons_count?: number
  modalidad?: string
  horas?: number
  tiene_sence?: boolean
}

export default function CourseCard({
  titulo,
  slug,
  descripcion_breve,
  imagen_url,
  precio_curso,
  categoria_nombre,
  lessons_count = 0,
  modalidad,
  horas,
  tiene_sence = false
}: CourseCardProps) {
  const brandColor = "#2DB3A7"

  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-slate-200 hover:border-[#2DB3A7]/30 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 flex flex-col h-full relative">

      {/* Contenedor de Imagen */}
      <div className="relative h-56 overflow-hidden">
        <img
          src={(imagen_url && imagen_url.trim() !== '') ? imagen_url : 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop'}
          alt={titulo}
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
        />

        {/* Badges sobre imagen */}
        <div className="absolute top-4 left-4 z-20 flex flex-wrap gap-2">
          {categoria_nombre && (
            <span className="bg-white/90 backdrop-blur-md text-slate-900 text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider border border-slate-200">
              {categoria_nombre}
            </span>
          )}
          <span className="bg-[#2DB3A7] text-white text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-lg">
            {modalidad === 'online-asincrono' ? 'E-learning' : 'En Vivo / Presencial'}
          </span>
        </div>

        {/* Overlay gradiente más suave para fondo claro */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60"></div>
      </div>

      {/* Contenido de la Tarjeta */}
      <div className="p-6 flex flex-col flex-grow">
        {/* Micro-stats */}
        <div className="flex items-center gap-4 text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-4">
          <span className="flex items-center gap-1.5">
            <Clock size={13} className="text-[#2DB3A7]" /> {horas || 0} hrs
          </span>
          <span className="flex items-center gap-1.5">
            <BookOpen size={13} className="text-[#2DB3A7]" /> {lessons_count || 0} lecciones
          </span>

          {/* Badge dinámico de Sence */}
          {tiene_sence && (
            <div className="flex items-center gap-1 ml-auto text-[#2DB3A7] bg-[#2DB3A7]/10 px-2 py-0.5 rounded-md border border-[#2DB3A7]/20">
              <CheckCircle2 size={12} strokeWidth={3} />
              <span className="text-[9px] font-black uppercase tracking-tighter text-nowrap">Sence</span>
            </div>
          )}
        </div>

        <h3 className="text-slate-900 font-bold text-lg mb-3 line-clamp-2 group-hover:text-[#2DB3A7] transition-colors leading-snug">
          {titulo}
        </h3>

        <p className="text-slate-500 text-sm mb-6 line-clamp-2 leading-relaxed font-medium opacity-90">
          {descripcion_breve}
        </p>

        {/* Footer de Tarjeta */}
        <div className="mt-auto pt-5 border-t border-slate-100 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-slate-400 text-[9px] font-bold uppercase tracking-wider mb-1">Inversión</span>
            <span className="text-slate-900 font-black text-xl tracking-tight">
              {precio_curso > 0 ? (
                <span className="group-hover:text-[#2DB3A7] transition-colors">
                  ${precio_curso.toLocaleString('es-CL')}
                </span>
              ) : (
                <span className="text-[#2DB3A7]">Gratis</span>
              )}
            </span>
          </div>

          <Link
            href={`/cursos/${slug}`}
            className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-[#2DB3A7] group-hover:border-[#2DB3A7] group-hover:text-white transition-all duration-300 shadow-sm"
          >
            <ArrowRight size={18} />
            <span className="absolute inset-0 z-10" aria-hidden="true"></span>
          </Link>
        </div>
      </div>
    </div>
  )
}