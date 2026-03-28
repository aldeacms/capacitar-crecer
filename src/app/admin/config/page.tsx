'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Settings, Building2, Phone, Globe, LayoutTemplate, Search, Loader2, Save } from 'lucide-react'
import {
  getAppConfig,
  updateAppConfig,
  getSeccionesLanding,
  updateSeccionLanding,
  type AppConfig,
  type SeccionLanding,
} from '@/actions/config'

type Tab = 'identidad' | 'contacto' | 'landing' | 'seo'

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'identidad', label: 'Identidad', icon: Building2 },
  { id: 'contacto', label: 'Contacto & RRSS', icon: Phone },
  { id: 'landing', label: 'Landing', icon: LayoutTemplate },
  { id: 'seo', label: 'SEO', icon: Search },
]

export default function ConfigPage() {
  const [activeTab, setActiveTab] = useState<Tab>('identidad')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [secciones, setSecciones] = useState<SeccionLanding[]>([])

  useEffect(() => {
    async function load() {
      const [cfg, secs] = await Promise.all([getAppConfig(), getSeccionesLanding()])
      setConfig(cfg)
      setSecciones(secs)
      setLoading(false)
    }
    load()
  }, [])

  const updateField = <K extends keyof AppConfig>(field: K, value: AppConfig[K]) => {
    setConfig((prev) => prev ? { ...prev, [field]: value } : prev)
  }

  const updateRRSS = (key: string, value: string) => {
    setConfig((prev) =>
      prev
        ? { ...prev, redes_sociales: { ...prev.redes_sociales, [key]: value } }
        : prev
    )
  }

  const updateSeccionField = (seccion: string, key: string, value: unknown) => {
    setSecciones((prev) =>
      prev.map((s) =>
        s.seccion === seccion
          ? { ...s, contenido: { ...s.contenido, [key]: value } }
          : s
      )
    )
  }

  const updateSeccionItemField = (
    seccion: string,
    index: number,
    key: string,
    value: string
  ) => {
    setSecciones((prev) =>
      prev.map((s) => {
        if (s.seccion !== seccion) return s
        const items = [...((s.contenido.items as unknown[]) || [])] as Record<string, string>[]
        items[index] = { ...items[index], [key]: value }
        return { ...s, contenido: { ...s.contenido, items } }
      })
    )
  }

  const handleSaveConfig = async () => {
    if (!config) return
    setSaving(true)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...updates } = config
    const result = await updateAppConfig(updates)
    setSaving(false)
    if ('error' in result) {
      toast.error(result.error)
    } else {
      toast.success('Configuración guardada')
    }
  }

  const handleSaveSeccion = async (seccion: string) => {
    const sec = secciones.find((s) => s.seccion === seccion)
    if (!sec) return
    setSaving(true)
    const result = await updateSeccionLanding(seccion, sec.contenido)
    setSaving(false)
    if ('error' in result) {
      toast.error(result.error)
    } else {
      toast.success('Sección guardada')
    }
  }

  const heroSec = secciones.find((s) => s.seccion === 'hero')
  const statsSec = secciones.find((s) => s.seccion === 'stats')
  const clientesSec = secciones.find((s) => s.seccion === 'clientes')

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={32} className="animate-spin text-[#28B4AD]" />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-[#28B4AD]/20 rounded-xl flex items-center justify-center">
          <Settings size={20} className="text-[#28B4AD]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
          <p className="text-sm text-gray-500">Personaliza el contenido y apariencia de la plataforma</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-8 w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab: Identidad */}
      {activeTab === 'identidad' && config && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-6 max-w-2xl">
          <h2 className="text-lg font-bold text-gray-900">Identidad de la OTEC</h2>

          <Field label="Nombre de la organización">
            <input
              className="form-input"
              value={config.nombre_otec}
              onChange={(e) => updateField('nombre_otec', e.target.value)}
            />
          </Field>

          <Field label="Slogan">
            <input
              className="form-input"
              value={config.slogan}
              onChange={(e) => updateField('slogan', e.target.value)}
            />
          </Field>

          <Field label="Descripción corta">
            <textarea
              className="form-input min-h-[80px] resize-none"
              value={config.descripcion}
              onChange={(e) => updateField('descripcion', e.target.value)}
            />
          </Field>

          <Field label="RUT Empresa">
            <input
              className="form-input"
              value={config.rut_empresa || ''}
              onChange={(e) => updateField('rut_empresa', e.target.value)}
              placeholder="76.123.456-7"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Color primario">
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={config.color_primario}
                  onChange={(e) => updateField('color_primario', e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200"
                />
                <input
                  className="form-input flex-1"
                  value={config.color_primario}
                  onChange={(e) => updateField('color_primario', e.target.value)}
                />
              </div>
            </Field>
            <Field label="Color secundario">
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={config.color_secundario}
                  onChange={(e) => updateField('color_secundario', e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200"
                />
                <input
                  className="form-input flex-1"
                  value={config.color_secundario}
                  onChange={(e) => updateField('color_secundario', e.target.value)}
                />
              </div>
            </Field>
          </div>

          <Field label="URL del Logo">
            <input
              className="form-input"
              value={config.logo_url || ''}
              onChange={(e) => updateField('logo_url', e.target.value)}
              placeholder="https://..."
            />
          </Field>

          <Field label="URL del Favicon">
            <input
              className="form-input"
              value={config.favicon_url || ''}
              onChange={(e) => updateField('favicon_url', e.target.value)}
              placeholder="https://..."
            />
          </Field>

          <SaveButton onClick={handleSaveConfig} saving={saving} />
        </div>
      )}

      {/* Tab: Contacto & RRSS */}
      {activeTab === 'contacto' && config && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-6 max-w-2xl">
          <h2 className="text-lg font-bold text-gray-900">Datos de contacto</h2>

          <Field label="Email de contacto">
            <input
              type="email"
              className="form-input"
              value={config.email_contacto}
              onChange={(e) => updateField('email_contacto', e.target.value)}
            />
          </Field>

          <Field label="Teléfono">
            <input
              className="form-input"
              value={config.telefono_contacto}
              onChange={(e) => updateField('telefono_contacto', e.target.value)}
              placeholder="+56 9 1234 5678"
            />
          </Field>

          <Field label="Dirección">
            <input
              className="form-input"
              value={config.direccion || ''}
              onChange={(e) => updateField('direccion', e.target.value)}
            />
          </Field>

          <hr className="border-gray-100" />

          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Globe size={16} className="text-gray-400" />
            Redes Sociales
          </h3>

          <Field label="Instagram">
            <input
              className="form-input"
              value={config.redes_sociales?.instagram || ''}
              onChange={(e) => updateRRSS('instagram', e.target.value)}
              placeholder="https://instagram.com/..."
            />
          </Field>
          <Field label="LinkedIn">
            <input
              className="form-input"
              value={config.redes_sociales?.linkedin || ''}
              onChange={(e) => updateRRSS('linkedin', e.target.value)}
              placeholder="https://linkedin.com/company/..."
            />
          </Field>
          <Field label="Facebook">
            <input
              className="form-input"
              value={config.redes_sociales?.facebook || ''}
              onChange={(e) => updateRRSS('facebook', e.target.value)}
              placeholder="https://facebook.com/..."
            />
          </Field>

          <SaveButton onClick={handleSaveConfig} saving={saving} />
        </div>
      )}

      {/* Tab: Landing */}
      {activeTab === 'landing' && (
        <div className="space-y-8 max-w-2xl">
          {/* Hero */}
          {heroSec && (
            <Section title="Sección Hero" subtitle="Bloque principal del home">
              <Field label="Eyebrow (texto pequeño sobre el título)">
                <input
                  className="form-input"
                  value={(heroSec.contenido.eyebrow as string) || ''}
                  onChange={(e) => updateSeccionField('hero', 'eyebrow', e.target.value)}
                />
              </Field>
              <Field label="Título principal">
                <input
                  className="form-input"
                  value={(heroSec.contenido.titulo as string) || ''}
                  onChange={(e) => updateSeccionField('hero', 'titulo', e.target.value)}
                />
              </Field>
              <Field label="Subtítulo">
                <textarea
                  className="form-input min-h-[72px] resize-none"
                  value={(heroSec.contenido.subtitulo as string) || ''}
                  onChange={(e) => updateSeccionField('hero', 'subtitulo', e.target.value)}
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Texto del botón CTA">
                  <input
                    className="form-input"
                    value={(heroSec.contenido.cta_texto as string) || ''}
                    onChange={(e) => updateSeccionField('hero', 'cta_texto', e.target.value)}
                  />
                </Field>
                <Field label="URL del botón CTA">
                  <input
                    className="form-input"
                    value={(heroSec.contenido.cta_url as string) || ''}
                    onChange={(e) => updateSeccionField('hero', 'cta_url', e.target.value)}
                  />
                </Field>
              </div>
              <Field label="URL imagen de fondo">
                <input
                  className="form-input"
                  value={(heroSec.contenido.imagen_url as string) || ''}
                  onChange={(e) => updateSeccionField('hero', 'imagen_url', e.target.value)}
                  placeholder="https://..."
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Badge alumnos">
                  <input
                    className="form-input"
                    value={(heroSec.contenido.badge_alumnos as string) || ''}
                    onChange={(e) => updateSeccionField('hero', 'badge_alumnos', e.target.value)}
                    placeholder="+7k Alumnos"
                  />
                </Field>
                <Field label="Badge rating">
                  <input
                    className="form-input"
                    value={(heroSec.contenido.badge_rating as string) || ''}
                    onChange={(e) => updateSeccionField('hero', 'badge_rating', e.target.value)}
                    placeholder="4.9 Reseñas"
                  />
                </Field>
              </div>
              <SaveButton onClick={() => handleSaveSeccion('hero')} saving={saving} />
            </Section>
          )}

          {/* Stats */}
          {statsSec && (
            <Section title="Sección Estadísticas" subtitle="Números destacados de la organización">
              <Field label="Descripción">
                <textarea
                  className="form-input min-h-[72px] resize-none"
                  value={(statsSec.contenido.descripcion as string) || ''}
                  onChange={(e) => updateSeccionField('stats', 'descripcion', e.target.value)}
                />
              </Field>
              {((statsSec.contenido.items as Array<{ numero: string; label: string }>) || []).map(
                (item, i) => (
                  <div key={i} className="grid grid-cols-2 gap-4">
                    <Field label={`Número ${i + 1}`}>
                      <input
                        className="form-input"
                        value={item.numero}
                        onChange={(e) => updateSeccionItemField('stats', i, 'numero', e.target.value)}
                        placeholder="+7.000"
                      />
                    </Field>
                    <Field label={`Etiqueta ${i + 1}`}>
                      <input
                        className="form-input"
                        value={item.label}
                        onChange={(e) => updateSeccionItemField('stats', i, 'label', e.target.value)}
                        placeholder="personas capacitadas"
                      />
                    </Field>
                  </div>
                )
              )}
              <SaveButton onClick={() => handleSaveSeccion('stats')} saving={saving} />
            </Section>
          )}

          {/* Clientes */}
          {clientesSec && (
            <Section title="Sección Clientes" subtitle="Logos de empresas que confían en la OTEC">
              <Field label="Título de la sección">
                <input
                  className="form-input"
                  value={(clientesSec.contenido.titulo as string) || ''}
                  onChange={(e) => updateSeccionField('clientes', 'titulo', e.target.value)}
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                {((clientesSec.contenido.items as Array<{ nombre: string; logo_url: string }>) || []).map(
                  (item, i) => (
                    <Field key={i} label={`Cliente ${i + 1}`}>
                      <input
                        className="form-input"
                        value={item.nombre}
                        onChange={(e) =>
                          updateSeccionItemField('clientes', i, 'nombre', e.target.value)
                        }
                        placeholder="Nombre empresa"
                      />
                    </Field>
                  )
                )}
              </div>
              <SaveButton onClick={() => handleSaveSeccion('clientes')} saving={saving} />
            </Section>
          )}
        </div>
      )}

      {/* Tab: SEO */}
      {activeTab === 'seo' && config && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-6 max-w-2xl">
          <h2 className="text-lg font-bold text-gray-900">Configuración SEO</h2>

          <Field label="Título por defecto (meta title)">
            <input
              className="form-input"
              value={config.meta_title_default}
              onChange={(e) => updateField('meta_title_default', e.target.value)}
              placeholder="Nombre OTEC - Formación Profesional"
            />
            <p className="text-xs text-gray-400 mt-1">
              Aparece en el navegador y resultados de búsqueda cuando no hay título específico.
            </p>
          </Field>

          <Field label="Descripción por defecto (meta description)">
            <textarea
              className="form-input min-h-[80px] resize-none"
              value={config.meta_description_default}
              onChange={(e) => updateField('meta_description_default', e.target.value)}
            />
            <p className="text-xs text-gray-400 mt-1">
              Máximo 160 caracteres recomendado.
            </p>
          </Field>

          <Field label="Registro público habilitado">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.registro_publico_habilitado}
                onChange={(e) => updateField('registro_publico_habilitado', e.target.checked)}
                className="w-4 h-4 rounded cursor-pointer"
              />
              <span className="text-sm text-gray-700">
                Permitir que nuevos usuarios se registren sin invitación
              </span>
            </label>
          </Field>

          <SaveButton onClick={handleSaveConfig} saving={saving} />
        </div>
      )}
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-5">
      <div>
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-400">{subtitle}</p>
      </div>
      {children}
    </div>
  )
}

function SaveButton({ onClick, saving }: { onClick: () => void; saving: boolean }) {
  return (
    <div className="pt-2">
      <button
        type="button"
        onClick={onClick}
        disabled={saving}
        className="flex items-center gap-2 bg-[#28B4AD] hover:bg-[#219892] text-white px-6 py-2.5 rounded-xl font-semibold transition-colors disabled:opacity-50"
      >
        {saving ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Save size={16} />
        )}
        Guardar cambios
      </button>
    </div>
  )
}
