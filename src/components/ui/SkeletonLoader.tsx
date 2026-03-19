'use client'

/**
 * Skeleton Loader components para mejor UX mientras se cargan datos
 */

export function SkeletonCard() {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
      <div className="h-8 bg-gray-200 rounded w-1/2 mb-6"></div>
      <div className="space-y-3">
        <div className="h-3 bg-gray-200 rounded w-full"></div>
        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
      </div>
    </div>
  )
}

export function SkeletonBarChart() {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/3 mb-6"></div>
      <div className="flex items-end justify-around h-64 gap-2">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="bg-gray-200 rounded"
            style={{
              width: '12%',
              height: `${Math.random() * 60 + 40}%`
            }}
          ></div>
        ))}
      </div>
    </div>
  )
}

export function SkeletonLineChart() {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/3 mb-6"></div>
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="h-3 bg-gray-200 rounded w-20"></div>
            <div className="h-3 bg-gray-200 rounded flex-1"></div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function SkeletonTable() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 animate-pulse">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex gap-4">
        <div className="h-4 bg-gray-200 rounded flex-1"></div>
        <div className="h-4 bg-gray-200 rounded w-20"></div>
        <div className="h-4 bg-gray-200 rounded w-20"></div>
      </div>

      {/* Rows */}
      {[...Array(5)].map((_, i) => (
        <div key={i} className="p-4 border-b border-gray-100 flex gap-4">
          <div className="h-4 bg-gray-200 rounded flex-1"></div>
          <div className="h-4 bg-gray-200 rounded w-20"></div>
          <div className="h-4 bg-gray-200 rounded w-20"></div>
        </div>
      ))}
    </div>
  )
}

export function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[...Array(3)].map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}
