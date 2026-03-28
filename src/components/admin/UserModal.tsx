/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState } from 'react'
import { crearUsuario, actualizarPerfil, cambiarRolUsuario, actualizarEmail } from '@/actions/usuarios'
import { enviarBienvenida } from '@/actions/email'
import { toast } from 'sonner'
import { X, User, Mail, Lock, FileText, Briefcase } from 'lucide-react'

interface UserModalProps {
  editingUser?: any
  onClose: () => void
}

export function UserModal({ editingUser, onClose }: UserModalProps) {
  const isEditing = !!editingUser
  const [loading, setLoading] = useState(false)
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(true)

  const [formData, setFormData] = useState({
    email: editingUser?.email || '',
    password: '',
    nombre_completo: editingUser?.nombre_completo || '',
    rut: editingUser?.rut || '',
    rol: editingUser?.rol || 'alumno' as 'admin' | 'alumno'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isEditing) {
        // Actualizar email si cambió
        if (formData.email !== editingUser.email) {
          const emailResult = await actualizarEmail(editingUser.id, formData.email)
          if ('error' in emailResult) {
            toast.error(emailResult.error)
            setLoading(false)
            return
          }
        }

        // Actualizar nombre y RUT
        const result = await actualizarPerfil(editingUser.id, {
          nombre_completo: formData.nombre_completo,
          rut: formData.rut
        })

        if ('error' in result) {
          toast.error(result.error)
          setLoading(false)
          return
        }

        // Cambiar rol si es diferente
        if (formData.rol !== editingUser.rol) {
          const rolResult = await cambiarRolUsuario(editingUser.id, formData.rol)
          if ('error' in rolResult) {
            toast.error(rolResult.error)
            setLoading(false)
            return
          }
        }

        toast.success('Usuario actualizado correctamente')
        onClose()
      } else {
        // Modo creación
        if (!formData.password) {
          toast.error('La contraseña es obligatoria')
          setLoading(false)
          return
        }

        // Usar endpoint de API para crear usuario (más robusto)
        const createResponse = await fetch('/api/admin/create-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            nombre_completo: formData.nombre_completo,
            rut: formData.rut,
            rol: formData.rol
          })
        })

        const createResult = await createResponse.json()

        if (!createResponse.ok || !createResult.success) {
          toast.error(createResult.error || 'Error creando usuario')
        } else {
          // Enviar email de bienvenida si está marcado
          if (sendWelcomeEmail) {
            await enviarBienvenida({
              email: formData.email,
              nombre: formData.nombre_completo,
              password: formData.password
            })
          }

          toast.success('Usuario creado correctamente')
          onClose()
        }
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
            <div className="w-10 h-10 bg-[#28B4AD]/20 rounded-lg flex items-center justify-center">
              <User size={20} className="text-[#28B4AD]" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">
              {isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h2>
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
          {/* Email */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Mail size={16} className="text-gray-400" />
              Email
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="form-input"
              placeholder="usuario@ejemplo.com"
            />
            {isEditing && formData.email !== editingUser.email && (
              <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                <span>⚠</span> El email del usuario cambiará. Se enviará notificación a la nueva dirección.
              </p>
            )}
          </div>

          {/* Nombre Completo */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <User size={16} className="text-gray-400" />
              Nombre Completo
            </label>
            <input
              type="text"
              required
              value={formData.nombre_completo}
              onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
              className="form-input"
              placeholder="Juan Pérez"
            />
          </div>

          {/* RUT */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <FileText size={16} className="text-gray-400" />
              RUT
            </label>
            <input
              type="text"
              required
              value={formData.rut}
              onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
              className="form-input"
              placeholder="12.345.678-9"
            />
          </div>

          {/* Rol */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Briefcase size={16} className="text-gray-400" />
              Rol
            </label>
            <select
              value={formData.rol}
              onChange={(e) => setFormData({ ...formData, rol: e.target.value as any })}
              className="form-select"
            >
              <option value="alumno">Alumno</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          {/* Contraseña (solo en creación) */}
          {!isEditing && (
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Lock size={16} className="text-gray-400" />
                Contraseña
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="form-input"
                placeholder="••••••••"
              />
            </div>
          )}

          {/* Checkbox enviar email (solo en creación) */}
          {!isEditing && (
            <label className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors">
              <input
                type="checkbox"
                checked={sendWelcomeEmail}
                onChange={(e) => setSendWelcomeEmail(e.target.checked)}
                className="w-4 h-4 rounded cursor-pointer"
              />
              <span className="text-sm text-gray-700">
                Enviar email de bienvenida con datos de acceso
              </span>
            </label>
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
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-[#28B4AD] text-white font-semibold rounded-lg hover:bg-[#219892] transition-colors disabled:opacity-50"
            >
              {loading ? 'Procesando...' : isEditing ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
