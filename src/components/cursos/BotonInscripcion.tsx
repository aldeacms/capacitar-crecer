'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Loader2 } from 'lucide-react'

interface BotonInscripcionProps {
  cursoId: string
  cursoSlug?: string
  tipoAcceso: string
}

export default function BotonInscripcion({ cursoId, tipoAcceso }: BotonInscripcionProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const isGratis = tipoAcceso === 'gratis' || tipoAcceso === 'gratis_cert_pago'

  const handleInscripcion = async () => {
    setLoading(true)

    try {
      if (!isGratis) {
        router.push(`/checkout/${cursoId}`)
        return
      }

      // Call server API which runs the server action
      const res = await fetch('/api/inscribir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cursoId })
      })

      const data = await res.json()

      if (!res.ok || !data.ok) {
        console.error('Inscripción fallida:', data)

        // Mapear mensajes de error a textos amigables
        let mensajeError = data.error || 'Error desconocido'
        const mensajesAmigables: Record<string, string> = {
          'NO_SESSION': 'Por favor inicia sesión para inscribirte',
          'CURSO_NO_ENCONTRADO': 'El curso no fue encontrado',
          'CURSO_REQUIERE_PAGO': 'Este curso requiere pago. Redirigiendo a checkout...',
          'CURSO_REQUIERE_COTIZACION': 'Este curso requiere una cotización personalizada',
          'TIPO_ACCESO_INVALIDO': 'Tipo de acceso al curso inválido',
          'MISSING_CURSO_ID': 'ID del curso inválido',
        }

        mensajeError = mensajesAmigables[mensajeError] || mensajeError

        alert(`Error al inscribir: ${mensajeError}`)
        setLoading(false)
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      console.error('Error inesperado en el componente:', err)
      alert('Ocurrió un error inesperado de red o de aplicación.')
      setLoading(false)
    }
  }

  const textoBoton = loading 
    ? 'Procesando...' 
    : isGratis 
      ? 'Comenzar Curso Gratis' 
      : 'Inscribirme y Pagar'

  return (
    <button
      onClick={handleInscripcion}
      disabled={loading}
      className="w-full sm:w-auto inline-flex justify-center items-center gap-2 py-4 px-8 border border-transparent rounded-xl shadow-lg shadow-[#2DB3A7]/20 text-base font-black text-white bg-[#2DB3A7] hover:bg-[#26a095] focus:outline-none transition-all disabled:opacity-70 disabled:cursor-not-allowed"
    >
      {loading && <Loader2 className="animate-spin" size={20} />}
      {!loading && textoBoton}
      {!loading && <ArrowRight size={20} />}
    </button>
  )
}
