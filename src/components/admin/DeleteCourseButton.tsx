'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
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
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const button = (
    <button
      onClick={() => setShowModal(true)}
      className={
        variant === 'icon'
          ? 'p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all'
          : 'flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-bold hover:bg-red-100 transition-all'
      }
      title="Eliminar curso"
    >
      <Trash2 size={variant === 'icon' ? 16 : 16} />
      {variant === 'full' && 'Eliminar curso'}
    </button>
  )

  return (
    <>
      {button}
      {mounted && showModal && createPortal(
        <DeleteCourseModal cursoId={cursoId} onClose={() => setShowModal(false)} />,
        document.body
      )}
    </>
  )
}
