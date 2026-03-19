'use client'

interface MetricCardProps {
  label: string
  value: number
  icon: string
  color: string
}

export default function MetricCard({ label, value, icon, color }: MetricCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200">
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <span className="text-4xl">{icon}</span>
          <div className={`${color} h-2 w-2 rounded-full`} />
        </div>
        <p className="text-gray-600 text-sm font-medium mb-2">{label}</p>
        <p className="text-3xl font-bold text-gray-900">{value.toLocaleString('es-CL')}</p>
      </div>
      <div className={`${color} h-1`} />
    </div>
  )
}
