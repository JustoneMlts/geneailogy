import { Sparkles, Users } from "lucide-react"

export default function WidgetAISuggestions() {
  const aiSuggestions = [
    { id: "1", text: "Date de naissance manquante : Grand-père Jean", icon: Sparkles },
    { id: "2", text: "Profil similaire : Jean Dupont (1920-1995)", icon: Users },
  ]

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-md shadow-sm p-3 border border-purple-100">
      <div className="flex items-center gap-1.5 mb-2">
        <Sparkles className="w-4 h-4 text-purple-600" />
        <h3 className="font-semibold text-gray-900 text-sm">Suggestions IA</h3>
      </div>
      <div className="space-y-1.5">
        {aiSuggestions.map((s) => (
          <div key={s.id} className="flex items-start gap-2 p-2 bg-white rounded text-xs text-gray-700 hover:bg-purple-50 cursor-pointer">
            <s.icon className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
            <span>{s.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
