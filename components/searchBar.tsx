import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, X } from 'lucide-react';
import { UserType } from "@/lib/firebase/models";
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase'; // Ajustez le chemin selon votre structure

interface UserSearchBarProps {
  onUserSelect?: (user: UserType) => void;
  onViewAllResults?: (query: string) => void;
  autoFocus?: boolean; // 👈 ajout
}
// Composant SearchBar réutilisable
const UserSearchBar: React.FC<UserSearchBarProps> = ({ onUserSelect, onViewAllResults, autoFocus }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [results, setResults] = useState<UserType[]>([]);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1); // 👈 index survolé
  const searchRef = useRef<HTMLDivElement>(null);

  const handleUserClick = (user: UserType): void => {
    setIsOpen(false);
    setSearchQuery('');
    if (onUserSelect) {
      onUserSelect(user);
    }
  };

  const handleViewAll = (): void => {
    setIsOpen(false);
    if (onViewAllResults) {
      onViewAllResults(searchQuery);
    }
  };

  const handleClear = (): void => {
    setSearchQuery('');
    setResults([]);
    setIsOpen(false);
  };

  // --- Handlers clavier ---
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : 0
        );
        break;

      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : results.length - 1
        );
        break;

      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < results.length) {
          handleUserClick(results[highlightedIndex]);
        } else {
          handleViewAll();
        }
        break;

      case "Escape":
        setIsOpen(false);
        break;
    }
  };

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
           
      const qFirstName = query(
        usersRef,
        where("firstNameLower", ">=", queryLower),
        where("firstNameLower", "<=", queryLower + "\uf8ff"),
        orderBy("firstNameLower"),
        limit(10)
      );
      
      const qLastName = query(
        usersRef,
        where("lastNameLower", ">=", queryLower),
        where("lastNameLower", "<=", queryLower + "\uf8ff"),
        orderBy("lastNameLower"),
        limit(10)
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
      
      const userMap = new Map<string, UserType>();
      
      snapFirst.docs.forEach(doc => {
        const userData = { id: doc.id, ...doc.data() } as UserType;
        userMap.set(doc.id, userData);
      });
      
      snapLast.docs.forEach(doc => {
        if (!userMap.has(doc.id)) {
          const userData = { id: doc.id, ...doc.data() } as UserType;
          userMap.set(doc.id, userData);
        }
      });
      
      const combined = Array.from(userMap.values());
            
      setResults(combined.slice(0, 5));
      setIsOpen(combined.length > 0);
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

// --- Input ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchQuery(e.target.value);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  // --- Rendu ---
  return (
    <div ref={searchRef} className="relative w-full max-w-xl">
      {/* Barre de recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}   // 👈 gestion clavier
          onFocus={() => searchQuery && setIsOpen(true)}
          placeholder="Rechercher des personnes..."
          autoFocus={autoFocus}
          className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border-none rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {searchQuery && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Dropdown des résultats */}
      {isOpen && searchQuery && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-50">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
            </div>
          ) : results.length > 0 ? (
            <>
              {results.map((user: UserType, idx: number) => (
                <div
                  key={user.id}
                  onClick={() => handleUserClick(user)}
                  className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${idx === highlightedIndex
                      ? "bg-blue-50"
                      : "hover:bg-gray-50"
                    }`}
                >
                  <img
                    src={
                      user.avatarUrl ||
                      `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=random`
                    }
                    alt={`${user.firstName} ${user.lastName}`}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-gray-900 truncate">
                      {user.firstName} {user.lastName}
                    </div>
                    {user.localisation && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 truncate">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span>{user.localisation}</span>
                      </div>
                    )}
                    {user.familyOrigin && !user.localisation && (
                      <div className="text-xs text-gray-500 truncate">
                        Origine: {user.familyOrigin}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Bouton "Voir tous les résultats" */}
              <div
                onClick={handleViewAll}
                className={`p-3 text-center font-semibold text-sm cursor-pointer border-t border-gray-100 ${highlightedIndex === results.length
                    ? "bg-blue-50 text-blue-600"
                    : "text-blue-600 hover:bg-gray-50"
                  }`}
              >
                Voir tous les résultats pour "{searchQuery}"
              </div>
            </>
          ) : (
            <div className="p-4 text-center text-gray-500 text-sm">
              Aucun utilisateur trouvé
            </div>
          )}
        </div>
      )}
    </div>
  );
};


export default UserSearchBar;