// components/profilePageSkeleton.tsx
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function ProfilePageSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-green-50 p-6 animate-fade-in">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
          <CardContent className="p-8 flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-6">
            {/* Avatar */}
            <div className="relative">
              <Skeleton className="w-24 h-24 rounded-full" />
              <Skeleton className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full" />
            </div>

            {/* User Info */}
            <div className="flex-1 space-y-3 text-center md:text-left">
              <Skeleton className="h-6 w-40 mx-auto md:mx-0" />
              <div className="flex justify-center md:justify-start space-x-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 text-center">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="bg-white/50 rounded-lg p-3">
                  <Skeleton className="w-6 h-6 mx-auto mb-2" />
                  <Skeleton className="h-5 w-10 mx-auto mb-1" />
                  <Skeleton className="h-3 w-16 mx-auto" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 text-center">
                <Skeleton className="w-8 h-8 mx-auto mb-2" />
                <Skeleton className="h-5 w-10 mx-auto mb-1" />
                <Skeleton className="h-3 w-20 mx-auto" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Informations personnelles */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-6 w-1/3" />
            {[...Array(4)].map((_, i) => (
              <div key={i} className="grid md:grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Second section */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-6 w-1/3" />
            {[...Array(2)].map((_, i) => (
              <div key={i} className="grid md:grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Skeleton className="h-10 w-48 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
