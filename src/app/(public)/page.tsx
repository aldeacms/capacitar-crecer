import Hero from "@/components/public/Hero";
import Stats from "@/components/public/Stats";
import FeaturedCourses from "@/components/public/FeaturedCourses";
import { ClientLogos, ContactForm } from "@/components/public/HomeSections";
import { createClient } from "@/lib/supabase-server";
import { getAppConfig, getSeccionesLanding } from "@/actions/config";
import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const config = await getAppConfig()
  return {
    title: config?.meta_title_default ?? 'Capacitar & Crecer | Formación Profesional y Elearning',
    description: config?.meta_description_default ?? 'Potencia tu carrera con nuestros cursos de alimentos, industria, ofimática y más.',
  }
}

export default async function Home() {
  const supabase = await createClient();

  const [courses_result, secciones, config] = await Promise.all([
    supabase
      .from('cursos')
      .select(`*, categorias ( nombre ), modulos ( id, lecciones (id) )`)
      .eq('estado', 'publicado')
      .order('created_at', { ascending: false })
      .limit(6),
    getSeccionesLanding(),
    getAppConfig(),
  ])

  const processedCourses = courses_result.data?.map(c => ({
    ...c,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    categoria_nombre: (c.categorias as any)?.nombre || 'General',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lessons_count: c.modulos?.reduce((acc: number, m: any) => acc + (m.lecciones?.length || 0), 0) || 0,
    tiene_sence: !!c.tiene_sence
  })) || [];

  const heroSec = secciones.find(s => s.seccion === 'hero')
  const statsSec = secciones.find(s => s.seccion === 'stats')
  const clientesSec = secciones.find(s => s.seccion === 'clientes')

  return (
    <>
      <Hero contenido={heroSec?.contenido as never} />
      <Stats contenido={statsSec?.contenido as never} />
      <FeaturedCourses initialCourses={processedCourses} />
      <ClientLogos
        titulo={clientesSec?.contenido?.titulo as string | undefined}
        items={clientesSec?.contenido?.items as never}
      />
      <ContactForm
        email={config?.email_contacto}
        telefono={config?.telefono_contacto}
      />
    </>
  );
}