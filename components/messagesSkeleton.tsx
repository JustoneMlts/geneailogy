"use client"

export default function MessagesSkeleton() {
  return (
    <div className="h-[calc(100vh-73px)] flex-1 flex overflow-hidden w-full p-6 gap-4 select-none">
      {/* Sidebar Skeleton */}
      <div className="w-full md:w-96 bg-white/70 rounded-2xl shadow-md flex flex-col h-full overflow-hidden border border-white/20">
        <div className="p-6 border-b border-gray-200/50 bg-white/50">
          <div className="h-6 w-40 bg-gray-200 rounded mb-4 animate-pulse"></div>
          <div className="h-9 w-full bg-gray-200 rounded-full animate-pulse"></div>
        </div>

        <div className="flex-1 overflow-y-hidden p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/50">
              <div className="w-14 h-14 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-3 w-1/2 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main chat skeleton */}
      <div className="flex-1 flex flex-col bg-white/70 backdrop-blur-sm rounded-2xl shadow-md h-full overflow-hidden border border-white/20">
        {/* Header */}
        <div className="border-b border-gray-200/50 px-6 py-4 flex items-center justify-between bg-white/50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="flex gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 p-6 overflow-hidden space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
              <div className="max-w-[70%] bg-gray-200 rounded-3xl px-4 py-3 w-40 h-6 animate-pulse"></div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="border-t border-gray-200/50 px-6 py-4 bg-white/50">
          <div className="h-10 w-full bg-gray-200 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  )
}
