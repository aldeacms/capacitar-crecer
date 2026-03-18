'use client'

import { Users, BookOpen, Calendar } from 'lucide-react'

export default function Stats() {
  const stats = [
    {
      label: 'Personas',
      value: '+7000',
      description: 'Personas capacitadas',
      icon: <Users className="text-emerald-500" size={24} />
    },
    {
      label: 'Cursos',
      value: '+70',
      description: 'Cursos de distintas áreas',
      icon: <BookOpen className="text-emerald-500" size={24} />
    },
    {
      label: 'Años',
      value: '+10',
      description: 'Años capacitados a las personas',
      icon: <Calendar className="text-emerald-500" size={24} />
    }
  ]

  return (
    <section className="py-24 bg-slate-50 relative overflow-hidden">
      {/* Pattern Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#10b981 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start mb-20">
          <div>
            <header>
              <h2 className="text-emerald-500 text-[10px] md:text-xs font-black uppercase tracking-[0.2em] mb-4 block">
                Trayectoria de Capacitar & Crecer
              </h2>
              <p className="h2 text-slate-900 block">
                Capacítate y mejora tus oportunidades laborales
              </p>
            </header>
          </div>
          <p className="text-slate-600 text-lg leading-relaxed font-medium">
            Capacitar & Crecer nace de la inquietud de profesionales con amplia experiencia en educación y comunicaciones. Ofrecemos programas efectivos para el mercado actual.
          </p>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 p-2 md:p-4 flex flex-col md:flex-row gap-4 items-center border border-slate-100">
          <div className="w-full md:w-1/3 bg-emerald-500/5 rounded-[2rem] p-10 flex items-center justify-center">
             <div className="w-24 h-24 bg-emerald-500 rounded-2xl flex items-center justify-center font-bold text-white text-5xl shadow-lg shadow-emerald-500/20">C</div>
          </div>
          
          <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-8 p-6 md:p-10">
            {stats.map((stat, index) => (
              <div key={index} className="space-y-2 border-l border-slate-100 pl-8 first:border-0 text-left">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">{stat.label}</span>
                <div className="text-4xl font-black text-slate-900">{stat.value}</div>
                <p className="text-slate-500 text-sm">{stat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
