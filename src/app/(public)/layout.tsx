export const dynamic = 'force-dynamic'

import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import { getAppConfig } from "@/actions/config";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const config = await getAppConfig()

  const footerConfig = config
    ? {
        nombre_otec: config.nombre_otec,
        slogan: config.slogan,
        email_contacto: config.email_contacto,
        telefono_contacto: config.telefono_contacto,
        direccion: config.direccion ?? undefined,
        redes_sociales: config.redes_sociales,
      }
    : undefined

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar nombreOtec={config?.nombre_otec} />
      <main className="flex-grow">
        {children}
      </main>
      <Footer config={footerConfig} />
    </div>
  );
}
