import React from 'react';
import { TreePine, Users, Calendar, TrendingUp, FileText, Clock, MapPin, Sparkles } from 'lucide-react';

interface Stat {
  label: string;
  value: string | number;
  icon: React.ComponentType<any>;
  color: string;
}

interface Activity {
  id: string;
  user: string;
  action: string;
  target: string;
  time: string;
  avatar?: string;
}

const Widgets: React.FC = () => {
  const stats: Stat[] = [
    { label: "Générations", value: 5, icon: TreePine, color: "text-blue-600" },
    { label: "Membres", value: 47, icon: Users, color: "text-purple-600" },
    { label: "Photos", value: 128, icon: FileText, color: "text-green-600" },
    { label: "Pays", value: 3, icon: MapPin, color: "text-orange-600" },
  ];

  const recentActivities: Activity[] = [
    {
      id: "1",
      user: "Marie Dupont",
      action: "a ajouté une photo de",
      target: "Grand-père Jean",
      time: "Il y a 2h",
      avatar: "https://ui-avatars.com/api/?name=Marie+Dupont&background=ec4899&color=fff"
    },
    {
      id: "2",
      user: "Paul Martin",
      action: "a complété le profil de",
      target: "Tante Sophie",
      time: "Il y a 5h",
      avatar: "https://ui-avatars.com/api/?name=Paul+Martin&background=3b82f6&color=fff"
    },
    {
      id: "3",
      user: "Vous",
      action: "avez ajouté",
      target: "Oncle Robert",
      time: "Hier",
      avatar: "https://ui-avatars.com/api/?name=Vous&background=10b981&color=fff"
    },
  ];

  const aiSuggestions = [
    { id: "1", text: "Date de naissance manquante : Grand-père Jean", icon: Sparkles },
    { id: "2", text: "Profil similaire : Jean Dupont (1920-1995)", icon: Users },
  ];

  return (
    <div className="w-60 bg-transparent p-2.5 space-y-3 h-fit text-xs">
      {/* Statistiques */}
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
            <div className="h-full bg-blue-600 rounded-full" style={{ width: '68%' }}></div>
          </div>
        </div>
      </div>

      {/* Suggestions IA */}
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

      {/* Activité récente */}
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
    </div>
  );
};

export default Widgets;
