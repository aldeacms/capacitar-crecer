'use client'

interface EyebrowProps {
  children: React.ReactNode
  centered?: boolean
  className?: string
}

/**
 * Truco Aldea del Eyebrow:
 * Pequeño texto superior en mayúsculas, con tracking amplio y color esmeralda.
 * Mejora la jerarquía visual y el escaneo por parte de usuarios y agentes IA.
 */
export default function Eyebrow({ children, centered = false, className = "" }: EyebrowProps) {
  return (
    <p className={`
      text-emerald-500 
      text-[10px] md:text-xs 
      font-bold 
      tracking-[0.2em] 
      uppercase 
      mb-4 
      ${centered ? 'text-center' : 'text-left'}
      ${className}
    `}>
      {children}
    </p>
  )
}
