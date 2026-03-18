import { createClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import CourseCard from '@/components/public/CourseCard'
import { ArrowLeft, Tag, LayoutGrid } from 'lucide-react'
import Link from 'next/link'
import Eyebrow from '@/components/public/ui/Eyebrow'

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const supabase = await createClient()

    const { data: category } = await supabase
        .from('categorias')
        .select('*')
        .eq('slug', slug)
        .single()

    if (!category) notFound()

    const { data: courses } = await supabase
        .from('cursos')
        .select('*, categorias(nombre)')
        .eq('categoria_id', category.id)
        .eq('estado', 'publicado')
        .order('created_at', { ascending: false })

    return (
        <div className="bg-slate-50 min-h-screen">
            {/* Hero: Estética Unificada con la Ficha de Curso */}
            <section className="relative pt-32 pb-20 overflow-hidden bg-[#0a0f1d] border-b border-white/5">
                <div className="container mx-auto px-6 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                        <div className="space-y-8">
                            <Link
                                href="/cursos"
                                className="inline-flex items-center gap-2 text-slate-500 hover:text-[#2DB3A7] font-bold text-[10px] uppercase tracking-widest transition-all group"
                            >
                                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                                Volver al catálogo
                            </Link>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <span className="bg-[#2DB3A7]/10 text-[#2DB3A7] px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] border border-[#2DB3A7]/20">
                                        Especialidad Académica
                                    </span>
                                </div>

                                <h1 className="text-5xl md:text-7xl font-black text-white leading-[0.95] tracking-tighter">
                                    Cursos de <br />
                                    <span className="text-[#2DB3A7]">{category.nombre}</span>
                                </h1>

                                <p className="text-slate-400 text-lg md:text-xl leading-relaxed font-medium max-w-xl">
                                    {category.description || `Programas de formación especializada en ${category.nombre}, diseñados para cumplir con los estándares técnicos más exigentes de la industria.`}
                                </p>
                            </div>

                            <div className="flex items-center gap-6 pt-4 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                                <div className="flex items-center gap-2">
                                    <LayoutGrid size={16} className="text-[#2DB3A7]" />
                                    {courses?.length || 0} Programas disponibles
                                </div>
                            </div>
                        </div>

                        {/* Lado derecho: Imagen con el mismo tratamiento que el curso */}
                        <div className="relative group hidden lg:block">
                            <div className="absolute -inset-4 bg-[#2DB3A7]/10 rounded-[2.5rem] blur-3xl"></div>
                            <div className="relative bg-slate-800 rounded-3xl overflow-hidden border border-white/10 shadow-2xl aspect-[16/10]">
                                <img
                                    src={category.imagen_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1600'}
                                    alt={category.nombre}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* Grid de Cursos: Fondo claro para lectura limpia */}
            <section className="py-24">
                <div className="container mx-auto px-6">
                    {courses && courses.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {courses.map((course: any) => (
                                <CourseCard
                                    key={course.id}
                                    {...course}
                                    categoria_nombre={category.nombre}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-32 bg-white rounded-[3rem] border border-slate-200 shadow-xl shadow-slate-200/50 max-w-3xl mx-auto px-10">
                            <h3 className="text-2xl font-black text-slate-900 mb-4">Próximos lanzamientos</h3>
                            <p className="text-slate-500 font-medium mb-10 leading-relaxed">
                                Estamos actualizando nuestro catálogo de <strong>{category.nombre}</strong>.
                            </p>
                            <Link href="/#contacto" className="inline-flex px-10 py-4 bg-[#2DB3A7] text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#26a095] transition-all shadow-lg shadow-[#2DB3A7]/20">
                                Consultar por programas cerrados
                            </Link>
                        </div>
                    )}
                </div>
            </section>
        </div>
    )
}