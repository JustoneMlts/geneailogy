import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Globe, ChevronDown, X } from 'lucide-react';

// Types et interfaces
type Nationality = string;

interface NationalitySelectorProps {
  value: string;
  onChange: (nationality: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
}

interface ExampleUsageProps {}

const NationalitySelector: React.FC<NationalitySelectorProps> = ({ 
  value, 
  onChange, 
  placeholder = "Sélectionnez une nationalité",
  disabled = false,
  error,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Liste complète des nationalités avec typage strict
  const nationalities: readonly Nationality[] = [
    'Afghane', 'Sud-africaine', 'Albanaise', 'Algérienne', 'Allemande', 'Andorrane',
    'Angolaise', 'Antiguaise-et-barbudienne', 'Saoudienne', 'Argentine', 'Arménienne',
    'Australienne', 'Autrichienne', 'Azerbaïdjanaise', 'Bahamienne', 'Bahreïnienne',
    'Bangladaise', 'Barbadienne', 'Belge', 'Bélizienne', 'Béninoise', 'Bhoutanaise',
    'Biélorusse', 'Birmane', 'Bolivienne', 'Bosnienne', 'Botswanaise', 'Brésilienne',
    'Brunéienne', 'Bulgare', 'Burkinabée', 'Burundaise', 'Cambodgienne', 'Camerounaise',
    'Canadienne', 'Cap-verdienne', 'Centrafricaine', 'Chilienne', 'Chinoise', 'Chypriote',
    'Colombienne', 'Comorienne', 'Congolaise', 'Congolaise (RDC)', 'Nord-coréenne',
    'Sud-coréenne', 'Costaricienne', 'Ivoirienne', 'Croate', 'Cubaine', 'Danoise',
    'Djiboutienne', 'Dominicaine', 'Dominiquaise', 'Égyptienne', 'Émirienne',
    'Équatorienne', 'Érythréenne', 'Espagnole', 'Estonienne', 'Américaine', 'Éthiopienne',
    'Fidjienne', 'Finlandaise', 'Française', 'Gabonaise', 'Gambienne', 'Géorgienne',
    'Ghanéenne', 'Grecque', 'Grenadienne', 'Guatémaltèque', 'Guinéenne', 'Équato-guinéenne',
    'Bissau-guinéenne', 'Guyanienne', 'Haïtienne', 'Hondurienne', 'Hongroise', 'Indienne',
    'Indonésienne', 'Irakienne', 'Iranienne', 'Irlandaise', 'Islandaise', 'Israélienne',
    'Italienne', 'Jamaïcaine', 'Japonaise', 'Jordanienne', 'Kazakhe', 'Kényane',
    'Kirghize', 'Kiribatienne', 'Koweïtienne', 'Laotienne', 'Lesothane', 'Lettonne',
    'Libanaise', 'Libérienne', 'Libyenne', 'Liechtensteinoise', 'Lituanienne',
    'Luxembourgeoise', 'Macédonienne du Nord', 'Malgache', 'Malaisienne', 'Malawienne',
    'Maldivienne', 'Malienne', 'Maltaise', 'Marocaine', 'Marshallaise', 'Mauricienne',
    'Mauritanienne', 'Mexicaine', 'Micronésienne', 'Moldave', 'Monégasque', 'Mongole',
    'Monténégrine', 'Mozambicaine', 'Namibienne', 'Nauruane', 'Népalaise', 'Nicaraguayenne',
    'Nigérienne', 'Nigériane', 'Norvégienne', 'Néo-zélandaise', 'Omanaise', 'Ougandaise',
    'Ouzbeke', 'Pakistanaise', 'Palaosienne', 'Palestinienne', 'Panaméenne',
    'Papouane-néo-guinéenne', 'Paraguayenne', 'Néerlandaise', 'Péruvienne', 'Philippine',
    'Polonaise', 'Portugaise', 'Qatarienne', 'Roumaine', 'Britannique', 'Russe',
    'Rwandaise', 'Saint-lucienne', 'Saint-marinaise', 'Saint-vincentaise-et-grenadine',
    'Salomonaise', 'Salvadorienne', 'Samoane', 'São-toméenne', 'Sénégalaise', 'Serbe',
    'Seychelloise', 'Sierra-léonaise', 'Singapourienne', 'Slovaque', 'Slovène',
    'Somalienne', 'Soudanaise', 'Sud-soudanaise', 'Sri-lankaise', 'Suédoise', 'Suisse',
    'Surinamaise', 'Swazie', 'Syrienne', 'Tadjike', 'Tanzanienne', 'Tchadienne',
    'Tchèque', 'Thaïlandaise', 'Timoraise', 'Togolaise', 'Tonguienne', 'Trinidadienne',
    'Tunisienne', 'Turkmène', 'Turque', 'Tuvaluane', 'Ukrainienne', 'Uruguayenne',
    'Vanuatuane', 'Vénézuélienne', 'Vietnamienne', 'Yéménite', 'Zambienne', 'Zimbabwéenne'
  ] as const;

  // Filtrer les nationalités selon le terme de recherche
  const filteredNationalities: Nationality[] = nationalities.filter((nationality: Nationality) =>
    nationality.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const handleSelect = useCallback((nationality: string): void => {
    onChange(nationality);
    setIsOpen(false);
    setSearchTerm('');
  }, [onChange]);

  const handleClear = useCallback((): void => {
    onChange('');
    setSearchTerm('');
    setIsOpen(false);
  }, [onChange]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    if (!isOpen) setIsOpen(true);
  }, [isOpen]);

  const handleInputFocus = useCallback((): void => {
    if (!disabled) {
      setIsOpen(true);
    }
  }, [disabled]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    } else if (e.key === 'Enter' && filteredNationalities.length > 0) {
      handleSelect(filteredNationalities[0]);
    }
  }, [filteredNationalities, handleSelect]);

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
        <Globe className="h-4 w-4" />
        <span>Nationalité</span>
      </label>
      
      <div className="relative" ref={dropdownRef}>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={isOpen ? searchTerm : value}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className={`
              w-full px-3 py-2 pr-10 border rounded-md transition-colors
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
            {value && !disabled && (
              <button
                onClick={handleClear}
                className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Effacer la sélection"
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() => !disabled && setIsOpen(!isOpen)}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors disabled:cursor-not-allowed"
              disabled={disabled}
              aria-label={isOpen ? "Fermer la liste" : "Ouvrir la liste"}
              type="button"
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {isOpen && !disabled && (
          <div 
            className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
            role="listbox"
          >
            {filteredNationalities.length > 0 ? (
              filteredNationalities.map((nationality: Nationality, index: number) => (
                <button
                  key={`${nationality}-${index}`}
                  onClick={() => handleSelect(nationality)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none transition-colors"
                  role="option"
                  aria-selected={nationality === value}
                  type="button"
                >
                  {nationality}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-gray-500 text-sm">
                Aucune nationalité trouvée
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
    </div>
  );
};

// Exemple d'utilisation avec typage
const ExampleUsage: React.FC<ExampleUsageProps> = () => {
  const [nationality, setNationality] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleNationalityChange = useCallback((newNationality: string): void => {
    setNationality(newNationality);
    if (error) setError(''); // Effacer l'erreur lors du changement
  }, [error]);

  const handleValidation = (): void => {
    if (!nationality.trim()) {
      setError('Veuillez sélectionner une nationalité');
    } else {
      setError('');
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-sm border">
      <h2 className="text-lg font-semibold mb-4">Exemple d'utilisation</h2>
      
      <NationalitySelector
        value={nationality}
        onChange={handleNationalityChange}
        placeholder="Sélectionnez une nationalité"
        error={error}
      />
      
      <button
        onClick={handleValidation}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        type="button"
      >
        Valider
      </button>
      
      {nationality && !error && (
        <div className="mt-4 p-3 bg-blue-50 rounded-md">
          <p className="text-sm text-blue-800">
            Nationalité sélectionnée: <strong>{nationality}</strong>
          </p>
        </div>
      )}
    </div>
  );
};

export default ExampleUsage;
export { NationalitySelector };
export type { NationalitySelectorProps, Nationality };