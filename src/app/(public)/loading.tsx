export default function Loading() {
  return (
    <div className="bg-slate-900 min-h-screen">
      {/* Hero Skeleton */}
      <div className="pt-32 pb-20 container mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="w-32 h-4 bg-slate-800 rounded animate-pulse"></div>
            <div className="w-3/4 h-16 bg-slate-800 rounded animate-pulse"></div>
            <div className="w-full h-24 bg-slate-800 rounded animate-pulse"></div>
            <div className="flex gap-4">
              <div className="w-40 h-14 bg-slate-800 rounded-2xl animate-pulse"></div>
              <div className="w-40 h-14 bg-slate-800 rounded-2xl animate-pulse"></div>
            </div>
          </div>
          <div className="h-[400px] bg-slate-800 rounded-[3rem] animate-pulse hidden lg:block"></div>
        </div>
      </div>

      {/* Grid Skeleton */}
      <div className="py-24 container mx-auto px-6">
        <div className="flex justify-between items-end mb-12">
          <div className="space-y-4">
            <div className="w-48 h-4 bg-slate-800 rounded animate-pulse"></div>
            <div className="w-64 h-10 bg-slate-800 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-[450px] bg-slate-800 rounded-[2rem] animate-pulse"></div>
          ))}
        </div>
      </div>
    </div>
  )
}
