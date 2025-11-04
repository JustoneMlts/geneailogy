"use client"

import React, { useState, useEffect } from 'react';
import { Search, User, MapPin, Users, ArrowLeft } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { UserType } from "@/lib/firebase/models";

// Composant principal
export default function SearchResultsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  
  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [results, setResults] = useState<UserType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'people' | 'trees'>('all');

  // Recherche des utilisateurs dans Firestore
  useEffect(() => {
    const fetchUsers = async () => {
      const queryLower = searchQuery.trim().toLowerCase();
      if (!queryLower) {
        setResults([]);
        return;
      }
      
      setIsLoading(true);
      try {
        const usersRef = collection(db, "Users");
        
        console.log("🔍 Recherche pour:", queryLower);
        
        // Requête prénom
        const qFirstName = query(
          usersRef,
          where("firstNameLower", ">=", queryLower),
          where("firstNameLower", "<=", queryLower + "\uf8ff"),
          orderBy("firstNameLower"),
          limit(50)
        );
        
        // Requête nom
        const qLastName = query(
          usersRef,
          where("lastNameLower", ">=", queryLower),
          where("lastNameLower", "<=", queryLower + "\uf8ff"),
          orderBy("lastNameLower"),
          limit(50)
        );
        
        // Récupération des documents
        const [snapFirst, snapLast] = await Promise.all([
          getDocs(qFirstName).catch(err => {
            console.error("Erreur requête firstName:", err);
            return { docs: [] };
          }), 
          getDocs(qLastName).catch(err => {
            console.error("Erreur requête lastName:", err);
            return { docs: [] };
          })
        ]);
        
        console.log("📄 Résultats firstName:", snapFirst.docs.length);
        console.log("📄 Résultats lastName:", snapLast.docs.length);
        
        // Fusionner et supprimer les doublons
        const userMap = new Map<string, UserType>();
        
        // Ajouter les résultats du prénom
        snapFirst.docs.forEach(doc => {
          const userData = { id: doc.id, ...doc.data() } as UserType;
          userMap.set(doc.id, userData);
        });
        
        // Ajouter les résultats du nom
        snapLast.docs.forEach(doc => {
          if (!userMap.has(doc.id)) {
            const userData = { id: doc.id, ...doc.data() } as UserType;
            userMap.set(doc.id, userData);
          }
        });
        
        // Convertir en tableau
        const combined = Array.from(userMap.values());
        
        console.log("✅ Total résultats:", combined.length);
        
        setResults(combined);
      } catch (err) {
        console.error("❌ Erreur recherche Firestore:", err);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Debounce pour éviter trop de requêtes
    const timeoutId = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    // Mettre à jour l'URL sans recharger la page
    const params = new URLSearchParams(searchParams.toString());
    params.set('q', value);
    router.push(`/search?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Bouton retour */}
            <button 
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">Retour</span>
            </button>

            <div className="w-24"></div>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* En-tête des résultats */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Résultats pour "{searchQuery}"
          </h1>
          <p className="text-gray-600">
            {results.length} {results.length > 1 ? 'résultats trouvés' : 'résultat trouvé'}
          </p>
        </div>

        {/* Liste des résultats */}
        {isLoading ? (
          // Skeleton loading
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg p-6 shadow-sm animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-3">
                    <div className="h-5 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {results.map((user) => (
              <div
                key={user.id}
                className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-all cursor-pointer border border-gray-100 hover:border-blue-200"
                onClick={() => router.push(`/wall/${user.id}`)}
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={`${user.firstName} ${user.lastName}`}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-lg">
                        {getInitials(user.firstName, user.lastName)}
                      </div>
                    )}
                  </div>

                  {/* Informations */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {user.firstName} {user.lastName}
                    </h3>
                    
                    {user.localisation && (
                      <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-2">
                        <MapPin size={14} />
                        <span>{user.localisation}</span>
                      </div>
                    )}

                    {user.familyOrigin && (
                      <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-2">
                        <Users size={14} />
                        <span>Origine: {user.familyOrigin}</span>
                      </div>
                    )}

                    {user.bio && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {user.bio}
                      </p>
                    )}
                  </div>

                  {/* Boutons d'action */}
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/wall/${user.id}`);
                      }}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Voir le profil
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Implémenter la messagerie
                        console.log('Message à:', user.firstName);
                      }}
                      className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                    >
                      Message
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Message si aucun résultat */}
        {!isLoading && results.length === 0 && searchQuery && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucun résultat trouvé
            </h3>
            <p className="text-gray-600">
              Essayez avec d'autres termes de recherche
            </p>
          </div>
        )}
      </main>
    </div>
  );
}