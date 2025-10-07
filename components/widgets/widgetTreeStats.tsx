import { TreePine, Users, FileText, MapPin, TrendingUp } from "lucide-react"

export default function WidgetTreeStats() {
  const stats = [
    { label: "Générations", value: 5, icon: TreePine, color: "text-blue-600" },
    { label: "Membres", value: 47, icon: Users, color: "text-purple-600" },
    { label: "Photos", value: 128, icon: FileText, color: "text-green-600" },
    { label: "Pays", value: 3, icon: MapPin, color: "text-orange-600" },
  ]

  return (
    <div className="bg-white rounded-md shadow-sm p-3 border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-900 text-sm">Votre Arbre</h3>
        <TrendingUp className="w-4 h-4 text-green-500" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col items-center p-2 bg-gray-50 rounded-md">
            <stat.icon className={`w-4 h-4 mb-1 ${stat.color}`} />
            <div className="text-base font-bold text-gray-900">{stat.value}</div>
            <div className="text-xs text-gray-600">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-3 pt-2 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">Complétude</span>
          <span className="font-semibold text-blue-600">68%</span>
        </div>
        <div className="mt-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600 rounded-full" style={{ width: "68%" }}></div>
        </div>
      </div>
    </div>
  )
}
