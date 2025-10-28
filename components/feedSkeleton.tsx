// components/FeedSkeleton.tsx
import { Card, CardContent } from "./ui/card"

export const FeedSkeleton = () => {
  const skeletons = [1, 2, 3]
  return (
    <div className="space-y-6 animate-pulse">
      {skeletons.map((n) => (
        <Card key={n} className="border-0 shadow-md overflow-hidden">
          <CardContent className="p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gray-200"></div>
              <div className="space-y-2 flex-1">
                <div className="h-3 w-1/3 bg-gray-200 rounded"></div>
                <div className="h-2 w-1/4 bg-gray-100 rounded"></div>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-3">
              <div className="h-3 bg-gray-200 rounded w-5/6"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>

            {/* Image placeholder */}
            <div className="w-full h-48 bg-gray-100 rounded-lg"></div>

            {/* Buttons */}
            <div className="flex justify-between pt-3">
              <div className="h-4 w-16 bg-gray-200 rounded"></div>
              <div className="h-4 w-20 bg-gray-200 rounded"></div>
              <div className="h-4 w-16 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
