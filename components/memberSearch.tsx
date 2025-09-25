import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, User } from 'lucide-react';
import { MemberType } from "@/lib/firebase/models";

interface MemberSearchProps {
    members: MemberType[];
    selectedMembers: string[];
    onSelectionChange: (memberIds: string[]) => void;
    placeholder?: string;
    maxSelections?: number;
    excludeIds?: string[];
    currentUserId?: string;
}

const MemberSearch: React.FC<MemberSearchProps> = ({
    members,
    selectedMembers,
    onSelectionChange,
    placeholder = "Rechercher un membre...",
    maxSelections,
    excludeIds = [],
    currentUserId
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Filtrage optimisé avec useMemo
    const filteredMembers = useMemo(() => {
        if (!searchTerm.trim()) return [];

        const availableMembers = members.filter(m =>
            m.id && !excludeIds.includes(m.id) && !selectedMembers.includes(m.id)
        );

        const searchLower = searchTerm.toLowerCase();
        const filtered = availableMembers.filter(member =>
            (member.firstName?.toLowerCase().includes(searchLower) || false) ||
            (member.lastName?.toLowerCase().includes(searchLower) || false) ||
            `${member.firstName || ''} ${member.lastName || ''}`.toLowerCase().includes(searchLower)
        );

        filtered.sort((a, b) => {
            const aFullName = `${a.firstName || ''} ${a.lastName || ''}`.toLowerCase();
            const bFullName = `${b.firstName || ''} ${b.lastName || ''}`.toLowerCase();

            if (aFullName.startsWith(searchLower) && !bFullName.startsWith(searchLower)) return -1;
            if (!aFullName.startsWith(searchLower) && bFullName.startsWith(searchLower)) return 1;

            return aFullName.localeCompare(bFullName);
        });

        return filtered.slice(0, 10);
    }, [searchTerm, members, excludeIds, selectedMembers]);

    // Fermer la dropdown si on clique ailleurs
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Obtenir les membres sélectionnés avec leurs infos complètes
    const selectedMembersData = useMemo(() =>
        selectedMembers
            .map(id => members.find(m => m.id === id))
            .filter(Boolean) as MemberType[],
        [selectedMembers, members]
    );

    // Fonction pour différencier les homonymes
    const getDistinctiveInfo = (member: MemberType) => {
        const homonymes = members.filter(m =>
            m.id !== member.id &&
            m.firstName === member.firstName &&
            m.lastName === member.lastName
        );

        if (homonymes.length === 0) return '';

        // Différencier par date de naissance si disponible
        if (member.birthDate) {
            const birthYear = new Date(member.birthDate).getFullYear();
            return ` (né(e) en ${birthYear})`;
        }

        // Différencier par lieu de naissance
        if (member.birthPlace) {
            return ` (${member.birthPlace})`;
        }

        return ` (ID: ${member.id?.slice(-4) || ''})`;
    };

    const handleSelectMember = (member: MemberType) => {
        if (maxSelections && selectedMembers.length >= maxSelections) {
            return;
        }

        if (member.id) {
            onSelectionChange([...selectedMembers, member.id]);
        }
        setSearchTerm('');
        setIsOpen(false);
        inputRef.current?.focus();
    };

    const handleRemoveMember = (memberId: string) => {
        onSelectionChange(selectedMembers.filter(id => id !== memberId));
    };

    const MemberAvatar: React.FC<{ member: MemberType; size?: 'sm' | 'md' }> = ({
        member,
        size = 'sm'
    }) => {
        const sizeClasses = size === 'sm' ? 'h-6 w-6' : 'h-8 w-8';

        // Si vous avez un champ avatar dans MemberType, décommentez cette partie
        // if (member.avatar) {
        //   return (
        //     <img 
        //       src={member.avatar} 
        //       alt={`${member.firstName} ${member.lastName}`}
        //       className={`${sizeClasses} rounded-full object-cover`}
        //     />
        //   );
        // }

        return (
            <div className={`${sizeClasses} rounded-full bg-gray-200 flex items-center justify-center`}>
                <User className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
            </div>
        );
    };

    return (
        <div className="space-y-3">
            {/* Membres sélectionnés */}
            {selectedMembersData.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {selectedMembersData.map(member => (
                        <div
                            key={member.id}
                            className="flex items-center space-x-2 bg-blue-50 text-blue-800 px-3 py-1 rounded-full text-sm border"
                        >
                            <MemberAvatar member={member} />
                            <span>
                                {member.firstName} {member.lastName}
                                {member.id === currentUserId && " (Vous)"}
                            </span>
                            {getDistinctiveInfo(member) && (
                                <span className="text-xs text-blue-600">
                                    {getDistinctiveInfo(member)}
                                </span>
                            )}
                            <button
                                onClick={() => handleRemoveMember(member.id!)}
                                className="text-blue-600 hover:text-blue-800 ml-1"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Barre de recherche */}
            {(!maxSelections || selectedMembers.length < maxSelections) && (
                <div ref={searchRef} className="relative">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setIsOpen(true);
                            }}
                            onFocus={() => setIsOpen(true)}
                            placeholder={placeholder}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Liste déroulante des résultats */}
                    {isOpen && searchTerm && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-auto">
                            {filteredMembers.length > 0 ? (
                                filteredMembers.map(member => (
                                    <button
                                        key={member.id}
                                        onClick={() => handleSelectMember(member)}
                                        className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 border-b last:border-b-0"
                                    >
                                        <MemberAvatar member={member} size="md" />
                                        <div className="flex-1">
                                            <div className="font-medium text-gray-900">
                                                {member.firstName} {member.lastName}
                                                {member.id === currentUserId && (
                                                    <span className="text-xs text-gray-500 ml-2">(Vous)</span>
                                                )}
                                                {getDistinctiveInfo(member) && (
                                                    <span className="text-xs text-gray-500 ml-2">
                                                        {getDistinctiveInfo(member)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="px-4 py-3 text-gray-500 text-sm">
                                    Aucun membre trouvé pour "{searchTerm}"
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Message si limite atteinte */}
            {maxSelections && selectedMembers.length >= maxSelections && (
                <p className="text-xs text-gray-500">
                    Limite atteinte ({maxSelections} sélection{maxSelections > 1 ? 's' : ''} maximum)
                </p>
            )}
        </div>
    );
};

export default MemberSearch;