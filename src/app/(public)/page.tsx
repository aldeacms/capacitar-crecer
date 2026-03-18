import Hero from "@/components/public/Hero";
import Stats from "@/components/public/Stats";
import FeaturedCourses from "@/components/public/FeaturedCourses";
import { ClientLogos, ContactForm } from "@/components/public/HomeSections";
import { createClient } from "@/lib/supabase-server";
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Capacitar & Crecer | Formación Profesional y Elearning',
  description: 'Potencia tu carrera con nuestros cursos de alimentos, industria, ofimática y más. Modalidad online y presencial con certificación.',
};

export default async function Home() {
  const supabase = await createClient();

  // Fetch de los cursos: al usar '*', ya incluimos el nuevo campo 'tiene_sence'
  const { data: courses } = await supabase
    .from('cursos')
    .select(`
      *,
      categorias ( nombre ),
      modulos (
        id,
        lecciones (id)
      )
    `)
    .eq('estado', 'publicado')
    .order('created_at', { ascending: false })
    .limit(6);

  // Procesar datos para el frontend con tipado seguro
  const processedCourses = courses?.map(c => ({
    ...c,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    categoria_nombre: (c.categorias as any)?.nombre || 'General',
    // Sumamos todas las lecciones de todos los módulos del curso
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lessons_count: c.modulos?.reduce((acc: number, m: any) => acc + (m.lecciones?.length || 0), 0) || 0,
    // Aseguramos que pase el valor booleano explícito
    tiene_sence: !!c.tiene_sence
  })) || [];

  return (
    <>
      <Hero />
      <Stats />
      <FeaturedCourses initialCourses={processedCourses} />
      <ClientLogos />
      <ContactForm />
    </>
  );
}