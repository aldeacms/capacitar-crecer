import { Image as ImageIcon } from 'lucide-react'

interface ImagePlaceholderProps {
  className?: string
  titulo?: string
}

export function ImagePlaceholder({ className = 'w-full h-full', titulo = 'Sin imagen' }: ImagePlaceholderProps) {
  return (
    <div className={`${className} bg-gradient-to-br from-slate-100 to-slate-200 flex flex-col items-center justify-center gap-2`}>
      <ImageIcon size={32} className="text-slate-400" />
      <span className="text-sm font-medium text-slate-500">{titulo}</span>
    </div>
  )
}
