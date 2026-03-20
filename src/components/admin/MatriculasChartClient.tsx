'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface MatriculasData {
  date: string
  matriculas: number
}

interface MatriculasChartClientProps {
  data: MatriculasData[]
}

export default function MatriculasChartClient({ data }: MatriculasChartClientProps) {
  // Parse dates and filter to last 14 days for better visibility
  const parsedData = data
    .map((item) => {
      try {
        return {
          ...item,
          // Handle both "DD/MM/YYYY" format and ISO format
          date: item.date,
        }
      } catch {
        return item
      }
    })
    .slice(-14) // Show last 14 days

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.06),_0_4px_16px_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-900">Matrículas (Últimos 30 días)</h2>
        <p className="text-sm text-gray-400 mt-1">Nuevas inscripciones por día</p>
      </div>
      <div className="p-6">
        <ResponsiveContainer width="100%" height={300}>
        <BarChart data={parsedData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
            stroke="#9ca3af"
          />
          <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
            }}
            cursor={{ fill: 'rgba(40, 180, 173, 0.05)' }}
          />
          <Legend />
          <Bar dataKey="matriculas" fill="#28B4AD" name="Matrículas" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      </div>
    </div>
  )
}
