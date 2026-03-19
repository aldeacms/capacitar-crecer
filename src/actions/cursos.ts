'use server'

import { revalidatePath } from 'next/cache'

import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ensureUniqueSlug(supabase: any, table: string, baseSlug: string, currentId?: string) {
  let uniqueSlug = baseSlug
  let counter = 1
  let exists = true

  while (exists) {
    let query = supabase.from(table).select('id').eq('slug', uniqueSlug)
    if (currentId) query = query.neq('id', currentId)
    const { data } = await query.maybeSingle()
    if (!data) {
      exists = false
    } else {
      counter++
      uniqueSlug = `${baseSlug}-${counter}`
    }
  }
  return uniqueSlug
}

export async function createCourse(formData: FormData) {
  await requireAdmin()
  const supabaseAdmin = getSupabaseAdmin()

  const catIdStr = formData.get('categoria_id') as string
  const categoria_id = (catIdStr && catIdStr.trim() !== '') ? catIdStr : null

  // Capturamos el nuevo campo SENCE
  const tiene_sence = formData.get('tiene_sence') === 'on'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const insertData: any = {
    titulo: formData.get('titulo') as string,
    slug: formData.get('slug') as string,
    descripcion_breve: formData.get('descripcion_breve') as string,
    dirigido_a: formData.get('dirigido_a') as string,
    categoria_id,
    estado: formData.get('estado') as string,
    modalidad: formData.get('modalidad') as string,
    horas: Number(formData.get('horas')),
    tipo_acceso: formData.get('tipo_acceso') as string,
    precio_curso: Number(formData.get('precio_curso')),
    precio_certificado: Number(formData.get('precio_certificado')),
    porcentaje_aprobacion: Number(formData.get('porcentaje_aprobacion')),
    objetivos: formData.get('objetivos') as string,
    metodologia: formData.get('metodologia') as string,
    contenido_programatico: formData.get('contenido_programatico') as string,
    caracteristicas_generales: formData.get('caracteristicas_generales') as string,
    tiene_sence: tiene_sence,
    tiene_certificado: formData.get('tiene_certificado') === 'on'
  }

  const imageFile = formData.get('imagen_file') as File | null

  try {
    insertData.slug = await ensureUniqueSlug(supabaseAdmin, 'cursos', insertData.slug)

    if (imageFile && imageFile.size > 0) {
      const fileExt = imageFile.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const { error: uploadError } = await supabaseAdmin.storage.from('imagenes_cursos').upload(`portadas/${fileName}`, imageFile, { upsert: true })
      if (!uploadError) {
        const { data: { publicUrl } } = supabaseAdmin.storage.from('imagenes_cursos').getPublicUrl(`portadas/${fileName}`)
        insertData.imagen_url = publicUrl
      }
    }

    const { error: insertError } = await supabaseAdmin.from('cursos').insert([insertData])
    if (insertError) return { error: `Error DB: ${insertError.message}` }

    revalidatePath('/admin/cursos')
    revalidatePath('/')
    return { success: true }
  } catch (error: unknown) {
    return { error: (error as Error).message || String(error) }
  }
}

export async function updateCourse(formData: FormData) {
  await requireAdmin()
  const supabaseAdmin = getSupabaseAdmin()
  const id = formData.get('id') as string

  if (!id) return { error: "ID del curso no proporcionado." }

  const catIdStr = formData.get('categoria_id') as string
  const categoria_id = (catIdStr && catIdStr.trim() !== '' && catIdStr !== 'null') ? catIdStr : null

  // Capturamos el nuevo campo SENCE
  const tiene_sence = formData.get('tiene_sence') === 'on'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: any = {
    titulo: formData.get('titulo') as string,
    slug: formData.get('slug') as string,
    descripcion_breve: formData.get('descripcion_breve') as string,
    dirigido_a: formData.get('dirigido_a') as string,
    categoria_id,
    estado: formData.get('estado') as string,
    modalidad: formData.get('modalidad') as string,
    horas: Number(formData.get('horas')),
    tipo_acceso: formData.get('tipo_acceso') as string,
    precio_curso: Number(formData.get('precio_curso')),
    precio_certificado: Number(formData.get('precio_certificado')),
    porcentaje_aprobacion: Number(formData.get('porcentaje_aprobacion')),
    objetivos: formData.get('objetivos') as string,
    metodologia: formData.get('metodologia') as string,
    contenido_programatico: formData.get('contenido_programatico') as string,
    caracteristicas_generales: formData.get('caracteristicas_generales') as string,
    tiene_sence: tiene_sence,
    tiene_certificado: formData.get('tiene_certificado') === 'on'
  }

  const imageFile = formData.get('imagen_file') as File | null
  let imagen_url = formData.get('current_imagen_url') as string

  try {
    updateData.slug = await ensureUniqueSlug(supabaseAdmin, 'cursos', updateData.slug, id)

    if (imageFile && imageFile.size > 0) {
      const fileExt = imageFile.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const { error: uploadError } = await supabaseAdmin.storage.from('imagenes_cursos').upload(`portadas/${fileName}`, imageFile, { upsert: true })
      if (!uploadError) {
        const { data: { publicUrl } } = supabaseAdmin.storage.from('imagenes_cursos').getPublicUrl(`portadas/${fileName}`)
        imagen_url = publicUrl
      }
    }

    if (imagen_url) updateData.imagen_url = imagen_url

    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) delete updateData[key]
    })

    const { error: updateError } = await supabaseAdmin.from('cursos').update(updateData).eq('id', id)
    if (updateError) return { error: `Error BD: ${updateError.message}` }

    revalidatePath(`/admin/cursos/${id}`)
    revalidatePath('/admin/cursos')
    revalidatePath('/')
    revalidatePath(`/cursos/${updateData.slug}`)

    return { success: true }
  } catch (error: unknown) {
    return { error: (error as Error).message || String(error) }
  }
}

// ===== ELIMINACIÓN SEGURA DE CURSOS =====

export type DeleteSummary = {
  titulo: string
  totalModulos: number
  totalLecciones: number
  totalAlumnos: number
  imagenUrl: string | null
  alumnos: Array<{ id: string; nombre: string; email: string }>
  storagePaths: {
    portada: string | null
    archivosLecciones: string[]
  }
}

export async function getDeleteSummary(
  cursoId: string
): Promise<{ data: DeleteSummary } | { error: string }> {
  await requireAdmin()
  try {
    const supabaseAdmin = getSupabaseAdmin()

    // Query 1: obtener jerarquía completa del curso
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: curso, error: cursoError } = await supabaseAdmin
      .from('cursos')
      .select(`
        titulo,
        imagen_url,
        modulos (
          id,
          lecciones (
            id,
            lecciones_archivos ( archivo_url )
          )
        )
      `)
      .eq('id', cursoId)
      .single()

    if (cursoError || !curso) {
      return { error: 'Curso no encontrado' }
    }

    // Query 2: obtener alumnos inscritos
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: matriculas, count: totalAlumnos } = await supabaseAdmin
      .from('matriculas')
      .select('perfil_id', { count: 'exact' })
      .eq('curso_id', cursoId)

    // Query 3: obtener datos de los perfiles
    const alumnosData: Array<{ id: string; nombre: string; email: string }> = []
    if (matriculas && matriculas.length > 0) {
      const perfilIds = matriculas.map((m: any) => m.perfil_id).filter(Boolean)
      if (perfilIds.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: perfiles } = await supabaseAdmin
          .from('perfiles')
          .select('id, nombre_completo')
          .in('id', perfilIds)

        if (perfiles) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          alumnosData.push(...perfiles.map((p: any) => ({
            id: p.id,
            nombre: p.nombre_completo || 'Sin nombre',
            email: 'usuario@capacitar.cl' // email está en auth.users, no en perfiles
          })))
        }
      }
    }

    // Calcular conteos
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const modulos = (curso.modulos ?? []) as any[]
    const totalModulos = modulos.length
    const totalLecciones = modulos.reduce(
      (acc, m) => acc + ((m.lecciones ?? []) as any[]).length, 0
    )

    // Extraer path de portada desde URL pública
    let portadaPath: string | null = null
    if (curso.imagen_url) {
      const match = curso.imagen_url.match(/imagenes_cursos\/(.+)$/)
      portadaPath = match ? match[1] : null
    }

    // Extraer paths de archivos de lecciones
    const archivosLecciones: string[] = []
    for (const modulo of modulos) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const leccion of (modulo.lecciones ?? []) as any[]) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const archivo of (leccion.lecciones_archivos ?? []) as any[]) {
          const match = archivo.archivo_url.match(/archivos_lecciones\/(.+)$/)
          if (match) archivosLecciones.push(match[1])
        }
      }
    }


    return {
      data: {
        titulo: curso.titulo,
        totalModulos,
        totalLecciones,
        totalAlumnos: totalAlumnos ?? 0,
        imagenUrl: curso.imagen_url,
        alumnos: alumnosData,
        storagePaths: { portada: portadaPath, archivosLecciones },
      },
    }
  } catch (error: unknown) {
    return { error: (error as Error).message || String(error) }
  }
}

export async function deleteCourse(
  cursoId: string
): Promise<{ success: true; storageWarnings?: string[] } | { error: string }> {
  await requireAdmin()
  try {
    const supabaseAdmin = getSupabaseAdmin()

    // PASO 1: Re-fetch de rutas de Storage desde el servidor
    const summaryResult = await getDeleteSummary(cursoId)
    if ('error' in summaryResult) {
      return { error: summaryResult.error }
    }

    const { storagePaths } = summaryResult.data
    const storageWarnings: string[] = []

    // PASO 2: Eliminar archivos de lecciones en Storage
    if (storagePaths.archivosLecciones.length > 0) {
      const { error: filesError } = await supabaseAdmin.storage
        .from('archivos_lecciones')
        .remove(storagePaths.archivosLecciones)

      if (filesError) {
        storageWarnings.push(`Archivos de lecciones: ${filesError.message}`)
      }
    }

    // PASO 3: Eliminar portada en Storage
    if (storagePaths.portada) {
      const { error: portadaError } = await supabaseAdmin.storage
        .from('imagenes_cursos')
        .remove([storagePaths.portada])

      if (portadaError) {
        storageWarnings.push(`Imagen portada: ${portadaError.message}`)
      }
    }

    // PASO 4: Eliminar el curso de la BD (CASCADE elimina módulos, lecciones, quizzes, matriculas)
    const { error: dbError } = await supabaseAdmin
      .from('cursos')
      .delete()
      .eq('id', cursoId)

    if (dbError) {
      return { error: `Error al eliminar curso: ${dbError.message}` }
    }

    // PASO 5: Revalidar cache de Next.js
    revalidatePath('/admin/cursos')
    revalidatePath('/')

    // PASO 6: Retornar éxito (con advertencias de Storage si las hubo)
    return {
      success: true,
      ...(storageWarnings.length > 0 && { storageWarnings }),
    }
  } catch (error: unknown) {
    return { error: (error as Error).message || String(error) }
  }
}
