import { MemberType, TreeType, UserType } from "@/lib/firebase/models";
import { selectUser } from "@/lib/redux/slices/currentUserSlice";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { buildDynamicTree, Generation, GenerationSection, GrandparentsSection, getMemberById } from "./tree";
import { getTreeById } from "@/app/controllers/treesController";
import { getUserById } from "@/app/controllers/usersController";
import { getFamilyMembersByIds } from "@/app/controllers/membersController";

export const DynamicFamilyTree = ({
  treeId,
  userId,
  refreshTrigger
}: {
  treeId: string;
  userId?: string;
  refreshTrigger?: number;
}) => {
  const [familyData, setFamilyData] = useState<MemberType[]>([]);
  const currentUser = useSelector(selectUser);
  const [isOwner, setIsOwner] = useState(false);
  const [tree, setTree] = useState<TreeType | null>(null);
  const [treeOwner, setTreeOwner] = useState("");
  const [selectedMember, setSelectedMember] = useState<MemberType>();
  const [centralPersonId, setCentralPersonId] = useState<string>("");
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);
  const [mainUser, setMainUser] = useState<UserType | null>(null);

  useEffect(() => {
    if (userId) {
      getUserById(userId)
        .then(setMainUser)
        .catch((err) => console.error("Erreur récupération user:", err));
    } else {
      setMainUser(currentUser);
    }
  }, [userId, currentUser]);

  // Charger l'arbre avec mise à jour en temps réel
  useEffect(() => {
    if (!treeId) return;

    const loadTreeData = async () => {
      try {
        const treeData = await getTreeById(treeId);
        setTree(treeData);

        // Charger immédiatement les membres si l'arbre a des memberIds
        if (treeData?.memberIds?.length) {
          const membersData = await getFamilyMembersByIds(treeData.memberIds);
          setFamilyData(membersData);
        }
      } catch (err) {
        console.error("Erreur arbre:", err);
      }
    };

    loadTreeData();
  }, [treeId, refreshTrigger]); // refreshTrigger déclenche le rechargement

  // Déterminer le propriétaire
  useEffect(() => {
    if (!tree || !tree.ownerId) return;
    if (mainUser?.id === tree.ownerId) {
      setTreeOwner(`${mainUser.firstName} ${mainUser.lastName}`);
    } else {
      getUserById(tree.ownerId)
        .then(data => setTreeOwner(data ? `${data.firstName} ${data.lastName}` : ""))
        .catch(err => console.error("Erreur propriétaire:", err));
    }
  }, [tree, mainUser]);

  // Savoir si c'est le propriétaire actuel
  useEffect(() => {
    if (tree && mainUser) setIsOwner(mainUser.id === tree.ownerId);
  }, [tree, mainUser]);

  // Définir la personne centrale par défaut (le mainUser)
  useEffect(() => {
    if (familyData.length && mainUser && mainUser.id && !centralPersonId) {
      setCentralPersonId(mainUser.id);
      setNavigationHistory([mainUser.id]);
    }
  }, [familyData, mainUser, centralPersonId]);

  // Reconstruire l'arbre quand la personne centrale change
  useEffect(() => {
    if (!familyData.length || !centralPersonId) return;
    const gens = buildDynamicTree(familyData, centralPersonId, mainUser?.id, isOwner);
    setGenerations(gens);
  }, [familyData, centralPersonId, mainUser, isOwner]);

  // Fonction pour naviguer vers une personne
  const navigateToPerson = (personId: string) => {
    if (personId !== centralPersonId) {
      setCentralPersonId(personId);
      setNavigationHistory(prev => [...prev, personId]);
    }
  };

  // Fonction pour revenir en arrière
  const goBack = () => {
    if (navigationHistory.length > 1) {
      const newHistory = [...navigationHistory];
      newHistory.pop();
      const previousPersonId = newHistory[newHistory.length - 1];
      setCentralPersonId(previousPersonId);
      setNavigationHistory(newHistory);
    }
  };

  // Fonction pour retourner à l'utilisateur principal (mainUser)
  const goToMainUser = () => {
    if (mainUser && mainUser.id && centralPersonId !== mainUser.id) {
      setCentralPersonId(mainUser.id);
      setNavigationHistory([mainUser.id]);
    }
  };

  if (!mainUser || !familyData.length || !generations.length) {
    return <div>Chargement de l'arbre...</div>;
  }

  const centralPerson = getMemberById(familyData, centralPersonId);

  // Séparer les grands-parents paternels et maternels
  const paternalGrandparents = generations.find(gen => gen.type === 'paternal-grandparents')?.members || [];
  const maternalGrandparents = generations.find(gen => gen.type === 'maternal-grandparents')?.members || [];

  // Filtrer les autres générations
  const otherGenerations = generations.filter(gen =>
    gen.type !== 'paternal-grandparents' && gen.type !== 'maternal-grandparents'
  );

  return (
    <div className="space-y-8 px-4">
      {/* Barre de navigation */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex items-center space-x-4">
          <h1 className="text-lg font-bold text-gray-800">
            Arbre centré sur : {centralPerson?.firstName} {centralPerson?.lastName}
          </h1>
          {centralPersonId !== mainUser?.id && (
            <span className="text-sm text-gray-500">
              (Cliquez sur une personne pour recentrer l'arbre)
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {navigationHistory.length > 1 && (
            <button
              onClick={goBack}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            >
              ← Retour
            </button>
          )}

          {centralPersonId !== mainUser?.id && (
            <button
              onClick={goToMainUser}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
            >
              🏠 Mon arbre
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto p-2 scrollbar-custom">

        {/* Section spéciale pour les grands-parents côte à côte */}
        <GrandparentsSection
          paternalGrandparents={paternalGrandparents}
          maternalGrandparents={maternalGrandparents}
          setSelectedMember={setSelectedMember}
          currentUserId={mainUser?.id || ""}
          centralPersonId={centralPersonId}
          onNavigateToPerson={navigateToPerson}
        />

        {/* Autres générations (Parents, Vous et vos frères et sœurs, etc.) */}
        {otherGenerations.map((generation, genIndex) => (
          <GenerationSection
            key={`gen-${genIndex}-${centralPersonId}`}
            title={generation.label}
            members={generation.members}
            setSelectedMember={setSelectedMember}
            currentUserId={mainUser?.id || ""}
            centralPersonId={centralPersonId}
            onNavigateToPerson={navigateToPerson}
            isOwner={isOwner}
            type={generation.type}
            childrenSections={generation.childrenSections}
          />
        ))}
      </div>
    </div>
  );
};