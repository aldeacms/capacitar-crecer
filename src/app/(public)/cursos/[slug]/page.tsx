import { createClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Accordion from '@/components/public/Accordion'
import { ArrowRight, CheckCircle2, PlayCircle, FileText, HelpCircle, Mail, Clock, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { ContactForm } from '@/components/public/HomeSections'
import Eyebrow from '@/components/public/ui/Eyebrow'
import BotonInscripcion from '@/components/cursos/BotonInscripcion'
import { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data: course } = await supabase.from('cursos').select('titulo, descripcion_breve').eq('slug', slug).single()

  if (!course) return { title: 'Curso no encontrado' }

  return {
    title: `${course.titulo} | Capacitar & Crecer`,
    description: course.descripcion_breve,
  }
}

export default async function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: course, error } = await supabase
    .from('cursos')
    .select(`
      id,
      titulo,
      slug,
      descripcion_breve,
      objetivos,
      metodologia,
      contenido_programatico,
      caracteristicas_generales,
      imagen_url,
      tipo_acceso,
      precio_curso,
      precio_certificado,
      porcentaje_aprobacion,
      modulos (
        id,
        lecciones (id)
      )
    `)
    .eq('slug', slug)
    .single()

  if (error || !course) {
    notFound()
  }

  // 1. Lógica de Precios Base
  const isCotizar = course.tipo_acceso === 'cotizar';
  const isGratis = course.tipo_acceso === 'gratis' || (course.tipo_acceso === 'pago-inmediato' && (course.precio_curso ?? 0) === 0);
  const isPago = course.tipo_acceso === 'pago-inmediato' && (course.precio_curso ?? 0) > 0;

  // 2. Lógica de Certificación (determinado por si hay precio de certificado)
  const hasCert = course.precio_certificado && course.precio_certificado > 0;
  const isCertGratis = course.precio_certificado === 0 && course.precio_certificado !== null;
  const isCertPago = course.precio_certificado && course.precio_certificado > 0;

  // 3. Textos Formateados
  const precioCursoFormatted = isGratis ? 'Gratis' : `$${course.precio_curso?.toLocaleString('es-CL')}`;
  const precioCertFormatted = isCertPago ? `$${course.precio_certificado?.toLocaleString('es-CL')}` : '';

  const mainButtonText = isCotizar
    ? 'Solicitar Cotización'
    : isPago
      ? 'Inscribirme y Pagar'
      : 'Comenzar Gratis';

  const heroButtonLink = isCotizar ? '#contacto-corporativo' : '#cta-inscripcion';

  const mainButtonLink = isCotizar
    ? '#contacto-corporativo'
    : isPago
      ? `/checkout/${course.id}`
      : `/registro?curso=${course.slug}`;

  // DINAMISMO INTELIGENTE: Puntos de valor
  const valuePoints = [
    isPago ? 'Acceso inmediato y de por vida 24/7' : 'Acceso completo al material de estudio',
    'Contenido actualizado a estándares industriales',
  ];

  if (hasCert) {
    if (isCertGratis) {
      valuePoints.unshift('Certificación oficial incluida sin costo');
    } else if (isCertPago) {
      valuePoints.unshift(`Certificación oficial opcional (+ ${precioCertFormatted})`);
    }
  }

  const accordionItems = [
    { title: 'Objetivos del Programa', content: course.objetivos || '' },
    { title: 'Metodología Técnica', content: course.metodologia || '' },
    { title: 'Contenido Programático (Temario)', content: course.contenido_programatico || '' },
    { title: 'Características y Requisitos', content: course.caracteristicas_generales || '' },
  ].filter(item => item.content && item.content !== '<p></p>')

  return (
    <div className="bg-slate-50 min-h-screen text-slate-700">
      {/* Hero Section */}
      <section className="relative pt-32 pb-16 overflow-hidden bg-[#0a0f1d] border-b border-white/5">
        <div className="absolute inset-0 opacity-10">
          <img src={course.imagen_url || "/bg-pattern.jpg"} alt="" className="w-full h-full object-cover blur-sm" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1d] via-transparent to-[#0a0f1d]"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="flex flex-wrap items-center gap-3">
                <span className="bg-[#2DB3A7]/10 text-[#2DB3A7] px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] border border-[#2DB3A7]/20">
                  Capacitación
                </span>
              </div>

              <h1 className="text-4xl md:text-6xl xl:text-7xl font-black text-white leading-[0.95] tracking-tighter">
                {course.titulo}
              </h1>

              <p className="text-slate-400 text-lg md:text-xl leading-relaxed font-medium max-w-xl">
                {course.descripcion_breve}
              </p>

              <div className="flex flex-wrap gap-4 pt-4">
                {isCotizar ? (
                  <a href="#contacto-corporativo" className="inline-flex justify-center items-center gap-2 py-4 px-8 rounded-xl font-black text-white bg-[#2DB3A7] hover:bg-[#26a095] transition-all">
                    Solicitar Cotización <ArrowRight size={20} />
                  </a>
                ) : (
                  <a href="#cta-inscripcion" className="inline-flex justify-center items-center gap-2 py-4 px-8 rounded-xl font-black text-white bg-[#2DB3A7] hover:bg-[#26a095] transition-all shadow-lg shadow-[#2DB3A7]/20">
                    {isGratis ? 'Comenzar Curso Gratis' : 'Inscribirme y Pagar'} <ArrowRight size={20} />
                  </a>
                )}
                <div className="flex flex-col justify-center px-4">
                  <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Inversión</span>
                  <span className={`text-2xl font-black ${isGratis ? 'text-[#2DB3A7]' : 'text-white'}`}>
                    {isCotizar ? 'A convenir' : precioCursoFormatted}
                  </span>
                </div>
              </div>
            </div>

            <div className="relative group hidden lg:block">
              <div className="absolute -inset-4 bg-[#2DB3A7]/10 rounded-[2.5rem] blur-3xl"></div>
              <div className="relative bg-slate-800 rounded-2xl overflow-hidden border border-white/10 shadow-2xl aspect-[16/10]">
                <img
                  src={course.imagen_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop'}
                  alt={course.titulo}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="py-24 bg-slate-50 relative">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 xl:gap-24">
            <div className="lg:col-span-12 xl:col-span-5 space-y-10">
              <div className="space-y-6">
                <Eyebrow>Excelencia Académica</Eyebrow>
                <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-tight">
                  Detalle técnico del entrenamiento
                </h2>
                <p className="text-slate-600 text-lg leading-relaxed font-medium">
                  Implementamos metodologías adaptadas a la reality industrial. Este programa ha sido validado para entregar competencias reales y medibles.
                </p>
              </div>

              <div className="space-y-4 pt-8 border-t border-slate-200">
                {valuePoints.map((point, i) => (
                  <div key={i} className="flex items-center gap-4 text-slate-700 font-bold">
                    <CheckCircle2 size={20} className="text-[#2DB3A7] flex-shrink-0" />
                    <span className="text-base">{point}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-12 xl:col-span-7">
              <div className="bg-white rounded-[2.5rem] p-6 md:p-10 border border-slate-200 shadow-xl shadow-slate-200/50">
                <Accordion items={accordionItems} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section Dinámica */}
      {!isCotizar && (
        <section id="cta-inscripcion" className="py-24 bg-white border-y border-slate-200">
          <div className="container mx-auto px-6">
            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-5 bg-slate-50 border border-slate-200 rounded-[3rem] overflow-hidden shadow-2xl">
              <div className="md:col-span-3 p-10 md:p-16 space-y-8">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-5 py-2 bg-white text-[#2DB3A7] rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200 shadow-sm">
                    <PlayCircle size={16} /> E-learning
                  </div>
                  <h3 className="text-4xl font-black text-slate-900 tracking-tighter">
                    {isGratis ? 'Comienza a aprender gratis' : 'Inicia tu formación ahora mismo'}
                  </h3>
                </div>

                <p className="text-slate-600 text-lg leading-relaxed font-medium">
                  Obtén acceso inmediato tras completar tu inscripción.
                  {hasCert ? (
                    isCertGratis 
                      ? ' Este programa incluye certificación oficial sin costo adicional al finalizar.'
                      : ` Accede al contenido sin costo. La certificación oficial es opcional y tiene un valor de ${precioCertFormatted}.`
                  ) : (
                    ' Este programa está enfocado en la adquisición de habilidades y no emite certificación oficial.'
                  )}
                </p>

                <div className="flex flex-col sm:flex-row gap-5 pt-4">
                  <BotonInscripcion
                    cursoId={course.id}
                    cursoSlug={course.slug}
                    tipoAcceso={course.tipo_acceso || 'gratis'}
                    precioCurso={course.precio_curso || 0}
                  />
                </div>
              </div>

              <div className="md:col-span-2 bg-white p-10 md:p-16 flex flex-col justify-center space-y-6 border-l border-slate-200 items-start text-left">
                <div className="w-full border-b border-slate-100 pb-6 mb-6">
                  <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest block mb-1">Inversión Total</span>
                  <span className={`text-4xl font-black ${isGratis ? 'text-[#2DB3A7]' : 'text-slate-900'}`}>
                    {precioCursoFormatted}
                  </span>
                </div>
                {[
                  'Acceso multidispositivo',
                  ...(hasCert ? [
                    isCertGratis ? 'Certificado incluido' : `Certificación opcional (${precioCertFormatted})`,
                    'Examen final online'
                  ] : []),
                  'Soporte técnico 24/7'
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 text-slate-700 font-bold">
                    <CheckCircle2 size={18} className="text-[#2DB3A7]" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <div id="contacto-corporativo" className="bg-white border-t border-slate-200 py-24">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center space-y-4 mb-16">
            <Eyebrow centered>Servicio Corporativo</Eyebrow>
            <h3 className="text-4xl font-black text-slate-900 tracking-tighter">Cotiza tu programa a medida</h3>
            <p className="text-slate-500 font-medium">Ideal para empresas y organizaciones que buscan capacitar a sus equipos.</p>
          </div>
          <ContactForm />
        </div>
      </div>
    </div>
  )
}
