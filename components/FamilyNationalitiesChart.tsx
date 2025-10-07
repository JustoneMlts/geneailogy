import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Crown, TrendingUp } from 'lucide-react';
import { MemberType } from '@/lib/firebase/models';

interface LastNameData {
  lastName: string;
  count: number;
  percentage: number;
  color: string;
}

interface FamilyLastNamesChartProps {
  members?: MemberType[];
}

const FamilyLastNamesChart: React.FC<FamilyLastNamesChartProps> = ({ members }) => {
  // État pour les animations
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [animatedData, setAnimatedData] = useState<LastNameData[]>([]);
  const [progressValues, setProgressValues] = useState<Record<string, number>>({});

  // Couleurs prédéfinies pour les noms de famille - mémorisées
  const lastNameColors = useMemo(() => [
    '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6',
    '#ec4899', '#14b8a6', '#f97316', '#84cc16', '#6366f1',
    '#dc2626', '#059669', '#d97706', '#7c3aed', '#be185d',
    '#16a34a', '#ca8a04', '#0ea5e9', '#ea580c', '#65a30d'
  ], []);

  // Données processées avec useMemo pour éviter les recalculs constants
  const data = useMemo((): LastNameData[] => {
    if (!members || members.length === 0) {
      return [];
    }

    const lastNameCount: Record<string, number> = {};
    let totalMembers = 0;

    members.forEach((member: MemberType) => {
      if (member.lastName && member.lastName.trim() !== '') {
        const cleanLastName = member.lastName.trim();
        lastNameCount[cleanLastName] = (lastNameCount[cleanLastName] || 0) + 1;
        totalMembers++;
      }
    });

    // Convertir en format pour l'affichage
    return Object.entries(lastNameCount)
      .map(([lastName, count], index): LastNameData => ({
        lastName,
        count,
        percentage: Math.round((count / totalMembers) * 100),
        color: lastNameColors[index % lastNameColors.length]
      }))
      .sort((a, b) => b.count - a.count); // Trier par nombre décroissant
  }, [members, lastNameColors]);

  const totalMembers = useMemo(() => {
    return data.reduce((sum, item) => sum + item.count, 0);
  }, [data]);

  // Animation d'entrée du composant
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Reset des états d'animation quand les données changent
  useEffect(() => {
    setAnimatedData([]);
    setProgressValues({});
    setIsVisible(false);

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    return () => clearTimeout(timer);
  }, [data]);

  // Animation des données
  useEffect(() => {
    if (!isVisible || data.length === 0) return;

    const animateData = () => {
      // Initialiser avec des valeurs à 0
      const initialData = data.map(item => ({ ...item, count: 0, percentage: 0 }));
      setAnimatedData(initialData);

      // Initialiser les barres de progression à 0
      const initialProgress: Record<string, number> = {};
      data.forEach(item => {
        initialProgress[item.lastName] = 0;
      });
      setProgressValues(initialProgress);

      // Animer progressivement vers les vraies valeurs
      const duration = 2000;
      const steps = 60;
      const stepTime = duration / steps;

      let currentStep = 0;
      const interval = setInterval(() => {
        currentStep++;
        const progress = currentStep / steps;
        const easedProgress = 1 - Math.pow(1 - progress, 3); // Easing cubic

        const newData = data.map(item => ({
          ...item,
          count: Math.round(item.count * easedProgress),
          percentage: Math.round(item.percentage * easedProgress)
        }));

        const newProgress: Record<string, number> = {};
        data.forEach(item => {
          newProgress[item.lastName] = Math.round(item.percentage * easedProgress);
        });

        setAnimatedData(newData);
        setProgressValues(newProgress);

        if (currentStep >= steps) {
          clearInterval(interval);
          setAnimatedData(data);
          const finalProgress: Record<string, number> = {};
          data.forEach(item => {
            finalProgress[item.lastName] = item.percentage;
          });
          setProgressValues(finalProgress);
        }
      }, stepTime);

      return () => clearInterval(interval);
    };

    const timer = setTimeout(animateData, 500);
    return () => clearTimeout(timer);
  }, [isVisible, data]);

  // Affichage si pas de données
  if (!members || data.length === 0) {
    return (
      <Card className="shadow-md border-0 card-hover h-full">
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <Users className="h-5 w-5 text-blue-500" />
            <span>Noms de famille</span>
          </CardTitle>
          <CardDescription>
            Répartition des noms de famille dans votre arbre
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Aucun nom de famille renseigné</p>
              <p className="text-sm">Ajoutez des membres avec leurs noms pour voir la répartition</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 8px rgba(59, 130, 246, 0.3); }
          50% { box-shadow: 0 0 16px rgba(59, 130, 246, 0.6); }
        }
      `}</style>

      <Card className="shadow-md border-0 card-hover h-full flex flex-col">
        <CardHeader className="flex-shrink-0 pb-4">
          <CardTitle className={`text-lg flex items-center space-x-2 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
            <Users className={`h-5 w-5 text-blue-500 transition-all duration-700 ${isVisible ? 'rotate-0 scale-100' : 'rotate-180 scale-0'}`} />
            <span>Noms de famille</span>
          </CardTitle>
          <CardDescription className={`transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            Répartition des noms de famille dans votre arbre
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col overflow-hidden pb-4">
          <div className="flex flex-col h-full">
            {/* Statistiques en haut compactes */}
            <div className={`grid grid-cols-3 gap-2 mb-4 flex-shrink-0 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-2 rounded-lg text-center">
                <Users className="h-4 w-4 text-blue-600 mx-auto mb-1" />
                <p className={`text-lg font-bold text-blue-900 transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                  {totalMembers}
                </p>
                <span className="text-xs text-blue-800">Membres</span>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-green-100 p-2 rounded-lg text-center">
                <TrendingUp className="h-4 w-4 text-green-600 mx-auto mb-1" />
                <p className={`text-lg font-bold text-green-900 transition-all duration-1000 delay-600 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                  {data.length}
                </p>
                <span className="text-xs text-green-800">Noms</span>
              </div>

              {data.length > 0 && (
                <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-2 rounded-lg text-center">
                  <Crown className="h-4 w-4 text-yellow-600 mx-auto mb-1" />
                  <p className={`text-sm font-bold text-yellow-900 transition-all duration-1000 delay-700 truncate ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                    {data[0]?.lastName}
                  </p>
                  <span className="text-xs text-yellow-800">Principal</span>
                </div>
              )}
            </div>

            {/* Liste des noms de famille avec scroll */}
            <div className="flex-1 min-h-0 flex flex-col">
              <h3 className="font-semibold text-gray-800 border-b pb-2 mb-3 flex-shrink-0">Répartition par nom</h3>

              <div
                className={`flex-1 overflow-y-auto pr-1 transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#cbd5e1 #f1f5f9'
                }}
              >
                <div className="space-y-3 pb-2">
                  {animatedData.map((item, index) => {
                    const currentProgress = progressValues[item.lastName] || 0;
                    return (
                      <div
                        key={item.lastName}
                        className={`p-3 bg-white border border-gray-100 rounded-lg shadow-sm transition-all duration-500 hover:shadow-md ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}
                        style={{ transitionDelay: `${600 + index * 50}ms` }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div
                              className={`w-3 h-3 rounded-full flex-shrink-0 transition-all duration-300`}
                              style={{
                                backgroundColor: item.color,
                                transform: isVisible ? 'scale(1)' : 'scale(0)',
                                transitionDelay: `${700 + index * 50}ms`
                              }}
                            />
                            <div className="min-w-0">
                              <h4 className="font-semibold text-gray-900 text-sm truncate">{item.lastName}</h4>
                              <p className="text-xs text-gray-500">
                                {index === 0 && <Crown className="inline h-2 w-2 mr-1 text-yellow-500" />}
                                #{index + 1}
                              </p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span className="text-lg font-bold text-gray-900">
                              {item.count}
                            </span>
                            <div
                              className="text-xs font-semibold transition-all duration-300"
                              style={{ color: item.color }}
                              key={currentProgress}
                            >
                              {currentProgress}%
                            </div>
                          </div>
                        </div>

                        {/* Barre de progression */}
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-2 rounded-full transition-all duration-500 ease-out relative"
                            style={{
                              backgroundColor: item.color,
                              width: `${currentProgress}%`,
                              boxShadow: currentProgress > 0 ? `0 0 8px ${item.color}40` : 'none'
                            }}
                          >
                            {/* Effet de brillance animé */}
                            <div
                              className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
                              style={
                                currentProgress > 0 && currentProgress === item.percentage
                                  ? {
                                    animationName: "shimmer",
                                    animationDuration: "2s",
                                    animationTimingFunction: "ease-in-out",
                                    animationIterationCount: "1",
                                    animationDelay: `${1000 + index * 100}ms`,
                                  }
                                  : { animation: "none" }
                              }
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CSS personnalisé pour la scrollbar */}
      <style jsx global>{`
        .scrollbar-custom {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 #f1f5f9;
        }
        
        .scrollbar-custom::-webkit-scrollbar {
          width: 6px;
        }
        
        .scrollbar-custom::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }
        
        .scrollbar-custom::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        
        .scrollbar-custom::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </>
  );
};

export { FamilyLastNamesChart };