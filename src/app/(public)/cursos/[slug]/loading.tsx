export default function CourseLoading() {
  return (
    <div className="bg-slate-900 min-h-screen">
      <div className="pt-32 pb-20 container mx-auto px-6">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="space-y-6">
            <div className="w-40 h-4 bg-slate-800 rounded animate-pulse"></div>
            <div className="w-full h-20 bg-slate-800 rounded animate-pulse"></div>
            <div className="w-2/3 h-6 bg-slate-800 rounded animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            <div className="lg:col-span-5 space-y-4">
              <div className="w-full h-8 bg-slate-800 rounded animate-pulse"></div>
              <div className="w-full h-32 bg-slate-800 rounded animate-pulse"></div>
            </div>
            <div className="lg:col-span-7 space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-full h-16 bg-slate-800 rounded-xl animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
