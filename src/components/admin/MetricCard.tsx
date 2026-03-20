'use client'

import { ReactNode } from 'react'

interface MetricCardProps {
  label: string
  value: number | string
  icon: ReactNode
  color: string
}

export default function MetricCard({ label, value, icon, color }: MetricCardProps) {
  const formattedValue = typeof value === 'number'
    ? value.toLocaleString('es-CL')
    : value

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.06),_0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_24px_rgba(0,0,0,0.10)] hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-center gap-4">
        <div className={`${color} rounded-xl p-3 text-white shrink-0 shadow-sm`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-500 font-medium mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900 tracking-tight">{formattedValue}</p>
        </div>
      </div>
    </div>
  )
}
