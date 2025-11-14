import React, { useEffect, useState } from 'react';
import { X, Calendar, MapPin, Users, Heart, Share2, Link, MessageCircle, Globe } from 'lucide-react';
import { MemberType } from '@/lib/firebase/models';
import { nationalityToEmoji } from '@/app/helpers/memberHelper';
import { getMemberById } from '@/app/controllers/membersController';

interface MemberProfileModalProps {
  memberId: string;
  isOpen: boolean;
  onClose: () => void;
  showShareMenu: boolean;
  setShowShareMenu: React.Dispatch<React.SetStateAction<boolean>>
}

export const MemberProfileModal = ({ memberId, isOpen, onClose, showShareMenu, setShowShareMenu }: MemberProfileModalProps) => {
  const [member, setMember] = useState<MemberType | null>()

  useEffect(() => {
    const fetchMember = async () => {
      try {
        if (memberId) {
          const data = await getMemberById(memberId)
          setMember(data)
        }
      } catch {
        console.error("Une erreur est survenue ")
      }
    }

    fetchMember()
  }, [memberId])

  if (!isOpen || !member) return null;

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return null;
    return new Date(timestamp).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getAge = () => {
    if (!member.birthDate) return null;
    const birthYear = new Date(member.birthDate).getFullYear();
    const currentYear = new Date().getFullYear();
    const deathYear = member.deathDate ? new Date(member.deathDate).getFullYear() : currentYear;
    return deathYear - birthYear;
  };

  const handleShare = (type: 'link' | 'dm' | 'wall') => {
    switch (type) {
      case 'link':
        navigator.clipboard.writeText(`${window.location.origin}/member/${member.id}`);
        // Toast notification ici
        break;
      case 'dm':
        // Logique pour envoyer en DM
        break;
      case 'wall':
        // Logique pour partager sur le mur
        break;
    }
    setShowShareMenu(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
      <div className={`bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative ${
        member.gender === "male" ? "border-4 border-blue-200" : "border-4 border-pink-200"
      }`}>
        {/* Header avec photo et boutons */}
        <div className={`${
          member.gender === "male" ? "bg-gradient-to-br from-blue-50 to-blue-100" : "bg-gradient-to-br from-pink-50 to-pink-100"
        } p-6 relative`}>
          {/* Bouton fermer */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>

          {/* Photo et nom principal */}
          <div className="flex flex-col items-center">
            <div className="relative w-32 h-32 mb-4">
              <div className={`w-full h-full rounded-full overflow-hidden border-4 ${
                member.gender === "male" ? "border-blue-300" : "border-pink-300"
              }`}>
                {member.avatar ? (
                  <img 
                    src={member.avatar} 
                    alt={`${member.firstName} ${member.lastName}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center text-2xl font-bold ${
                    member.gender === "male" ? "bg-blue-200 text-blue-800" : "bg-pink-200 text-pink-800"
                  }`}>
                    {member.firstName[0]}{member.lastName[0]}
                  </div>
                )}
              </div>

              {/* Drapeaux de nationalité */}
              {member.nationality && (
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                  {Array.isArray(member.nationality) ? (
                    member.nationality.slice(0, 3).map((nat, idx) => (
                      <div
                        key={idx}
                        className="w-8 h-8 bg-white rounded-full flex items-center justify-center border-2 border-gray-200 shadow-sm"
                        title={nat}
                      >
                        <span className="text-sm">{nationalityToEmoji(nat)}</span>
                      </div>
                    ))
                  ) : (
                    <div
                      className="w-8 h-8 bg-white rounded-full flex items-center justify-center border-2 border-gray-200 shadow-sm"
                      title={member.nationality}
                    >
                      <span className="text-sm">{nationalityToEmoji(member.nationality)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <h1 className="text-2xl font-bold text-gray-800 text-center mb-2">
              {member.firstName} {member.lastName}
            </h1>

            {(member.birthDate || member.deathDate) && (
              <div className="flex items-center space-x-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>
                  {formatDate(member.birthDate)}
                  {member.deathDate && ` - ${formatDate(member.deathDate)}`}
                  {getAge() && ` (${getAge()} ans${member.deathDate ? ' au décès' : ''})`}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Contenu principal */}
        <div className="p-6 space-y-6">
          {/* Informations personnelles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {member.birthPlace && (
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-800">Lieu de naissance</p>
                  <p className="text-gray-600">{member.birthPlace.city}</p>
                </div>
              </div>
            )}

            {member.deathPlace && (
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-800">Lieu de décès</p>
                  <p className="text-gray-600">{member.deathPlace}</p>
                </div>
              </div>
            )}

            {member.gender && (
              <div className="flex items-start space-x-3">
                <Users className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-800">Genre</p>
                  <p className="text-gray-600 capitalize">
                    {member.gender === 'male' ? 'Masculin' : member.gender === 'female' ? 'Féminin' : 'Autre'}
                  </p>
                </div>
              </div>
            )}

            {member.isMarried && (
              <div className="flex items-start space-x-3">
                <Heart className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-800">Statut matrimonial</p>
                  <p className="text-gray-600">Marié(e)</p>
                </div>
              </div>
            )}
          </div>

          {/* Nationalités détaillées */}
          {member.nationality && Array.isArray(member.nationality) && member.nationality.length > 1 && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Nationalités</h3>
              <div className="flex flex-wrap gap-2">
                {member.nationality.map((nat, idx) => (
                  <div
                    key={idx}
                    className="flex items-center space-x-2 bg-gray-100 rounded-full px-3 py-1"
                  >
                    <span>{nationalityToEmoji(nat)}</span>
                    <span className="text-sm text-gray-700">{nat}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Biographie */}
          {member.bio && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Biographie</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{member.bio}</p>
              </div>
            </div>
          )}

          {/* Informations familiales */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-800 mb-3">Liens familiaux</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {member.parentsIds?.length && member.parentsIds?.length > 0 && (
                <div>
                  <span className="font-medium text-gray-600">Parents : </span>
                  <span className="text-gray-800">{member.parentsIds.length} parent(s)</span>
                </div>
              )}
              {member.childrenIds?.length && member.childrenIds?.length > 0 && (
                <div>
                  <span className="font-medium text-gray-600">Enfants : </span>
                  <span className="text-gray-800">{member.childrenIds.length} enfant(s)</span>
                </div>
              )}
              {member.brothersIds?.length && member.brothersIds?.length > 0 && (
                <div>
                  <span className="font-medium text-gray-600">Frères/Sœurs : </span>
                  <span className="text-gray-800">{member.brothersIds.length}</span>
                </div>
              )}
              {member.isMarried && (
                <div>
                  <span className="font-medium text-gray-600">Conjoint : </span>
                  <span className="text-gray-800">Marié(e)</span>
                </div>
              )}
            </div>
          </div>

          {/* Bouton partager */}
          <div className="relative">
            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              className={`w-full rounded-lg p-4 flex items-center justify-center hover:bg-white hover:bg-opacity-20 transition-colors ${
                member.gender === "male" ? "bg-blue-200" : "bg-pink-200"
              }`}
            >
              <div className='flex justify-between items-center w-full'>
                <span className='text-lg'> Partager la fiche membre </span>
                <Share2 className="w-5 h-5 text-gray-700" />
              </div>
            </button>

            {/* Menu de partage */}
            {showShareMenu && (
              <div className="absolute top-10 right-0 bg-white rounded-lg shadow-lg border p-2 min-w-48 z-10">
                <button
                  onClick={() => handleShare('link')}
                  className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-gray-100 rounded text-left"
                >
                  <Link className="w-4 h-4" />
                  <span className="text-sm">Copier le lien</span>
                </button>
                <button
                  onClick={() => handleShare('dm')}
                  className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-gray-100 rounded text-left"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-sm">Envoyer en DM</span>
                </button>
                <button
                  onClick={() => handleShare('wall')}
                  className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-gray-100 rounded text-left"
                >
                  <Globe className="w-4 h-4" />
                  <span className="text-sm">Partager sur mon mur</span>
                </button>
              </div>
            )}
          </div>

          {/* Dates de création/modification */}
          {(member.createdDate || member.updatedDate) && (
            <div className="border-t pt-4 text-xs text-gray-500">
              {member.createdDate && (
                <p>Créé le {formatDate(member.createdDate)}</p>
              )}
              {member.updatedDate && member.updatedDate !== member.createdDate && (
                <p>Modifié le {formatDate(member.updatedDate)}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Overlay pour fermer le modal */}
      <div 
        className="fixed inset-0 -z-10" 
        onClick={onClose}
      />
    </div>
  );
};