"use client"
import { useEffect, useState } from "react"
import { Globe } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getMembersBirthPlaces } from "@/app/controllers/membersController"

interface BirthPlacePoint {
  id: string
  firstName: string
  lastName: string
  birthPlace: {
    lat: number
    lng: number
    country?: string
  }
}

export default function WidgetFamilyDiversity() {
  const [data, setData] = useState<{ country: string; count: number; percentage: number }[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const birthPlaces: BirthPlacePoint[] = await getMembersBirthPlaces()

        if (!birthPlaces || birthPlaces.length === 0) {
          setData([])
          return
        }

        const counts: Record<string, number> = {}
        birthPlaces.forEach(bp => {
          const c = bp.birthPlace.country || "Inconnu"
          counts[c] = (counts[c] || 0) + 1
        })

        const total = birthPlaces.length
        const countries = Object.entries(counts)
          .map(([country, count]) => ({
            country,
            count,
            percentage: Math.round((count / total) * 100),
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 3)

        setData(countries)
      } catch (e) {
        console.error(e)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
      <CardHeader className="pb-2 flex items-center space-x-2">
        <Globe className="h-4 w-4 text-blue-600" />
        <CardTitle className="text-sm font-semibold text-gray-800">Diversité géographique</CardTitle>
      </CardHeader>

      <CardContent className="space-y-2 text-sm">
        {isLoading ? (
          <p className="text-gray-500 text-xs animate-pulse">Chargement...</p>
        ) : data.length === 0 ? (
          <p className="text-gray-500 text-xs">Aucune donnée disponible</p>
        ) : (
          data.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{
                    backgroundColor: ["#3B82F6", "#10B981", "#F59E0B"][index % 3],
                  }}
                />
                <span className="text-gray-800 text-xs">{item.country}</span>
              </div>
              <div className="flex items-center space-x-1 text-xs">
                <span className="font-medium text-gray-900">{item.percentage}%</span>
                <span className="text-gray-500">({item.count})</span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
