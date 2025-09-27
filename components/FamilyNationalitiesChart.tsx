import React, { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, Users } from 'lucide-react';
import { MemberType } from '@/lib/firebase/models';

interface NationalityData {
  country: string;
  count: number;
  percentage: number;
  color: string;
}

interface FamilyNationalitiesChartProps {
  members?: MemberType[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: NationalityData;
  }>;
}

interface CustomLegendProps {
  payload?: Array<{
    color: string;
    value: string;
  }>;
}

const FamilyNationalitiesChart: React.FC<FamilyNationalitiesChartProps> = ({ members }) => {
  // État pour les animations
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [animatedData, setAnimatedData] = useState<NationalityData[]>([]);
  const [progressValues, setProgressValues] = useState<Record<string, number>>({});

  // Couleurs prédéfinies pour tous les pays - mémorisées
  const countryColors = useMemo<Record<string, string>>(() => ({
    'Afghane': '#8B4513',
    'Sud-africaine': '#FFD700',
    'Albanaise': '#DC143C',
    'Algérienne': '#228B22',
    'Allemande': '#000000',
    'Andorrane': '#4169E1',
    'Angolaise': '#8B0000',
    'Antiguaise-et-barbudienne': '#FF6347',
    'Saoudienne': '#006400',
    'Argentine': '#87CEEB',
    'Arménienne': '#FF4500',
    'Australienne': '#FFD700',
    'Autrichienne': '#DC143C',
    'Azerbaïdjanaise': '#4169E1',
    'Bahamienne': '#00CED1',
    'Bahreïnienne': '#DC143C',
    'Bangladaise': '#006400',
    'Barbadienne': '#4169E1',
    'Belge': '#000000',
    'Bélizienne': '#0000FF',
    'Béninoise': '#FFD700',
    'Bhoutanaise': '#FF4500',
    'Biélorusse': '#228B22',
    'Birmane': '#FFD700',
    'Bolivienne': '#DC143C',
    'Bosnienne': '#4169E1',
    'Botswanaise': '#87CEEB',
    'Brésilienne': '#228B22',
    'Brunéienne': '#FFD700',
    'Bulgare': '#228B22',
    'Burkinabée': '#DC143C',
    'Burundaise': '#228B22',
    'Cambodgienne': '#DC143C',
    'Camerounaise': '#228B22',
    'Canadienne': '#DC143C',
    'Cap-verdienne': '#4169E1',
    'Centrafricaine': '#4169E1',
    'Chilienne': '#DC143C',
    'Chinoise': '#DC143C',
    'Chypriote': '#FF4500',
    'Colombienne': '#FFD700',
    'Comorienne': '#228B22',
    'Congolaise': '#4169E1',
    'Congolaise (RDC)': '#87CEEB',
    'Nord-coréenne': '#DC143C',
    'Sud-coréenne': '#DC143C',
    'Costaricienne': '#4169E1',
    'Ivoirienne': '#FF4500',
    'Croate': '#DC143C',
    'Cubaine': '#4169E1',
    'Danoise': '#DC143C',
    'Djiboutienne': '#87CEEB',
    'Dominicaine': '#DC143C',
    'Dominiquaise': '#228B22',
    'Égyptienne': '#DC143C',
    'Émirienne': '#228B22',
    'Équatorienne': '#FFD700',
    'Érythréenne': '#228B22',
    'Espagnole': '#DC143C',
    'Estonienne': '#4169E1',
    'Américaine': '#DC143C',
    'Éthiopienne': '#228B22',
    'Fidjienne': '#87CEEB',
    'Finlandaise': '#4169E1',
    'Française': '#ef4444',
    'Gabonaise': '#228B22',
    'Gambienne': '#DC143C',
    'Géorgienne': '#DC143C',
    'Ghanéenne': '#FFD700',
    'Grecque': '#4169E1',
    'Grenadienne': '#DC143C',
    'Guatémaltèque': '#87CEEB',
    'Guinéenne': '#DC143C',
    'Équato-guinéenne': '#228B22',
    'Bissau-guinéenne': '#FFD700',
    'Guyanienne': '#228B22',
    'Haïtienne': '#4169E1',
    'Hondurienne': '#87CEEB',
    'Hongroise': '#228B22',
    'Indienne': '#FF4500',
    'Indonésienne': '#DC143C',
    'Irakienne': '#228B22',
    'Iranienne': '#228B22',
    'Irlandaise': '#228B22',
    'Islandaise': '#4169E1',
    'Israélienne': '#4169E1',
    'Italienne': '#10b981',
    'Jamaïcaine': '#228B22',
    'Japonaise': '#DC143C',
    'Jordanienne': '#228B22',
    'Kazakhe': '#87CEEB',
    'Kényane': '#228B22',
    'Kirghize': '#DC143C',
    'Kiribatienne': '#4169E1',
    'Koweïtienne': '#228B22',
    'Laotienne': '#DC143C',
    'Lesothane': '#87CEEB',
    'Lettonne': '#8B0000',
    'Libanaise': '#DC143C',
    'Libérienne': '#DC143C',
    'Libyenne': '#228B22',
    'Liechtensteinoise': '#4169E1',
    'Lituanienne': '#FFD700',
    'Luxembourgeoise': '#87CEEB',
    'Macédonienne du Nord': '#DC143C',
    'Malgache': '#228B22',
    'Malaisienne': '#DC143C',
    'Malawienne': '#228B22',
    'Maldivienne': '#DC143C',
    'Malienne': '#228B22',
    'Maltaise': '#DC143C',
    'Marocaine': '#DC143C',
    'Marshallaise': '#4169E1',
    'Mauricienne': '#DC143C',
    'Mauritanienne': '#228B22',
    'Mexicaine': '#228B22',
    'Micronésienne': '#87CEEB',
    'Moldave': '#4169E1',
    'Monégasque': '#DC143C',
    'Mongole': '#DC143C',
    'Monténégrine': '#DC143C',
    'Mozambicaine': '#228B22',
    'Namibienne': '#87CEEB',
    'Nauruane': '#4169E1',
    'Népalaise': '#DC143C',
    'Nicaraguayenne': '#87CEEB',
    'Nigérienne': '#FF4500',
    'Nigériane': '#228B22',
    'Norvégienne': '#DC143C',
    'Néo-zélandaise': '#4169E1',
    'Omanaise': '#228B22',
    'Ougandaise': '#228B22',
    'Ouzbeke': '#87CEEB',
    'Pakistanaise': '#228B22',
    'Palaosienne': '#87CEEB',
    'Palestinienne': '#228B22',
    'Panaméenne': '#87CEEB',
    'Papouane-néo-guinéenne': '#DC143C',
    'Paraguayenne': '#DC143C',
    'Néerlandaise': '#FF4500',
    'Péruvienne': '#DC143C',
    'Philippine': '#4169E1',
    'Polonaise': '#DC143C',
    'Portugaise': '#228B22',
    'Qatarienne': '#8B0000',
    'Roumaine': '#4169E1',
    'Britannique': '#4169E1',
    'Russe': '#4169E1',
    'Rwandaise': '#87CEEB',
    'Saint-lucienne': '#87CEEB',
    'Saint-marinaise': '#87CEEB',
    'Saint-vincentaise-et-grenadine': '#4169E1',
    'Salomonaise': '#4169E1',
    'Salvadorienne': '#87CEEB',
    'Samoane': '#DC143C',
    'São-toméenne': '#228B22',
    'Sénégalaise': '#228B22',
    'Serbe': '#DC143C',
    'Seychelloise': '#4169E1',
    'Sierra-léonaise': '#228B22',
    'Singapourienne': '#DC143C',
    'Slovaque': '#4169E1',
    'Slovène': '#4169E1',
    'Somalienne': '#87CEEB',
    'Soudanaise': '#228B22',
    'Sud-soudanaise': '#4169E1',
    'Sri-lankaise': '#8B0000',
    'Suédoise': '#4169E1',
    'Suisse': '#DC143C',
    'Surinamaise': '#228B22',
    'Swazie': '#4169E1',
    'Syrienne': '#DC143C',
    'Tadjike': '#228B22',
    'Tanzanienne': '#228B22',
    'Tchadienne': '#4169E1',
    'Tchèque': '#4169E1',
    'Thaïlandaise': '#DC143C',
    'Timoraise': '#DC143C',
    'Togolaise': '#228B22',
    'Tonguienne': '#DC143C',
    'Trinidadienne': '#DC143C',
    'Tunisienne': '#3b82f6',
    'Turkmène': '#228B22',
    'Turque': '#DC143C',
    'Tuvaluane': '#87CEEB',
    'Ukrainienne': '#4169E1',
    'Uruguayenne': '#87CEEB',
    'Vanuatuane': '#DC143C',
    'Vénézuélienne': '#FFD700',
    'Vietnamienne': '#DC143C',
    'Yéménite': '#DC143C',
    'Zambienne': '#228B22',
    'Zimbabwéenne': '#228B22',
    // Formes masculines et alternatives communes
    'France': '#ef4444',
    'Italie': '#10b981',
    'Espagne': '#f59e0b',
    'Allemagne': '#8b5cf6',
    'Royaume-Uni': '#06b6d4',
    'Portugal': '#ec4899',
    'Brésil': '#14b8a6',
    'Mexique': '#84cc16',
    'États-Unis': '#6366f1',
    'Canada': '#f59e0b',
    'Japon': '#ef4444',
    'Chine': '#dc2626',
    'Inde': '#059669',
    'Maroc': '#d97706',
    'Algérie': '#7c3aed',
    'Tunisie': '#3b82f6',
    'Sénégal': '#16a34a',
    'Côte d\'Ivoire': '#ca8a04',
    'Cameroun': '#be185d',
    'Autre': '#6b7280'
  }), []);

  // Données processées avec useMemo pour éviter les recalculs constants
  const data = useMemo((): NationalityData[] => {
    if (!members || members.length === 0) {
      return [];
    }

    const nationalityCount: Record<string, number> = {};
    let totalMembers = 0;

    members.forEach((member: MemberType) => {
      if (member.nationality) {
        // Gérer le cas où nationality est un tableau ou une string
        const nationalities: string[] = Array.isArray(member.nationality)
          ? member.nationality
          : [member.nationality];

        nationalities.forEach((nationality: string) => {
          if (nationality && nationality.trim() !== '') {
            const cleanNationality = nationality.trim();
            nationalityCount[cleanNationality] = (nationalityCount[cleanNationality] || 0) + 1;
            totalMembers++;
          }
        });
      }
    });

    // Convertir en format pour le graphique
    return Object.entries(nationalityCount)
      .map(([country, count], index): NationalityData => ({
        country,
        count,
        percentage: Math.round((count / totalMembers) * 100),
        color: countryColors[country] || `hsl(${(index * 137.5) % 360}, 70%, 50%)`
      }))
      .sort((a, b) => b.count - a.count); // Trier par nombre décroissant
  }, [members, countryColors]);

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

  // Animation du graphique en secteurs
  useEffect(() => {
    if (!isVisible || data.length === 0) return;

    const animateChart = () => {
      // Initialiser avec des valeurs à 0
      const initialData = data.map(item => ({ ...item, percentage: 0 }));
      setAnimatedData(initialData);

      // Animer progressivement vers les vraies valeurs
      const duration = 2000; // 2 secondes
      const steps = 60;
      const stepTime = duration / steps;

      let currentStep = 0;
      const interval = setInterval(() => {
        currentStep++;
        const progress = currentStep / steps;
        const easedProgress = 1 - Math.pow(1 - progress, 3); // Easing cubic

        const newData = data.map(item => ({
          ...item,
          percentage: Math.round(item.percentage * easedProgress)
        }));

        setAnimatedData(newData);

        if (currentStep >= steps) {
          clearInterval(interval);
          setAnimatedData(data); // Assurer les valeurs finales exactes
        }
      }, stepTime);

      return () => clearInterval(interval);
    };

    const timer = setTimeout(animateChart, 500);
    return () => clearTimeout(timer);
  }, [isVisible, data]);

  // Animation des barres de progression
  useEffect(() => {
    if (!isVisible || data.length === 0) return;

    const animateProgressBars = () => {
      // Initialiser toutes les barres à 0
      const initialProgress: Record<string, number> = {};
      data.forEach(item => {
        initialProgress[item.country] = 0;
      });
      setProgressValues(initialProgress);

      // Animer chaque barre avec un délai décalé
      data.forEach((item, index) => {
        const delay = 800 + (index * 200); // Délai croissant pour chaque barre

        setTimeout(() => {
          const duration = 1500;
          const steps = 60;
          const stepTime = duration / steps;
          let currentStep = 0;

          const interval = setInterval(() => {
            currentStep++;
            const progress = currentStep / steps;
            const easedProgress = 1 - Math.pow(1 - progress, 2); // Easing quadratic

            setProgressValues(prev => ({
              ...prev,
              [item.country]: Math.round(item.percentage * easedProgress)
            }));

            if (currentStep >= steps) {
              clearInterval(interval);
              setProgressValues(prev => ({
                ...prev,
                [item.country]: item.percentage
              }));
            }
          }, stepTime);
        }, delay);
      });
    };

    animateProgressBars();
  }, [isVisible, data]);

  const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800">{data.country}</p>
          <p className="text-sm text-gray-600">
            {data.count} membre{data.count > 1 ? 's' : ''} ({data.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend: React.FC<CustomLegendProps> = ({ payload }) => {
    if (!payload) return null;

    return (
      <div className="flex flex-wrap justify-center gap-3 mt-4">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center space-x-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-700">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  // Affichage si pas de données
  if (!members || data.length === 0) {
    return (
      <Card className="shadow-md border-0 card-hover h-full">
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <Globe className="h-5 w-5 text-blue-500" />
            <span>Nationalités familiales</span>
          </CardTitle>
          <CardDescription>
            Répartition des nationalités dans votre famille
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Aucune nationalité renseignée</p>
              <p className="text-sm">Ajoutez des membres avec leurs nationalités pour voir le graphique</p>
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

      <Card className="shadow-md border-0 card-hover h-full">
        <CardHeader>
          <CardTitle className={`text-lg flex items-center space-x-2 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
            <Globe className={`h-5 w-5 text-blue-500 transition-all duration-700 ${isVisible ? 'rotate-0 scale-100' : 'rotate-180 scale-0'}`} />
            <span>Nationalités familiales</span>
          </CardTitle>
          <CardDescription className={`transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            Répartition des nationalités dans votre famille
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Graphique en secteurs */}
            <div className={`h-64 transition-all duration-1000 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={animatedData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="percentage"
                    animationBegin={0}
                    animationDuration={0} // On gère l'animation manuellement
                  >
                    {animatedData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        style={{
                          filter: `brightness(${0.8 + (entry.percentage / 100) * 0.4})`,
                          transition: 'filter 0.3s ease'
                        }}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend content={<CustomLegend />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Statistiques détaillées */}
            <div className={`space-y-3 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <div className="flex items-center justify-between text-sm font-medium text-gray-600 border-b pb-2">
                <span>Total avec nationalité</span>
                <span className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span className={`transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                    {totalMembers} membre{totalMembers > 1 ? 's' : ''}
                  </span>
                </span>
              </div>

              {data.map((item, index) => {
                const currentProgress = progressValues[item.country] || 0;
                return (
                  <div
                    key={item.country}
                    className={`transition-all duration-500 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}
                    style={{ transitionDelay: `${600 + index * 100}ms` }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div
                          className={`w-3 h-3 rounded-full flex-shrink-0 transition-all duration-300`}
                          style={{
                            backgroundColor: item.color,
                            transform: isVisible ? 'scale(1)' : 'scale(0)',
                            transitionDelay: `${800 + index * 100}ms`
                          }}
                        />
                        <span className="font-medium text-gray-800">{item.country}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <span
                          className="font-semibold transition-all duration-300"
                          key={currentProgress} // Force re-render pour l'animation des chiffres
                        >
                          {currentProgress}%
                        </span>
                        <span className="ml-1">({item.count})</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-2 rounded-full transition-all duration-300 ease-out relative"
                        style={{
                          backgroundColor: item.color,
                          width: `${currentProgress}%`,
                          boxShadow: currentProgress > 0 ? `0 0 8px ${item.color}40` : 'none'
                        }}
                      >
                        {/* Effet de brillance animé */}
                        <div
                          className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-transparent via-white to-transparent opacity-20"
                          style={
                            currentProgress > 0 && currentProgress === item.percentage
                              ? {
                                animationName: "shimmer",
                                animationDuration: "2s",
                                animationTimingFunction: "ease-in-out",
                                animationIterationCount: "1",
                                animationDelay: `${1000 + index * 200}ms`,
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

            {/* Informations supplémentaires */}
            <div className={`p-3 bg-blue-50 rounded-lg transition-all duration-1000 delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <div className="flex items-start space-x-2">
                <Globe className={`h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0 transition-all duration-500 delay-1000 ${isVisible ? 'rotate-0' : 'rotate-90'}`} />
                <div className="text-sm">
                  <p className="font-medium text-blue-800 mb-1">
                    Diversité des origines
                  </p>
                  <p className="text-blue-700">
                    Votre arbre présente {data.length} nationalité{data.length > 1 ? 's' : ''} différente{data.length > 1 ? 's' : ''}
                    {data.length > 1 && ', reflétant une riche diversité culturelle familiale.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export { FamilyNationalitiesChart };