export default function OrganisasiLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-56 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-80 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="h-9 w-36 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="border rounded-lg p-4 flex items-center gap-3 bg-white">
            <div className="w-9 h-9 rounded-lg bg-gray-100 animate-pulse" />
            <div className="space-y-1">
              <div className="h-6 w-8 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      {/* Tabs skeleton */}
      <div className="border-b border-gray-200">
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 w-24 bg-gray-100 rounded animate-pulse mb-1" />
          ))}
        </div>
      </div>

      {/* Content skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="border rounded-xl p-5 space-y-3 bg-white">
            <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
            <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
            <div className="h-3 w-full bg-gray-100 rounded animate-pulse" />
            <div className="h-3 w-3/4 bg-gray-100 rounded animate-pulse" />
            <div className="flex gap-2 pt-2">
              <div className="h-8 flex-1 bg-gray-100 rounded animate-pulse" />
              <div className="h-8 w-8 bg-gray-100 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
