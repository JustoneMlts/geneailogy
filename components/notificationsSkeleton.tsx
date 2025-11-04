"use client"

export default function NotificationsSkeleton() {
  const skeletons = Array.from({ length: 5 })

  return (
    <div className="animate-fade-in w-2/3 mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="h-8 w-1/3 bg-gray-200 rounded mb-3 animate-pulse"></div>
        <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse"></div>
      </div>

      {/* Button skeleton */}
      <div className="flex items-center justify-start my-6">
        <div className="h-9 w-48 bg-gray-200 rounded-full animate-pulse"></div>
      </div>

      {/* Notification cards */}
      <div className="space-y-4">
        {skeletons.map((_, i) => (
          <div
            key={i}
            className="border border-gray-200 bg-white rounded-xl p-4 shadow-sm animate-fade-in"
          >
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-gray-300 rounded-full animate-pulse"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/3 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-3 w-2/3 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-3 w-1/4 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
