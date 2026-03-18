'use client'

import { useState } from 'react'
import CourseCard from './CourseCard'
import { ChevronLeft, ChevronRight, LayoutGrid, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface FeaturedCoursesProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialCourses?: any[]
}

export default function FeaturedCourses({ initialCourses = [] }: FeaturedCoursesProps) {
  // Tomamos los primeros 3 para la Home
  const displayCourses = initialCourses.slice(0, 3)
  const hasMultipleCourses = initialCourses.length > 3

  return (
    <section id="catalogo" className="py-24 bg-slate-50">
      <div className="container mx-auto px-6">

        {/* HEADER DE SECCIÓN */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[#2DB3A7] text-[10px] font-black uppercase tracking-[0.3em]">
              <LayoutGrid size={14} />
              Capacitación Profesional
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
              Programas <span className="text-[#2DB3A7]">destacados</span>
            </h2>
            <p className="text-slate-500 max-w-md font-medium text-lg leading-relaxed">
              Cursos diseñados por expertos para elevar tu competitividad en el mercado actual.
            </p>
          </div>

          {/* NAVEGACIÓN DINÁMICA */}
          {hasMultipleCourses && (
            <div className="flex gap-2">
              <button className="w-12 h-12 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:border-[#2DB3A7] hover:text-[#2DB3A7] transition-all bg-white shadow-sm">
                <ChevronLeft size={20} />
              </button>
              <button className="w-12 h-12 rounded-xl bg-[#2DB3A7] flex items-center justify-center text-white hover:bg-[#26a095] transition-all shadow-lg shadow-[#2DB3A7]/20">
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>

        {/* GRID DE CURSOS */}
        <div className={`grid grid-cols-1 md:grid-cols-2 ${displayCourses.length >= 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2 max-w-4xl'} gap-8 lg:gap-10`}>
          {displayCourses.map(course => (
            <CourseCard key={course.id} {...course} />
          ))}
        </div>

        {/* CTA FINAL DE ALTO IMPACTO */}
        <div className="mt-20 flex flex-col items-center justify-center space-y-6 border-t border-slate-200 pt-16">
          <p className="text-slate-500 font-medium text-sm">
            ¿Buscas una formación específica? Explora nuestra oferta completa.
          </p>
          <Link
            href="/cursos"
            className="group relative inline-flex items-center gap-3 px-10 py-4 bg-white border-2 border-[#2DB3A7] text-[#2DB3A7] rounded-2xl font-black transition-all hover:bg-[#2DB3A7] hover:text-white shadow-xl shadow-[#2DB3A7]/10 active:scale-95"
          >
            <span className="text-xs uppercase tracking-[0.2em]">Ver todos los programas</span>
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  )
}