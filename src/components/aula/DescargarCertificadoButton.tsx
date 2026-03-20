'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { generarCertificado } from '@/actions/certificados'
import { toast } from 'sonner'
import { Download, Loader2, ShoppingCart } from 'lucide-react'

interface DescargarCertificadoButtonProps {
  cursoId: string
  tipo?: 'gratis' | 'pago' | 'gratis_cert_pago'
  preciosCertificado?: number | null
}

export default function DescargarCertificadoButton({
  cursoId,
  tipo = 'gratis',
  preciosCertificado,
}: DescargarCertificadoButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleDescargar = async () => {
    setLoading(true)

    try {
      const result = await generarCertificado(cursoId)

      if ('error' in result) {
        toast.error(result.error)
      } else {
        // Descargar automáticamente
        window.location.href = result.downloadUrl
        toast.success('Certificado descargado correctamente')
      }
    } catch (error) {
      toast.error('Error al generar certificado')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // Para cursos gratis o con certificado incluido
  if (tipo === 'gratis' || tipo === 'pago') {
    return (
      <button
        onClick={handleDescargar}
        disabled={loading}
        className="inline-flex items-center gap-2 px-8 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Generando...
          </>
        ) : (
          <>
            <Download size={18} />
            Descargar Certificado
          </>
        )}
      </button>
    )
  }

  // Para cursos con certificado de pago (gratis_cert_pago)
  const handleComprarCertificado = () => {
    // Redirigir a checkout para comprar el certificado
    // Nota: El precio es por el certificado, no el curso
    router.push(`/checkout/${cursoId}?tipo=certificado&precio=${preciosCertificado || 0}`)
  }

  return (
    <button
      onClick={handleComprarCertificado}
      disabled={loading}
      className="inline-flex items-center gap-2 px-8 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <>
          <Loader2 size={18} className="animate-spin" />
          Procesando...
        </>
      ) : (
        <>
          <ShoppingCart size={18} />
          Obtener Certificado ${(preciosCertificado || 0).toLocaleString('es-CL')}
        </>
      )}
    </button>
  )
}
