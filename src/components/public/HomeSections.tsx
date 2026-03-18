'use client'

import { Mail, Phone, Send } from 'lucide-react'

export function ClientLogos() {
  const clients = [
    'EL VALLEJO', 'COPEC', 'QUILIN', 'SACYR', 'TRANS ANTOFAGASTA', 'ALM', 'BUENAS HIJAS', 'POLICIA'
  ]

  return (
    <section className="py-20 bg-white border-b border-slate-100">
      <div className="container mx-auto px-6 text-center">
        <header className="mb-12">
          <span className="text-[#2DB3A7] text-[10px] font-black uppercase tracking-[0.3em] mb-3 block">
            Socios Estratégicos
          </span>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
            Empresas que confían en nosotros
          </h2>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {clients.map(client => (
            <div
              key={client}
              className="flex items-center justify-center font-bold text-slate-400 text-[10px] tracking-widest border border-slate-100 aspect-video rounded-2xl transition-all duration-500 uppercase px-4 text-center bg-slate-50/50 hover:bg-white hover:text-[#2DB3A7] hover:border-[#2DB3A7]/20 hover:shadow-sm grayscale hover:grayscale-0"
            >
              {client}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function ContactForm() {
  return (
    <section className="relative py-24 bg-[#0a0f1d] overflow-hidden">
      {/* Decoración de fondo */}
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#2DB3A7] opacity-[0.02] blur-[120px] rounded-full -mb-64 -mr-32"></div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <header className="mb-6">
            <span className="text-[#2DB3A7] text-[10px] font-black uppercase tracking-[0.4em] mb-4 block">
              Admisión Corporativa
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
              Cotiza tu programa <span className="text-[#2DB3A7]">a medida</span>
            </h2>
          </header>
          <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-2xl mx-auto">
            ¿Buscas un plan de capacitación para tu organización? Escríbenos y nuestro equipo te contactará en menos de 24 horas.
          </p>

          <div className="flex flex-col md:flex-row justify-center gap-8 mt-10">
            <a href="tel:+56929642878" className="flex items-center justify-center gap-3 text-slate-300 hover:text-[#2DB3A7] transition-colors font-bold text-sm">
              <Phone size={18} className="text-[#2DB3A7]" /> (+569) 2964 2878
            </a>
            <a href="mailto:contacto@capacitarycrecer.cl" className="flex items-center justify-center gap-3 text-slate-300 hover:text-[#2DB3A7] transition-colors font-bold text-sm">
              <Mail size={18} className="text-[#2DB3A7]" /> contacto@capacitarycrecer.cl
            </a>
          </div>
        </div>

        <form className="max-w-3xl mx-auto bg-white/[0.02] backdrop-blur-sm p-8 md:p-12 rounded-[2.5rem] border border-white/[0.05] shadow-2xl space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Nombre Completo</label>
              <input type="text" placeholder="Ej: Daniel Aldea" required className="w-full bg-white/[0.03] border border-white/[0.05] focus:border-[#2DB3A7]/50 px-5 py-4 rounded-xl outline-none focus:ring-4 focus:ring-[#2DB3A7]/5 text-white transition-all font-medium placeholder:text-slate-600" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Email Corporativo</label>
              <input type="email" placeholder="email@empresa.com" required className="w-full bg-white/[0.03] border border-white/[0.05] focus:border-[#2DB3A7]/50 px-5 py-4 rounded-xl outline-none focus:ring-4 focus:ring-[#2DB3A7]/5 text-white transition-all font-medium placeholder:text-slate-600" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Teléfono</label>
              <input type="tel" placeholder="+56 9..." required className="w-full bg-white/[0.03] border border-white/[0.05] focus:border-[#2DB3A7]/50 px-5 py-4 rounded-xl outline-none focus:ring-4 focus:ring-[#2DB3A7]/5 text-white transition-all font-medium placeholder:text-slate-600" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Empresa / Organización</label>
              <input type="text" placeholder="Nombre de tu empresa" className="w-full bg-white/[0.03] border border-white/[0.05] focus:border-[#2DB3A7]/50 px-5 py-4 rounded-xl outline-none focus:ring-4 focus:ring-[#2DB3A7]/5 text-white transition-all font-medium placeholder:text-slate-600" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Mensaje o Requerimientos</label>
            <textarea placeholder="¿En qué programa estás interesado?" required rows={4} className="w-full bg-white/[0.03] border border-white/[0.05] focus:border-[#2DB3A7]/50 px-5 py-4 rounded-2xl outline-none focus:ring-4 focus:ring-[#2DB3A7]/5 text-white transition-all font-medium resize-none placeholder:text-slate-600"></textarea>
          </div>

          <button type="submit" className="group w-full py-5 bg-[#2DB3A7] hover:bg-[#26a095] text-white rounded-2xl font-bold transition-all shadow-xl shadow-[#2DB3A7]/20 flex items-center justify-center gap-3 text-sm uppercase tracking-widest overflow-hidden relative">
            <span className="relative z-10 flex items-center gap-2">
              Enviar Solicitud de Cotización
              <Send size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </span>
          </button>
        </form>
      </div>
    </section>
  )
}