/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState } from 'react'
import { cambiarPassword } from '@/actions/usuarios'
import { toast } from 'sonner'
import { X, Lock, CheckCircle2, XCircle } from 'lucide-react'

interface ChangePasswordModalProps {
  usuario: any
  onClose: () => void
}

export function ChangePasswordModal({ usuario, onClose }: ChangePasswordModalProps) {
  const [loading, setLoading] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Validación
    if (!password) {
      toast.error('Ingresa una contraseña')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      setLoading(false)
      return
    }

    try {
      const result = await cambiarPassword(usuario.id, password)

      if ('error' in result) {
        toast.error(result.error)
      } else {
        toast.success('Contraseña actualizada correctamente')
        onClose()
      }
    } catch (error) {
      toast.error('Algo salió mal')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Lock size={20} className="text-orange-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Cambiar Contraseña</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Usuario info */}
          <div className="p-3 bg-orange-50 rounded-lg border border-orange-100">
            <p className="text-sm text-gray-600">
              <span className="font-semibold">Usuario:</span> {usuario.nombre_completo}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-semibold">Email:</span> {usuario.email}
            </p>
          </div>

          {/* Nueva contraseña */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Lock size={16} className="text-gray-400" />
              Nueva Contraseña
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              placeholder="••••••••"
            />
          </div>

          {/* Confirmar contraseña */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Lock size={16} className="text-gray-400" />
              Confirmar Contraseña
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="form-input"
              placeholder="••••••••"
            />
          </div>

          {/* Validación visual */}
          {password && confirmPassword && (
            <div className={`flex items-center gap-2 text-sm p-3 rounded-lg ${
              password === confirmPassword
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`}>
              {password === confirmPassword
                ? <><CheckCircle2 size={15} className="flex-shrink-0" /> Las contraseñas coinciden</>
                : <><XCircle size={15} className="flex-shrink-0" /> Las contraseñas no coinciden</>}
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-4">
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
              disabled={loading || password !== confirmPassword || !password}
              className="flex-1 px-4 py-2.5 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Procesando...' : 'Cambiar Contraseña'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
