/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState } from 'react'
import { enviarEmail } from '@/actions/email'
import { toast } from 'sonner'
import { X, Mail, Send } from 'lucide-react'

interface SendEmailModalProps {
  usuario: any
  onClose: () => void
}

export function SendEmailModal({ usuario, onClose }: SendEmailModalProps) {
  const [loading, setLoading] = useState(false)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [useTemplate, setUseTemplate] = useState<'custom' | 'greeting' | 'announcement' | 'reminder'>('custom')

  // Plantillas predefinidas
  const templates = {
    greeting: {
      subject: '¡Bienvenido a Capacitar y Crecer!',
      message: `Hola ${usuario.nombre_completo},

¡Bienvenido a nuestra plataforma de formación! Nos alegra contar contigo en nuestro programa.

A partir de ahora, podrás acceder a todos nuestros cursos y contenidos exclusivos. Esperamos que disfrutes del aprendizaje y logres alcanzar tus objetivos.

Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos.

¡Éxito en tu camino de aprendizaje!

Saludos cordiales,
Equipo de Capacitar y Crecer`
    },
    announcement: {
      subject: 'Anuncio Importante',
      message: `Hola ${usuario.nombre_completo},

Te escribimos para informarte sobre una novedad importante en nuestra plataforma.

[Aquí va el contenido del anuncio]

No dudes en comunicarte con nosotros si tienes preguntas.

Saludos,
Equipo de Capacitar y Crecer`
    },
    reminder: {
      subject: 'Recordatorio: Continúa tu Aprendizaje',
      message: `Hola ${usuario.nombre_completo},

Queremos recordarte que tienes cursos en progreso en nuestra plataforma.

Te animamos a que continúes con tus estudios para alcanzar tus objetivos de formación.

¡Adelante con tu aprendizaje!

Saludos,
Equipo de Capacitar y Crecer`
    }
  }

  const handleTemplateChange = (template: 'custom' | 'greeting' | 'announcement' | 'reminder') => {
    setUseTemplate(template)
    if (template !== 'custom') {
      const t = templates[template]
      setSubject(t.subject)
      setMessage(t.message)
    } else {
      setSubject('')
      setMessage('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!subject.trim() || !message.trim()) {
        toast.error('Asunto y mensaje son obligatorios')
        setLoading(false)
        return
      }

      // Convertir texto plano a HTML
      const htmlMessage = message
        .split('\n')
        .map(line => `<p>${line}</p>`)
        .join('')

      const result = await enviarEmail({
        to: usuario.email,
        subject: subject.trim(),
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            ${htmlMessage}
          </div>
        `
      })

      if ('error' in result) {
        toast.error(result.error)
      } else {
        toast.success('Email enviado correctamente')
        onClose()
      }
    } catch (error) {
      toast.error('Algo salió mal al enviar el email')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Mail size={20} className="text-green-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Enviar Email</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 flex flex-col p-6">
          {/* Destinatario */}
          <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-100">
            <p className="text-sm text-gray-600">
              <span className="font-semibold">Destinatario:</span> {usuario.nombre_completo}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-semibold">Email:</span> {usuario.email}
            </p>
          </div>

          {/* Plantillas */}
          <div className="mb-6">
            <label className="text-sm font-semibold text-gray-700 mb-3 block">Usar plantilla</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleTemplateChange('custom')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  useTemplate === 'custom'
                    ? 'bg-[#28B4AD] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Personalizado
              </button>
              <button
                type="button"
                onClick={() => handleTemplateChange('greeting')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  useTemplate === 'greeting'
                    ? 'bg-[#28B4AD] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Bienvenida
              </button>
              <button
                type="button"
                onClick={() => handleTemplateChange('announcement')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  useTemplate === 'announcement'
                    ? 'bg-[#28B4AD] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Anuncio
              </button>
              <button
                type="button"
                onClick={() => handleTemplateChange('reminder')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  useTemplate === 'reminder'
                    ? 'bg-[#28B4AD] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Recordatorio
              </button>
            </div>
          </div>

          {/* Asunto */}
          <div className="mb-4 flex-shrink-0">
            <label className="text-sm font-semibold text-gray-700 mb-2 block">Asunto</label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="form-input"
              placeholder="Asunto del email..."
            />
          </div>

          {/* Mensaje */}
          <div className="mb-4 flex-1 flex flex-col min-h-0">
            <label className="text-sm font-semibold text-gray-700 mb-2 block">Mensaje</label>
            <textarea
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="form-input flex-1 resize-none"
              placeholder="Escribe el contenido del email..."
            />
          </div>

          {/* Info */}
          <div className="text-xs text-gray-500 mb-6 p-3 bg-gray-50 rounded-lg">
            <p>📧 El email será enviado desde: <strong>Capacitar y Crecer</strong></p>
            <p className="mt-1">Los saltos de línea serán convertidos a párrafos en el email.</p>
          </div>

          {/* Botones */}
          <div className="flex gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !subject.trim() || !message.trim()}
              className="flex-1 px-4 py-2.5 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Send size={16} />
              {loading ? 'Enviando...' : 'Enviar Email'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
