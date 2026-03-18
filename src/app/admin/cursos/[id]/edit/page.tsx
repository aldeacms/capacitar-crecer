import { updateCourse } from '@/actions/cursos'
import { createClient } from '@/lib/supabase-server'
import CourseForm from '@/components/admin/CourseForm'
import { notFound } from 'next/navigation'

export default async function EditarCursoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: curso } = await supabase
    .from('cursos')
    .select('*')
    .eq('id', id)
    .single()

  if (!curso) notFound()

  const handleUpdate = async (formData: FormData) => {
    'use server'
    return await updateCourse(formData)
  }

  return (
    <CourseForm
      title="Editar Curso"
      initialData={curso}
      submitText="Guardar Cambios"
      loadingText="Actualizando..."
      onSubmit={handleUpdate}
    />
  )
}
