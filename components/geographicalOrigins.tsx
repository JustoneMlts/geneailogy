import React, { useEffect, useRef, useState } from "react";
import { Globe } from "lucide-react";
import { getMembersBirthPlaces } from "@/app/controllers/membersController";

// Typage pour les points de naissance
interface BirthPlacePoint {
  id: string;
  firstName: string;
  lastName: string;
  birthPlace: {
    lat: number;
    lng: number;
    city?: string;
    country?: string;
  };
}

// Interface pour les statistiques
interface LocationStats {
  country: string;
  count: number;
  percentage: number;
  color: string;
}

// Extension de Window pour Leaflet
declare global {
  interface Window {
    L: any;
  }
}

// Composant pour une jauge animée
const AnimatedGauge: React.FC<{
  country: string;
  percentage: number;
  count: number;
  color: string;
  delay?: number;
}> = ({ country, percentage, count, color, delay = 0 }) => {
  const [animatedPercentage, setAnimatedPercentage] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedPercentage(percentage);
    }, delay);

    return () => clearTimeout(timer);
  }, [percentage, delay]);

  return (
    <div className="p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center space-x-1.5">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="font-medium text-gray-900 text-xs">{country}</span>
        </div>
        <div className="flex items-center space-x-1.5 text-xs">
          <span className="font-semibold text-gray-900">{percentage}%</span>
          <span className="text-gray-500">({count})</span>
        </div>
      </div>

      {/* Barre de progression */}
      <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
        <div
          className="h-1.5 rounded-full transition-all duration-1000 ease-out"
          style={{
            backgroundColor: color,
            width: `${animatedPercentage}%`,
            transitionDelay: `${delay}ms`
          }}
        />
      </div>
    </div>
  );
};

// Palette de couleurs pour les pays
const colorPalette = [
  "#3B82F6", // blue-500
  "#EF4444", // red-500
  "#10B981", // emerald-500
  "#F59E0B", // amber-500
  "#8B5CF6", // violet-500
  "#06B6D4", // cyan-500
  "#F97316", // orange-500
  "#84CC16", // lime-500
  "#EC4899", // pink-500
  "#6366F1", // indigo-500
];

const GeographicalOrigins: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [birthPlaces, setBirthPlaces] = useState<BirthPlacePoint[]>([]);

  // Calculer les statistiques par pays
  const locationStats: LocationStats[] = React.useMemo(() => {
    if (birthPlaces.length === 0) return [];

    const countryCount: { [key: string]: number } = {};

    birthPlaces.forEach(bp => {
      const country = bp.birthPlace.country || "Inconnu";
      countryCount[country] = (countryCount[country] || 0) + 1;
    });

    const total = birthPlaces.length;

    return Object.entries(countryCount)
      .map(([country, count], index) => ({
        country,
        count,
        percentage: Math.round((count / total) * 100),
        color: colorPalette[index % colorPalette.length]
      }))
      .sort((a, b) => b.count - a.count);
  }, [birthPlaces]);

  // Récupérer les birthPlaces depuis Firestore
  useEffect(() => {
    const fetchBirthPlaces = async () => {
      try {
        setIsLoading(true);
        const data = await getMembersBirthPlaces();
        setBirthPlaces(data);
      } catch (error) {
        console.error("Erreur lors de la récupération des birthPlaces :", error);
        setBirthPlaces([]); // Fallback sur un tableau vide en cas d'erreur
      } finally {
        setIsLoading(false);
      }
    };
    fetchBirthPlaces();
  }, []);

  // Initialisation de la carte Leaflet
  const initMap = () => {
    if (!mapRef.current || map || !window.L || birthPlaces.length === 0) return;

    try {

    const container = mapRef.current as any;
    if (container._leaflet_id) {
      container._leaflet_id = null;
    }
      
      const newMap = window.L.map(mapRef.current);

      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(newMap);

      // Calculer le centre moyen
      const avgLat = birthPlaces.reduce((sum, bp) => sum + bp.birthPlace.lat, 0) / birthPlaces.length;
      const avgLng = birthPlaces.reduce((sum, bp) => sum + bp.birthPlace.lng, 0) / birthPlaces.length;

      // Placer la vue sur le centre moyen avec un zoom modéré
      newMap.setView([avgLat, avgLng], 4);

      // Ajouter les marqueurs avec des couleurs correspondant aux pays
      birthPlaces.forEach((bp) => {
        const country = bp.birthPlace.country || "Inconnu";
        const countryStats = locationStats.find(stat => stat.country === country);
        const markerColor = countryStats?.color || "#6B7280";

        const marker = window.L.circleMarker([bp.birthPlace.lat, bp.birthPlace.lng], {
          color: markerColor,
          fillColor: markerColor,
          fillOpacity: 0.7,
          radius: 8,
          weight: 2,
        }).addTo(newMap);

        marker.bindPopup(`
          <strong>${bp.firstName} ${bp.lastName}</strong><br/>
          ${bp.birthPlace.city ?? ""}, ${bp.birthPlace.country ?? ""}
        `);
      });

      setMap(newMap);
    } catch (error) {
      console.error("Erreur lors de l'initialisation de la carte:", error);
    }
  };

  // Chargement de Leaflet via CDN
  useEffect(() => {
    if (typeof window === "undefined" || isLoading) return;

    if (!window.L) {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
      script.onload = initMap;
      document.head.appendChild(script);

      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
      document.head.appendChild(link);
    } else if (mapRef.current && !map && birthPlaces.length > 0) {
      initMap();
    }

    // Cleanup
    return () => {
      if (map) map.remove();
    };
  }, [birthPlaces, isLoading, locationStats]);

  return (
    <div className="h-full bg-white rounded-lg p-6 shadow-sm border-0 flex flex-col overflow-hidden">
      <div className="flex items-center space-x-2 mb-4">
        <Globe className="h-5 w-5 text-gray-600" />
        <h2 className="text-lg font-semibold text-gray-900">Origines géographiques</h2>
      </div>

      <p className="text-sm text-gray-600 mb-6">Répartition des lieux de naissance de votre famille</p>

      {/* Carte */}
      <div className="mb-8 z-10">
        <div
          ref={mapRef}
          className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center"
          style={{ minHeight: "256px" }}
        >
          {isLoading && (
            <div className="text-center text-gray-500">
              <Globe className="h-12 w-12 mx-auto mb-2 opacity-50 animate-pulse" />
              <p>Chargement de la carte...</p>
            </div>
          )}
          {!isLoading && birthPlaces.length === 0 && (
            <div className="text-center text-gray-500">
              <Globe className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Aucune donnée de localisation disponible</p>
            </div>
          )}
        </div>
      </div>

      {/* Graphiques et statistiques */}
      {!isLoading && locationStats.length > 0 && (
        <div className="border-t pt-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Répartition par pays</h3>

          {/* Statistiques de synthèse */}
          <div className="mb-3 px-3 py-2 bg-blue-50 rounded text-xs">
            <div className="flex items-center justify-between">
              <span className="text-blue-800">Total localisé</span>
              <span className="font-bold text-blue-900">
                {locationStats.reduce((sum, stat) => sum + stat.count, 0)} membres
              </span>
            </div>
          </div>

          {/* Jauges par pays */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {locationStats.map((stat, index) => (
              <AnimatedGauge
                key={stat.country}
                country={stat.country}
                percentage={stat.percentage}
                count={stat.count}
                color={stat.color}
                delay={index * 200}
              />
            ))}
          </div>
        </div>
      )}

      {/* Message si aucune donnée après chargement */}
      {!isLoading && locationStats.length === 0 && birthPlaces.length === 0 && (
        <div className="border-t pt-4">
          <div className="text-center text-gray-500 py-4">
            <p className="text-sm">Aucune donnée géographique disponible pour le moment.</p>
            <p className="text-xs mt-1">Ajoutez des lieux de naissance à vos membres de famille.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeographicalOrigins;
export type { BirthPlacePoint };