'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import DeleteCourseModal from './DeleteCourseModal'

interface DeleteCourseButtonProps {
  cursoId: string
  cursoTitulo: string
  variant?: 'icon' | 'full'
}

export default function DeleteCourseButton({
  cursoId,
  cursoTitulo,
  variant = 'icon',
}: DeleteCourseButtonProps) {
  const [showModal, setShowModal] = useState(false)

  if (variant === 'icon') {
    return (
      <>
        <button
          onClick={() => setShowModal(true)}
          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all"
          title="Eliminar curso"
        >
          <Trash2 size={16} />
        </button>
        {showModal && <DeleteCourseModal cursoId={cursoId} onClose={() => setShowModal(false)} />}
      </>
    )
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-bold hover:bg-red-100 transition-all"
      >
        <Trash2 size={16} />
        Eliminar curso
      </button>
      {showModal && <DeleteCourseModal cursoId={cursoId} onClose={() => setShowModal(false)} />}
    </>
  )
}
