'use server'

import { Suspense } from 'react'
import { Users, Zap, BookOpen, TrendingUp, ClipboardList, Award } from 'lucide-react'
import { getDashboardMetrics, getMatriculasChart, getTopCursos } from '@/actions/dashboard'
import { SkeletonGrid, SkeletonBarChart } from '@/components/ui/SkeletonLoader'
import MetricCard from '@/components/admin/MetricCard'
import MatriculasChartClient from '@/components/admin/MatriculasChartClient'
import TopCursosChartClient from '@/components/admin/TopCursosChartClient'

export default async function AdminDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Administrativo</h1>
        <p className="text-gray-600">Métricas de la plataforma en tiempo real</p>
      </div>

      {/* Metrics Grid */}
      <Suspense fallback={<SkeletonGrid />}>
        <MetricsSection />
      </Suspense>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Suspense fallback={<SkeletonBarChart />}>
          <MatriculasSection />
        </Suspense>

        <Suspense fallback={<SkeletonBarChart />}>
          <TopCursosSection />
        </Suspense>
      </div>
    </div>
  )
}

async function MetricsSection() {
  const metrics = await getDashboardMetrics()

  if ('error' in metrics) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        Error al cargar métricas: {metrics.error}
      </div>
    )
  }

  const cards = [
    {
      label: 'Total de Usuarios',
      value: metrics.totalUsuarios,
      icon: <Users size={32} />,
      color: 'bg-blue-500',
    },
    {
      label: 'Usuarios Activos (30 días)',
      value: metrics.usuariosActivos,
      icon: <Zap size={32} />,
      color: 'bg-green-500',
    },
    {
      label: 'Cursos Disponibles',
      value: metrics.totalCursos,
      icon: <BookOpen size={32} />,
      color: 'bg-purple-500',
    },
    {
      label: 'Cursos con Matrículas',
      value: metrics.cursosActivos,
      icon: <TrendingUp size={32} />,
      color: 'bg-orange-500',
    },
    {
      label: 'Total de Matrículas',
      value: metrics.totalMatriculas,
      icon: <ClipboardList size={32} />,
      color: 'bg-pink-500',
    },
    {
      label: 'Certificados Emitidos',
      value: metrics.certificadosEmitidos,
      icon: <Award size={32} />,
      color: 'bg-teal-500',
    },
    // TODO: Mostrar ingresos cuando se implemente sistema de pagos real
    // {
    //   label: 'Ingresos Totales',
    //   value: `$${metrics.ingresoTotal.toLocaleString('es-CL')}`,
    //   icon: <DollarSign size={32} />,
    //   color: 'bg-emerald-500',
    // },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((card) => (
        <MetricCard key={card.label} {...card} />
      ))}
    </div>
  )
}

async function MatriculasSection() {
  const data = await getMatriculasChart()

  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Matrículas (Últimos 30 días)</h2>
        <div className="h-80 flex items-center justify-center text-gray-500">
          Sin datos disponibles
        </div>
      </div>
    )
  }

  return <MatriculasChartClient data={data} />
}

async function TopCursosSection() {
  const data = await getTopCursos()

  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Top 5 Cursos</h2>
        <div className="h-80 flex items-center justify-center text-gray-500">
          Sin datos disponibles
        </div>
      </div>
    )
  }

  return <TopCursosChartClient data={data} />
}
