import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MapPin, Search, X, Loader2 } from 'lucide-react';
import { LocationData } from '@/lib/firebase/models';

interface LocationSelectorProps {
    value: LocationData | null;
    onChange: (location: LocationData | null) => void;
    placeholder?: string;
    disabled?: boolean;
    error?: string;
    className?: string;
    label?: string;
}

interface NominatimResult {
    place_id: number;
    display_name: string;
    lat: string;
    lon: string;
    address: {
        city?: string;
        town?: string;
        village?: string;
        municipality?: string;
        country: string;
        country_code: string;
        state?: string;
        region?: string;
        postcode?: string;
    };
    type: string;
    class: string;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
    value,
    onChange,
    placeholder = "Rechercher un lieu...",
    disabled = false,
    error,
    className = "",
    label = "Lieu de naissance"
}) => {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [suggestions, setSuggestions] = useState<LocationData[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const searchTimeout = useRef<NodeJS.Timeout>(setTimeout(() => { }, 0));
    // Nettoyer le timeout au démontage
    useEffect(() => {
        return () => {
            if (searchTimeout.current) {
                clearTimeout(searchTimeout.current);
            }
        };
    }, []);

    // Fonction pour normaliser les données de Nominatim
    const normalizeNominatimResult = (result: NominatimResult): LocationData => {
        const address = result.address;

        // Déterminer la ville en priorité
        const city = address.city || address.town || address.village || address.municipality || '';

        return {
            city,
            country: address.country,
            latitude: parseFloat(result.lat),
            longitude: parseFloat(result.lon),
            displayName: result.display_name,
            countryCode: address.country_code?.toUpperCase(),
            region: address.state || address.region,
            postcode: address.postcode
        };
    };

    // Fonction pour rechercher via Nominatim (OpenStreetMap)
    const searchLocations = useCallback(async (query: string): Promise<LocationData[]> => {
        if (!query.trim() || query.length < 2) return [];

        try {
            setIsLoading(true);

            // Utiliser Nominatim de OpenStreetMap (gratuit, pas de clé API nécessaire)
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?` +
                `q=${encodeURIComponent(query)}&` +
                `format=json&` +
                `addressdetails=1&` +
                `limit=8&` +
                `accept-language=fr`
            );

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            const results: NominatimResult[] = await response.json();

            // Filtrer et normaliser les résultats
            const locations = results
                .filter(result =>
                    result.address.country &&
                    (result.address.city || result.address.town || result.address.village || result.address.municipality)
                )
                .map(normalizeNominatimResult)
                .slice(0, 6); // Limiter à 6 résultats

            return locations;
        } catch (error) {
            console.error('Erreur lors de la recherche de lieux:', error);
            return [];
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Debouncer la recherche
    const debouncedSearch = useCallback((query: string) => {
        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }

        searchTimeout.current = setTimeout(async () => {
            const results = await searchLocations(query);
            setSuggestions(results);
        }, 300);
    }, [searchLocations]);

    const handleClickOutside = useCallback((event: MouseEvent): void => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
            setIsOpen(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen, handleClickOutside]);

    const handleSelect = useCallback((location: LocationData): void => {
        onChange(location);
        setIsOpen(false);
        setSearchTerm('');
        setSuggestions([]);
    }, [onChange]);

    const handleClear = useCallback((): void => {
        onChange(null);
        setSearchTerm('');
        setSuggestions([]);
        setIsOpen(false);
    }, [onChange]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
        const newValue = e.target.value;
        setSearchTerm(newValue);

        if (!isOpen) setIsOpen(true);

        if (newValue.trim().length >= 2) {
            debouncedSearch(newValue);
        } else {
            setSuggestions([]);
        }
    }, [isOpen, debouncedSearch]);

    const handleInputFocus = useCallback((): void => {
        if (!disabled) {
            setIsOpen(true);
            if (searchTerm.length >= 2) {
                debouncedSearch(searchTerm);
            }
        }
    }, [disabled, searchTerm, debouncedSearch]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>): void => {
        if (e.key === 'Escape') {
            setIsOpen(false);
            inputRef.current?.blur();
        } else if (e.key === 'Enter' && suggestions.length > 0) {
            e.preventDefault();
            handleSelect(suggestions[0]);
        }
    }, [suggestions, handleSelect]);

    // Affichage de la valeur sélectionnée
    const displayValue = isOpen ? searchTerm : (value ? `${value.city}, ${value.country}` : '');

    return (
        <div className={`space-y-2 ${className}`}>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                <MapPin className="h-4 w-4" />
                <span>{label}</span>
            </label>

            <div className="relative" ref={dropdownRef}>
                <div className="relative">
                    <input
                        ref={inputRef}
                        type="text"
                        value={displayValue}
                        onChange={handleInputChange}
                        onFocus={handleInputFocus}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        disabled={disabled}
                        className={`
              w-full px-3 py-2 pr-20 border rounded-md transition-colors
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
              ${error
                                ? 'border-red-300 focus:ring-red-500'
                                : 'border-gray-300'
                            }
            `}
                        aria-expanded={isOpen}
                        aria-haspopup="listbox"
                        role="combobox"
                    />

                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 space-x-1">
                        {isLoading && (
                            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                        )}
                        {value && !disabled && !isLoading && (
                            <button
                                onClick={handleClear}
                                className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-colors"
                                aria-label="Effacer la sélection"
                                type="button"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                        <Search className="h-4 w-4 text-gray-400" />
                    </div>
                </div>

                {isOpen && !disabled && (
                    <div
                        className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
                        role="listbox"
                    >
                        {isLoading ? (
                            <div className="px-3 py-2 text-gray-500 text-sm flex items-center space-x-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Recherche en cours...</span>
                            </div>
                        ) : suggestions.length > 0 ? (
                            suggestions.map((location: LocationData, index: number) => (
                                <button
                                    key={`${location.latitude}-${location.longitude}-${index}`}
                                    onClick={() => handleSelect(location)}
                                    className="w-full px-3 py-3 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none transition-colors border-b border-gray-100 last:border-b-0"
                                    role="option"
                                    aria-selected={false}
                                    type="button"
                                >
                                    <div className="flex items-start space-x-2">
                                        <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-gray-900 truncate">
                                                {location.city}, {location.country}
                                            </div>
                                            {location.region && (
                                                <div className="text-sm text-gray-500 truncate">
                                                    {location.region}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))
                        ) : searchTerm.length >= 2 ? (
                            <div className="px-3 py-2 text-gray-500 text-sm">
                                Aucun lieu trouvé
                            </div>
                        ) : (
                            <div className="px-3 py-2 text-gray-500 text-sm">
                                Tapez au moins 2 caractères pour rechercher
                            </div>
                        )}
                    </div>
                )}
            </div>

            {error && (
                <p className="text-sm text-red-600" role="alert">
                    {error}
                </p>
            )}

            {value && (
                <div className="text-xs text-gray-500">
                    📍 Lat: {value.latitude.toFixed(4)}, Lng: {value.longitude.toFixed(4)}
                </div>
            )}
        </div>
    );
};

// Exemple d'utilisation
const ExampleUsage: React.FC = () => {
    const [birthPlace, setBirthPlace] = useState<LocationData | null>(null);
    const [error, setError] = useState<string>('');

    const handleLocationChange = useCallback((location: LocationData | null): void => {
        setBirthPlace(location);
        if (error) setError('');
    }, [error]);

    const handleValidation = (): void => {
        if (!birthPlace) {
            setError('Veuillez sélectionner un lieu de naissance');
        } else {
            setError('');
        }
    };

    return (
        <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-sm border">
            <h2 className="text-lg font-semibold mb-4">Sélecteur de Lieu</h2>

            <LocationSelector
                value={birthPlace}
                onChange={handleLocationChange}
                placeholder="Rechercher votre lieu de naissance..."
                error={error}
                label="Lieu de naissance"
            />

            <button
                onClick={handleValidation}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                type="button"
            >
                Valider
            </button>

            {birthPlace && !error && (
                <div className="mt-4 p-3 bg-green-50 rounded-md">
                    <p className="text-sm text-green-800">
                        <strong>Lieu sélectionné:</strong><br />
                        📍 {birthPlace.city}, {birthPlace.country}<br />
                        🗺️ {birthPlace.latitude}, {birthPlace.longitude}
                    </p>
                </div>
            )}
        </div>
    );
};

export default ExampleUsage;
export { LocationSelector };
export type { LocationData, LocationSelectorProps };