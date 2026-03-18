import { Download, FileText } from 'lucide-react'

interface Archivo {
  id: string
  nombre_archivo: string
  archivo_url: string
}

interface ArchivosAdjuntosProps {
  archivos: Archivo[]
}

export default function ArchivosAdjuntos({ archivos }: ArchivosAdjuntosProps) {
  if (!archivos || archivos.length === 0) {
    return null
  }

  return (
    <div className="w-full mt-8 bg-gray-50 rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <FileText size={20} className="text-[#28B4AD]" />
        <h3 className="text-sm font-bold text-gray-900">
          Archivos adjuntos ({archivos.length})
        </h3>
      </div>

      <div className="space-y-2">
        {archivos.map(archivo => (
          <a
            key={archivo.id}
            href={archivo.archivo_url}
            download
            className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-[#28B4AD] hover:bg-[#28B4AD]/5 transition-all group"
          >
            <span className="text-sm text-gray-700 font-medium group-hover:text-[#28B4AD] truncate">
              {archivo.nombre_archivo}
            </span>
            <Download size={16} className="text-gray-400 group-hover:text-[#28B4AD] flex-shrink-0 ml-2" />
          </a>
        ))}
      </div>
    </div>
  )
}
