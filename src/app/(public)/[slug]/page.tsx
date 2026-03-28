import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getPaginaBySlug } from '@/actions/paginas'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const pagina = await getPaginaBySlug(slug)
  if (!pagina) return {}

  return {
    title: pagina.meta_title || pagina.titulo,
    description: pagina.meta_description || undefined,
  }
}

export default async function PaginaCMSPage({ params }: Props) {
  const { slug } = await params
  const pagina = await getPaginaBySlug(slug)

  if (!pagina) notFound()

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <article
        className="prose prose-gray max-w-none"
        dangerouslySetInnerHTML={{ __html: pagina.contenido_html }}
      />
    </div>
  )
}
