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

interface CursoData {
  id: string
  titulo: string
  matriculas: number
}

interface TopCursosChartClientProps {
  data: CursoData[]
}

export default function TopCursosChartClient({ data }: TopCursosChartClientProps) {
  // Prepare data with shortened titles for better display
  const chartData = data.map((item) => ({
    ...item,
    // Truncate long titles for chart display
    titulo: item.titulo.length > 20 ? item.titulo.substring(0, 17) + '...' : item.titulo,
    fullTitulo: item.titulo,
  }))

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Top 5 Cursos</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 80 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="titulo"
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={100}
            stroke="#9ca3af"
          />
          <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
            cursor={{ fill: 'rgba(40, 180, 173, 0.05)' }}
          />
          <Bar dataKey="matriculas" fill="#28B4AD" name="Matrículas" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
