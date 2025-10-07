import { Clock } from "lucide-react"

export default function WidgetRecentActivity() {
  const recentActivities = [
    {
      id: "1",
      user: "Marie Dupont",
      action: "a ajouté une photo de",
      target: "Grand-père Jean",
      time: "Il y a 2h",
      avatar: "https://ui-avatars.com/api/?name=Marie+Dupont&background=ec4899&color=fff",
    },
    {
      id: "2",
      user: "Paul Martin",
      action: "a complété le profil de",
      target: "Tante Sophie",
      time: "Il y a 5h",
      avatar: "https://ui-avatars.com/api/?name=Paul+Martin&background=3b82f6&color=fff",
    },
    {
      id: "3",
      user: "Vous",
      action: "avez ajouté",
      target: "Oncle Robert",
      time: "Hier",
      avatar: "https://ui-avatars.com/api/?name=Vous&background=10b981&color=fff",
    },
  ]

  return (
    <div className="bg-white rounded-md shadow-sm p-3 border border-gray-200">
      <div className="flex items-center gap-1.5 mb-2">
        <Clock className="w-4 h-4 text-gray-600" />
        <h3 className="font-semibold text-gray-900 text-sm">Activité Récente</h3>
      </div>
      <div className="space-y-2">
        {recentActivities.map((a) => (
          <div key={a.id} className="flex gap-2">
            <img src={a.avatar} alt={a.user} className="w-6 h-6 rounded-full" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-900 truncate">
                <span className="font-medium">{a.user}</span>{" "}
                <span className="text-gray-600">{a.action}</span>{" "}
                <span className="font-medium">{a.target}</span>
              </p>
              <p className="text-[11px] text-gray-500">{a.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
