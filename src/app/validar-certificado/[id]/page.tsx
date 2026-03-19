import { validarCertificado } from '@/actions/certificados'
import Link from 'next/link'
import { CheckCircle2, AlertCircle } from 'lucide-react'

export default async function ValidarCertificadoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const result = await validarCertificado(id)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
          {/* Header */}
          <div className="text-center mb-6">
            {result.success ? (
              <>
                <div className="flex justify-center mb-4">
                  <CheckCircle2 size={48} className="text-emerald-500" />
                </div>
                <h1 className="text-2xl font-black text-gray-900">
                  Certificado Válido
                </h1>
              </>
            ) : (
              <>
                <div className="flex justify-center mb-4">
                  <AlertCircle size={48} className="text-red-500" />
                </div>
                <h1 className="text-2xl font-black text-gray-900">
                  Certificado Inválido
                </h1>
              </>
            )}
          </div>

          {/* Content */}
          {result.success ? (
            <div className="space-y-4">
              <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                <p className="text-sm text-emerald-700 mb-4">
                  Este certificado ha sido verificado exitosamente en nuestro sistema.
                </p>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Alumno
                    </p>
                    <p className="text-lg font-semibold text-gray-900">
                      {result.alumno}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      RUT
                    </p>
                    <p className="text-lg font-semibold text-gray-900">
                      {result.rut}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Curso
                    </p>
                    <p className="text-lg font-semibold text-gray-900">
                      {result.curso}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Fecha de Emisión
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(result.fechaEmision).toLocaleDateString('es-CL')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-center pt-4">
                <p className="text-xs text-gray-500">
                  ID del Certificado: <br />
                  <code className="text-[10px] font-mono text-gray-700">
                    {result.certificateId}
                  </code>
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <p className="text-sm text-red-700">
                {result.error || 'Este certificado no existe en nuestro sistema.'}
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <Link
              href="/"
              className="inline-flex items-center justify-center w-full px-4 py-2.5 bg-[#28B4AD] text-white rounded-lg font-semibold hover:bg-[#219892] transition-colors"
            >
              Volver al inicio
            </Link>
          </div>
        </div>

        {/* Footer text */}
        <p className="text-center text-sm text-gray-500 mt-8">
          Capacitar y Crecer OTEC
          <br />
          www.capacitarycrcer.cl
        </p>
      </div>
    </div>
  )
}
