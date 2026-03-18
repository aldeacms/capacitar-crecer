'use client'

import { ArrowRight, Star, ShieldCheck, Users, CheckCircle } from 'lucide-react'

export default function Hero() {
  const brandColor = "#2DB3A7"

  return (
    <section className="relative min-h-[85vh] flex items-center pt-24 pb-16 overflow-hidden bg-[#0a0f1d]">
      {/* Background Decor sutil */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#2DB3A7] opacity-[0.02] blur-[100px] rounded-full"></div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Lado Izquierdo: Mensaje Directo */}
          <div className="space-y-8">
            <div className="space-y-4">
              <span className="text-[#2DB3A7] text-[10px] font-black uppercase tracking-[0.3em] opacity-80">
                Capacitación OTEC · Norma NCH2728
              </span>

              <h1 className="text-5xl md:text-6xl font-extrabold text-white leading-tight tracking-tight">
                Evoluciona con <br />
                <span className="text-[#2DB3A7]">formación pro</span>
              </h1>

              <p className="text-slate-400 text-lg max-w-lg leading-relaxed font-medium">
                Programas técnicos de alto impacto diseñados para Chile. <span className="text-slate-200">Aprende de expertos y certifícate.</span>
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-4 bg-[#2DB3A7] hover:bg-[#26a095] text-white rounded-xl font-bold transition-all shadow-lg shadow-[#2DB3A7]/20 flex items-center justify-center gap-3 text-sm"
              >
                Explorar Cursos <ArrowRight size={18} />
              </button>
              <button className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl font-bold transition-all text-sm">
                Nuestra Metodología
              </button>
            </div>

            {/* Social Proof Minimalista */}
            <div className="flex items-center gap-8 pt-4 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
              <div className="flex items-center gap-2 text-slate-300">
                <Users size={14} />
                <span className="text-[10px] font-bold uppercase tracking-wider">+7k Alumnos</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Star size={14} className="text-[#2DB3A7]" />
                <span className="text-[10px] font-bold uppercase tracking-wider">4.9 Reseñas</span>
              </div>
            </div>
          </div>

          {/* Lado Derecho: Imagen con un solo detalle */}
          <div className="relative hidden lg:block">
            <div className="relative aspect-square max-w-[500px] ml-auto rounded-3xl overflow-hidden border border-white/5">
              <img
                src="https://images.unsplash.com/photo-1552581234-26160f608093?q=80&w=2070&auto=format&fit=crop"
                alt="Capacitación"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1d]/40 to-transparent"></div>

              {/* Única insignia permitida: El valor legal */}
              <div className="absolute top-6 right-6 bg-white/95 backdrop-blur-md p-3 rounded-xl shadow-2xl flex items-center gap-2 border border-white/20">
                <div className="bg-[#2DB3A7]/10 p-1.5 rounded-lg text-[#2DB3A7]">
                  <CheckCircle size={16} />
                </div>
                <div className="leading-none">
                  <div className="text-[8px] font-black text-gray-400 uppercase">Validez</div>
                  <div className="text-xs font-bold text-gray-900 tracking-tight text-nowrap">Certificación Nacional</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}