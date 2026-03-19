/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect } from 'react'
import { getUsuarios, eliminarUsuario } from '@/actions/usuarios'
import { UserModal } from '@/components/admin/UserModal'
import { UserDetailPanel } from '@/components/admin/UserDetailPanel'
import { ChangePasswordModal } from '@/components/admin/ChangePasswordModal'
import { SendEmailModal } from '@/components/admin/SendEmailModal'
import { toast } from 'sonner'
import { Search, Plus, Eye, Edit2, Key, Mail, Trash2, Users, Crown, GraduationCap } from 'lucide-react'

export default function AlumnosPage() {
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [filteredUsuarios, setFilteredUsuarios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'alumno'>('all')

  // Modales
  const [userModalOpen, setUserModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [detailPanelUser, setDetailPanelUser] = useState<any>(null)
  const [passwordModalUser, setPasswordModalUser] = useState<any>(null)
  const [emailModalUser, setEmailModalUser] = useState<any>(null)

  const loadUsuarios = async () => {
    setLoading(true)
    const result = await getUsuarios()

    if ('error' in result) {
      toast.error(result.error)
      setUsuarios([])
    } else {
      setUsuarios(result)
    }

    setLoading(false)
  }

  useEffect(() => {
    loadUsuarios()
  }, [])

  // Filtrar usuarios por búsqueda y rol
  useEffect(() => {
    let filtered = usuarios

    // Filtro de rol
    if (roleFilter !== 'all') {
      filtered = filtered.filter((u) => u.rol === roleFilter)
    }

    // Filtro de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (u) =>
          u.nombre_completo.toLowerCase().includes(term) ||
          u.email.toLowerCase().includes(term) ||
          u.rut.toLowerCase().includes(term)
      )
    }

    setFilteredUsuarios(filtered)
  }, [usuarios, searchTerm, roleFilter])

  const handleCreateUser = () => {
    setEditingUser(null)
    setUserModalOpen(true)
  }

  const handleEditUser = (user: any) => {
    setEditingUser(user)
    setUserModalOpen(true)
  }

  const handleChangePassword = (user: any) => {
    setPasswordModalUser(user)
  }

  const handleSendEmail = (user: any) => {
    setEmailModalUser(user)
  }

  const handleDeleteUser = async (user: any) => {
    if (confirm(`¿Estás seguro de que quieres eliminar a ${user.nombre_completo}? Esta acción no se puede deshacer.`)) {
      const result = await eliminarUsuario(user.id)

      if ('error' in result) {
        toast.error(result.error)
      } else {
        toast.success('Usuario eliminado correctamente')
        loadUsuarios()
      }
    }
  }

  return (
    <>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-[#28B4AD]/20 to-[#28B4AD]/5 rounded-lg flex items-center justify-center">
                <Users size={24} className="text-[#28B4AD]" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-gray-900">Gestión de Usuarios</h1>
                <p className="text-gray-500 text-sm mt-1">Administra admins, alumnos y sus inscripciones.</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleCreateUser}
            className="bg-[#28B4AD] hover:bg-[#219892] text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-md hover:shadow-lg flex items-center gap-2"
          >
            <Plus size={18} /> Nuevo Usuario
          </button>
        </div>

        {/* Filtros y Búsqueda */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Búsqueda */}
          <div className="relative">
            <Search size={18} className="absolute left-3 top-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, email o RUT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input pl-10"
            />
          </div>

          {/* Filtro de Rol */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="form-select"
          >
            <option value="all">Todos los usuarios</option>
            <option value="admin">Solo Administradores</option>
            <option value="alumno">Solo Alumnos</option>
          </select>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-600 text-[11px] uppercase tracking-wider font-bold">
                <th className="px-6 py-4">Nombre</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">RUT</th>
                <th className="px-6 py-4">Rol</th>
                <th className="px-6 py-4 text-center">Cursos</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-100 rounded w-32"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-100 rounded w-40"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-100 rounded w-24"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-100 rounded w-16"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-100 rounded w-8 mx-auto"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-100 rounded w-20 ml-auto"></div>
                    </td>
                  </tr>
                ))
              ) : filteredUsuarios.length > 0 ? (
                filteredUsuarios.map((usuario) => (
                  <tr key={usuario.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#28B4AD]/20 to-[#28B4AD]/5 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-[#28B4AD]">
                            {usuario.nombre_completo.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="font-medium text-gray-900">{usuario.nombre_completo}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600">{usuario.email}</td>

                    <td className="px-6 py-4 text-sm font-mono text-gray-600">{usuario.rut}</td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${
                          usuario.rol === 'admin'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {usuario.rol === 'admin' ? (
                          <>
                            <Crown size={14} />
                            Admin
                          </>
                        ) : (
                          <>
                            <GraduationCap size={14} />
                            Alumno
                          </>
                        )}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-semibold text-gray-900">{usuario.cursos_count}</span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setDetailPanelUser(usuario)}
                          className="p-1.5 text-gray-400 hover:text-[#28B4AD] hover:bg-[#28B4AD]/10 rounded-lg transition-all"
                          title="Ver detalles"
                        >
                          <Eye size={16} />
                        </button>

                        <button
                          onClick={() => handleEditUser(usuario)}
                          className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                          title="Editar usuario"
                        >
                          <Edit2 size={16} />
                        </button>

                        <button
                          onClick={() => handleChangePassword(usuario)}
                          className="p-1.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all"
                          title="Cambiar contraseña"
                        >
                          <Key size={16} />
                        </button>

                        <button
                          onClick={() => handleSendEmail(usuario)}
                          className="p-1.5 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-lg transition-all"
                          title="Enviar correo"
                        >
                          <Mail size={16} />
                        </button>

                        <button
                          onClick={() => handleDeleteUser(usuario)}
                          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="Eliminar usuario"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    {searchTerm || roleFilter !== 'all'
                      ? 'No hay usuarios que coincidan con los filtros.'
                      : 'No hay usuarios registrados todavía. Crea uno para empezar.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Información del Footer */}
        <div className="mt-6 text-center text-sm text-gray-500">
          Mostrando {filteredUsuarios.length} de {usuarios.length} usuarios
        </div>
      </div>

      {/* Modales y Paneles */}
      {userModalOpen && (
        <UserModal
          editingUser={editingUser}
          onClose={() => {
            setUserModalOpen(false)
            setEditingUser(null)
            loadUsuarios()
          }}
        />
      )}

      {detailPanelUser && (
        <UserDetailPanel
          usuario={detailPanelUser}
          onClose={() => setDetailPanelUser(null)}
          onUserUpdated={loadUsuarios}
        />
      )}

      {passwordModalUser && (
        <ChangePasswordModal
          usuario={passwordModalUser}
          onClose={() => {
            setPasswordModalUser(null)
            loadUsuarios()
          }}
        />
      )}

      {emailModalUser && (
        <SendEmailModal
          usuario={emailModalUser}
          onClose={() => setEmailModalUser(null)}
        />
      )}
    </>
  )
}
