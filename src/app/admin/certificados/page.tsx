import { getTemplates, getCertificadosEmitidos, getCursos } from '@/actions/certificados-templates'
import CertificadosClient from './CertificadosClient'

export default async function CertificadosAdminPage() {
  const [templates, certificados, cursos] = await Promise.all([
    getTemplates(),
    getCertificadosEmitidos(),
    getCursos(),
  ])

  return <CertificadosClient templates={templates} certificados={certificados} cursos={cursos} />
}
