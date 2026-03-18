/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { getCategories } from '@/actions/categorias'
import { toast } from 'sonner'
import { CheckCircle2, ShieldCheck, Award, Info, Sparkles, CreditCard, Eye } from 'lucide-react'

const RichTextEditor = dynamic(() => import('@/components/ui/RichTextEditor'), {
  ssr: false,
  loading: () => <div className="h-[300px] w-full bg-gray-50 animate-pulse rounded-lg border border-gray-200" />
})

interface CourseFormProps {
  initialData?: any
  onSubmit: (formData: FormData) => Promise<{ error?: string; success?: boolean }>
  title: string
  submitText: string
  loadingText: string
}

type TabType = 'basica' | 'comercial' | 'marketing'

export default function CourseForm({
  initialData,
  onSubmit,
  title,
  submitText,
  loadingText
}: CourseFormProps) {
  const router = useRouter()
  const params = useParams()

  const [activeTab, setActiveTab] = useState<TabType>('basica')
  const [loading, setLoading] = useState(false)
  const [dbCategories, setDbCategories] = useState<any[]>([])

  // PESTAÑA 1: BÁSICA
  const [titulo, setTitulo] = useState(initialData?.titulo || '')
  const [slug, setSlug] = useState(initialData?.slug || '')
  const [categoriaId, setCategoriaId] = useState(initialData?.categoria_id || "")
  const [modalidad, setModalidad] = useState(initialData?.modalidad || "online-asincrono")
  const [horas, setHoras] = useState(initialData?.horas || 0)
  const [estadoCurso, setEstadoCurso] = useState(initialData?.estado || "borrador")

  // PESTAÑA 2: COMERCIAL & CERTIFICACIÓN
  const [tipoAcceso, setTipoAcceso] = useState(initialData?.tipo_acceso || 'pago')
  const [precioCurso, setPrecioCurso] = useState(initialData?.precio_curso || 0)
  const [tieneCertificado, setTieneCertificado] = useState(initialData?.tiene_certificado || false)
  const [precioCertificado, setPrecioCertificado] = useState(initialData?.precio_certificado || 0)
  const [porcentajeAprobacion, setPorcentajeAprobacion] = useState(initialData?.porcentaje_aprobacion || 80)
  const [tieneSence, setTieneSence] = useState(initialData?.tiene_sence || false)

  // PESTAÑA 3: LANDING PAGE
  const [descripcionBreve, setDescripcionBreve] = useState(initialData?.descripcion_breve || '')
  const [dirigidoA, setDirigidoA] = useState(initialData?.dirigido_a || '')
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialData?.imagen_url || null)
  const [imagenFile, setImagenFile] = useState<File | null>(null)
  
  // Editores persistentes
  const [objetivos, setObjetivos] = useState(initialData?.objetivos || '')
  const [metodologia, setMetodologia] = useState(initialData?.metodologia || '')
  const [contenidoProgr, setContenidoProgr] = useState(initialData?.contenido_programatico || '')
  const [caracteristicas, setCaracteristicas] = useState(initialData?.caracteristicas_generales || '')

  useEffect(() => {
    async function loadCategories() {
      const data = await getCategories()
      setDbCategories(data)
    }
    loadCategories()
  }, [])

  useEffect(() => {
    if (initialData) {
      setTitulo(initialData.titulo || '')
      setSlug(initialData.slug || '')
      setCategoriaId(initialData.categoria_id || "")
      setModalidad(initialData.modalidad || "online-asincrono")
      setHoras(initialData.horas || 0)
      setEstadoCurso(initialData.estado || "borrador")
      setTipoAcceso(initialData.tipo_acceso || 'pago')
      setPrecioCurso(initialData.precio_curso || 0)
      setTieneCertificado(initialData.tiene_certificado || false)
      setPrecioCertificado(initialData.precio_certificado || 0)
      setPorcentajeAprobacion(initialData.porcentaje_aprobacion || 80)
      setTieneSence(initialData.tiene_sence || false)
      setDescripcionBreve(initialData.descripcion_breve || '')
      setDirigidoA(initialData.dirigido_a || '')
      setPreviewUrl(initialData.imagen_url || null)
      setObjetivos(initialData.objetivos || '')
      setMetodologia(initialData.metodologia || '')
      setContenidoProgr(initialData.contenido_programatico || '')
      setCaracteristicas(initialData.caracteristicas_generales || '')
    }
  }, [initialData])

  const slugify = (text: string) => {
    return text.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-').replace(/^-+/, '').replace(/-+$/, '')
  }

  const handleTituloChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setTitulo(val)
    if (!slug || slug === slugify(titulo)) setSlug(slugify(val))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImagenFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleSave = async () => {
    if (!categoriaId || categoriaId.trim() === "") {
      toast.error('🛑 Error: Debes seleccionar una categoría.')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      if (initialData?.id || params?.id) {
        formData.append('id', (params?.id || initialData.id) as string)
      }

      formData.append('titulo', titulo)
      formData.append('slug', slug)
      formData.append('categoria_id', categoriaId)
      formData.append('modalidad', modalidad)
      formData.append('horas', horas.toString())
      formData.append('estado', estadoCurso)

      formData.append('tipo_acceso', tipoAcceso)
      formData.append('precio_curso', (tipoAcceso === 'pago' ? precioCurso : 0).toString())
      formData.append('tiene_certificado', tieneCertificado ? 'on' : 'off')
      formData.append('precio_certificado', (tieneCertificado && tipoAcceso !== 'cotizar' ? precioCertificado : 0).toString())
      formData.append('porcentaje_aprobacion', porcentajeAprobacion.toString())
      formData.append('tiene_sence', tieneSence ? 'on' : 'off')

      formData.append('descripcion_breve', descripcionBreve)
      formData.append('dirigido_a', dirigidoA)
      formData.append('objetivos', objetivos)
      formData.append('metodologia', metodologia)
      formData.append('contenido_programatico', contenidoProgr)
      formData.append('caracteristicas_generales', caracteristicas)

      if (imagenFile) formData.append('imagen_file', imagenFile)
      if (initialData?.imagen_url) formData.append('current_imagen_url', initialData.imagen_url)

      const result = await onSubmit(formData)
      if (result?.error) throw new Error(result.error)

      toast.success(initialData ? 'Curso actualizado con éxito' : 'Curso creado correctamente')
      router.refresh()
      router.push('/admin/cursos')
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar los cambios')
    } finally {
      setLoading(false)
    }
  }

  const labelClass = "text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2 block"
  const inputBaseClass = "w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-[#2DB3A7]/10 focus:border-[#2DB3A7] outline-none transition-all text-gray-900 font-bold bg-white"
  const tabClass = (tab: TabType) => `flex-1 py-4 text-sm font-black transition-all border-b-2 text-center ${activeTab === tab ? 'border-[#2DB3A7] text-[#2DB3A7] bg-[#2DB3A7]/5' : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-gray-50'}`

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="mb-10 flex justify-between items-end px-2">
        <div>
          <button type="button" onClick={() => router.back()} className="text-slate-400 hover:text-slate-600 mb-3 flex items-center gap-1 font-bold text-xs uppercase tracking-tight transition-colors">
            &larr; Volver a la lista
          </button>
          <h1 className="text-4xl font-black text-slate-900">{title}</h1>
        </div>
        {slug && (
          <Link
            href={`/cursos/${slug}`}
            target="_blank"
            className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-[#28B4AD] font-bold text-xs uppercase tracking-widest transition-all rounded-xl hover:bg-[#28B4AD]/5"
          >
            <Eye size={16} />
            Ver en la web
          </Link>
        )}
      </div>

      <div className="bg-white rounded-3xl shadow-2xl shadow-[#2DB3A7]/10 border border-slate-100 overflow-hidden">
        {/* TABS HEADER */}
        <div className="flex border-b border-slate-100 bg-slate-50/30">
          <button type="button" onClick={() => setActiveTab('basica')} className={tabClass('basica')}>1. INF. BÁSICA</button>
          <button type="button" onClick={() => setActiveTab('comercial')} className={tabClass('comercial')}>2. COMERCIAL & CERT.</button>
          <button type="button" onClick={() => setActiveTab('marketing')} className={tabClass('marketing')}>3. LANDING PAGE</button>
        </div>

        <div className="p-10">
          {/* TAB 1: INFORMACIÓN BÁSICA */}
          <div className={activeTab === 'basica' ? 'space-y-8 animate-in slide-in-from-bottom-2 duration-500' : 'hidden'}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className={labelClass}>Título del Curso</label>
                <input required value={titulo} onChange={handleTituloChange} placeholder="Ej: Excel Avanzado para Finanzas" className={inputBaseClass} />
              </div>
              <div className="space-y-2">
                <label className={labelClass}>Slug (URL Amigable)</label>
                <input required value={slug} onChange={(e) => setSlug(e.target.value)} className={`${inputBaseClass} bg-slate-50 font-mono text-sm`} />
              </div>
              <div className="space-y-2">
                <label className={labelClass}>Categoría</label>
                <select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)} className={inputBaseClass}>
                  <option value="">Selecciona una categoría...</option>
                  {dbCategories.map((cat) => <option key={cat.id} value={cat.id}>{cat.nombre}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className={labelClass}>Modalidad</label>
                <select value={modalidad} onChange={(e) => setModalidad(e.target.value)} className={inputBaseClass}>
                  <option value="online-asincrono">🖥️ Online Asíncrono</option>
                  <option value="online-envivo">🎥 Online en Vivo</option>
                  <option value="presencial">🏢 Presencial</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className={labelClass}>Duración (Horas)</label>
                <input type="number" value={horas} onChange={(e) => setHoras(Number(e.target.value))} className={inputBaseClass} />
              </div>
              <div className="space-y-2">
                <label className={labelClass}>Estado del Curso</label>
                <div className="flex gap-4">
                  <button 
                    type="button" 
                    onClick={() => setEstadoCurso('borrador')}
                    className={`flex-1 py-3 px-4 rounded-xl border-2 font-bold transition-all flex items-center justify-center gap-2 ${estadoCurso === 'borrador' ? 'border-slate-300 bg-slate-100 text-slate-700' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                  >
                    <div className={`w-2 h-2 rounded-full ${estadoCurso === 'borrador' ? 'bg-slate-500' : 'bg-slate-200'}`} />
                    Borrador
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setEstadoCurso('publicado')}
                    className={`flex-1 py-3 px-4 rounded-xl border-2 font-bold transition-all flex items-center justify-center gap-2 ${estadoCurso === 'publicado' ? 'border-[#2DB3A7] bg-[#2DB3A7]/5 text-[#2DB3A7]' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                  >
                    <div className={`w-2 h-2 rounded-full ${estadoCurso === 'publicado' ? 'bg-[#2DB3A7]' : 'bg-slate-200'}`} />
                    Publicado
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* TAB 2: COMERCIAL & CERTIFICACIÓN */}
          <div className={activeTab === 'comercial' ? 'space-y-8 animate-in slide-in-from-bottom-2 duration-500' : 'hidden'}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-8">
                <div className="space-y-2">
                  <label className={labelClass}>Tipo de Acceso</label>
                  <select value={tipoAcceso} onChange={(e) => setTipoAcceso(e.target.value)} className={inputBaseClass}>
                    <option value="gratis">🎁 Gratis — El alumno se registra sin costo</option>
                    <option value="gratis_cert_pago">🎁 Gratis + Certificado de Pago — Contenido gratis, certificado tiene costo</option>
                    <option value="pago">🛒 De Pago — El alumno paga antes de acceder</option>
                    <option value="cotizar">📝 Cotizar — Precio a convenir, formulario de contacto</option>
                  </select>
                </div>

                {/* Mostrar precio del curso solo para tipo "pago" */}
                {tipoAcceso === 'pago' && (
                  <div className="space-y-2 animate-in fade-in zoom-in-95 duration-300">
                    <label className={labelClass}>Precio del Curso ($)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                      <input type="number" value={precioCurso} onChange={(e) => setPrecioCurso(Number(e.target.value))} className={`${inputBaseClass} pl-10`} />
                    </div>
                  </div>
                )}

                {/* Mostrar precio de certificado solo para tipo "gratis_cert_pago" */}
                {tipoAcceso === 'gratis_cert_pago' && (
                  <div className="space-y-2 animate-in fade-in zoom-in-95 duration-300">
                    <label className={labelClass}>Precio del Certificado ($)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                      <input type="number" value={precioCertificado} onChange={(e) => setPrecioCertificado(Number(e.target.value))} className={`${inputBaseClass} pl-10`} />
                    </div>
                  </div>
                )}

                {/* Certificación: solo mostrar para tipos que no sean "cotizar" */}
                {tipoAcceso !== 'cotizar' && (
                  <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex gap-4">
                        <div className="p-3 bg-white rounded-2xl text-[#2DB3A7] shadow-sm border border-slate-100">
                          <Award size={24} />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-slate-900 border-none m-0 p-0">Certificación Oficial</h4>
                          <p className="text-[11px] text-slate-500 font-medium">¿El curso otorga un diploma acreditado?</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tipoAcceso === 'gratis_cert_pago' ? true : tieneCertificado}
                          onChange={(e) => setTieneCertificado(e.target.checked)}
                          disabled={tipoAcceso === 'gratis_cert_pago'}
                          className="sr-only peer"
                        />
                        <div className="w-12 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-[21px] after:w-[21px] after:transition-all peer-checked:bg-[#2DB3A7] peer-disabled:opacity-50"></div>
                      </label>
                    </div>

                    {/* Mostrar campo de precio solo para tipos "pago" con certificado */}
                    {tieneCertificado && tipoAcceso === 'pago' && (
                      <div className="space-y-2 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className={labelClass}>Precio del Certificado ($)</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2DB3A7] font-bold">$</span>
                          <input
                            type="number"
                            value={precioCertificado}
                            onChange={(e) => setPrecioCertificado(Number(e.target.value))}
                            className={`${inputBaseClass} pl-10 border-[#2DB3A7]/30 focus:border-[#2DB3A7] text-[#2DB3A7]`}
                          />
                        </div>
                        <p className="text-[10px] text-[#2DB3A7] font-bold mt-2 flex items-center gap-1">
                          <Info size={12} /> Déjalo en 0 si el certificado viene incluido en el precio del curso.
                        </p>
                      </div>
                    )}

                    {tipoAcceso === 'gratis_cert_pago' && (
                      <p className="text-[10px] text-slate-500 italic">
                        El precio del certificado se especifica arriba. El contenido del curso es siempre gratis.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-8">
                <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 space-y-6">
                  <div className="space-y-4">
                    <label className={labelClass}>Meta de Aprobación</label>
                    <div className="flex items-center gap-6">
                      <input type="range" min="0" max="100" step={5} value={porcentajeAprobacion} onChange={(e) => setPorcentajeAprobacion(Number(e.target.value))} className="flex-1 accent-[#2DB3A7] h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                      <div className="w-16 h-12 bg-white rounded-xl border border-slate-200 flex items-center justify-center font-black text-slate-800 shadow-sm">
                        {porcentajeAprobacion}%
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">Nota mínima requerida para obtener el certificado.</p>
                  </div>
                </div>

                <div className="bg-[#2DB3A7]/5 p-6 rounded-2xl border border-[#2DB3A7]/20 flex items-center justify-between">
                  <div className="flex gap-4">
                    <div className="p-3 bg-white rounded-2xl text-[#2DB3A7] shadow-sm">
                      <ShieldCheck size={24} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 m-0">Acreditación SENCE</h4>
                      <p className="text-[11px] text-slate-500 font-medium whitespace-nowrap">Código para beneficio tributario empresas</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={tieneSence} onChange={(e) => setTieneSence(e.target.checked)} className="sr-only peer" />
                    <div className="w-12 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-[21px] after:w-[21px] after:transition-all peer-checked:bg-[#2DB3A7]"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* TAB 3: LANDING PAGE */}
          <div className={activeTab === 'marketing' ? 'space-y-10 animate-in slide-in-from-bottom-2 duration-500' : 'hidden'}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div className="md:col-span-2 space-y-8">
                <div className="space-y-2">
                  <label className={labelClass}>Descripción Breve (SEO & Card)</label>
                  <textarea rows={3} value={descripcionBreve} onChange={(e) => setDescripcionBreve(e.target.value)} placeholder="Un resumen impactante de una sola frase..." className={inputBaseClass} />
                </div>
                <div className="space-y-2">
                  <label className={labelClass}>¿A quién va dirigido?</label>
                  <input value={dirigidoA} onChange={(e) => setDirigidoA(e.target.value)} placeholder="Ej: Emprendedores, contadores, estudiantes..." className={inputBaseClass} />
                </div>
                <RichTextEditor label="Objetivos" content={objetivos} onChange={setObjetivos} />
                <RichTextEditor label="Metodología" content={metodologia} onChange={setMetodologia} />
                <RichTextEditor label="Contenido Programático" content={contenidoProgr} onChange={setContenidoProgr} />
                <RichTextEditor label="Requisitos y Otros" content={caracteristicas} onChange={setCaracteristicas} />
              </div>

              <div className="space-y-6">
                <label className={labelClass}>Portada del Curso</label>
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-8 flex flex-col items-center text-center group hover:border-[#2DB3A7]/50 transition-all cursor-pointer relative overflow-hidden">
                  {previewUrl ? (
                    <>
                      <img src={previewUrl} className="w-full aspect-video object-cover rounded-2xl shadow-lg mb-4" />
                      <button type="button" onClick={() => setPreviewUrl(null)} className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        <Info size={16} />
                      </button>
                    </>
                  ) : (
                    <div className="py-10">
                      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-300 shadow-sm mb-4 group-hover:text-[#2DB3A7] transition-all">
                        <Sparkles size={32} />
                      </div>
                      <p className="text-xs font-bold text-slate-400">Arraastra una imagen o<br/><span className="text-[#2DB3A7]">haz clic para subir</span></p>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                  <Info className="text-amber-500 shrink-0" size={18} />
                  <p className="text-[10px] text-amber-700 leading-relaxed font-medium">Recomendado: 1280x720px (16:9). Formato JPG o PNG, máximo 2MB.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER NAVIGATION */}
        <div className="bg-slate-50/80 backdrop-blur-sm border-t border-slate-100 p-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((step) => (
              <div key={step} className={`h-1.5 rounded-full transition-all duration-500 ${step === (activeTab === 'basica' ? 1 : activeTab === 'comercial' ? 2 : 3) ? 'w-10 bg-[#2DB3A7]' : 'w-4 bg-slate-200'}`} />
            ))}
          </div>
          
          <div className="flex gap-4">
            {activeTab !== 'basica' && (
              <button
                type="button"
                onClick={() => setActiveTab(activeTab === 'marketing' ? 'comercial' : 'basica')}
                className="px-8 py-3.5 rounded-2xl text-slate-500 font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all border-none"
              >
                Anterior
              </button>
            )}
            <button
              type="button"
              disabled={loading}
              onClick={activeTab !== 'marketing' ? () => setActiveTab(activeTab === 'basica' ? 'comercial' : 'marketing') : handleSave}
              className="px-12 py-4 bg-[#2DB3A7] hover:bg-[#259b91] hover:scale-[1.02] active:scale-[0.98] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[#2DB3A7]/20 transition-all min-w-[180px] disabled:opacity-50 disabled:scale-100"
            >
              {loading ? (
                <div className="flex items-center gap-3 justify-center">
                  <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                  <span>{loadingText}</span>
                </div>
              ) : (
                activeTab !== 'marketing' ? 'Siguiente Paso' : submitText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}