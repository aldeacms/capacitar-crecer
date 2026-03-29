'use client'

interface TooltipProps {
  label: string
  children: React.ReactNode
}

export default function Tooltip({ label, children }: TooltipProps) {
  return (
    <span className="relative group/tip inline-flex items-center justify-center">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap rounded-md bg-slate-800 px-2 py-1 text-[11px] font-medium text-white opacity-0 group-hover/tip:opacity-100 transition-opacity duration-100 z-50 shadow-lg"
      >
        {label}
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
      </span>
    </span>
  )
}
