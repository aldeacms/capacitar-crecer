'use client'

import { createCourse } from '@/actions/cursos'
import CourseForm from '@/components/admin/CourseForm'

export default function NuevoCursoPage() {
  return (
    <CourseForm 
      title="Crear Nuevo Curso"
      submitText="Crear Curso"
      loadingText="Creando Curso..."
      onSubmit={createCourse}
    />
  )
}
