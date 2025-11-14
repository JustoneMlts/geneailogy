import { MemberType, TreeType, UserType } from "@/lib/firebase/models";
import { selectUser } from "@/lib/redux/slices/currentUserSlice";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { buildDynamicTree, Generation, GenerationSection, GrandparentsSection, getMemberById, getMembersByIds } from "./tree";
import { getTreeById } from "@/app/controllers/treesController";
import { getUserById } from "@/app/controllers/usersController";
import { getFamilyMembersByIds, getParentsByMemberId } from "@/app/controllers/membersController";
import { collection, documentId, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { COLLECTIONS } from "@/lib/firebase/collections";

export const DynamicFamilyTree = ({
  tree,
  userId,
  refreshTrigger,
  onEdit,
  onDelete,
  onDetail,
}: {
  tree: TreeType;
  userId?: string;
  refreshTrigger?: number;
  onEdit: (memberId: string) => void;
  onDelete: (memberId: string) => void;
  onDetail: (memberId: string) => void;
}) => {
  const [familyData, setFamilyData] = useState<MemberType[]>([]);
  const currentUser = useSelector(selectUser);
  const [isOwner, setIsOwner] = useState(false);
  const [treeOwner, setTreeOwner] = useState("");
  const [isTreeOwner, setIsTreeOwner] = useState(false)
  const [selectedMember, setSelectedMember] = useState<MemberType>();
  const [centralPersonId, setCentralPersonId] = useState<string>("");
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);
  const [mainUser, setMainUser] = useState<UserType | null>(null);
  const [parents, setParents] = useState<MemberType[] | null>([])

  useEffect(() => {
    if (userId) {
      getUserById(userId)
        .then(setMainUser)
        .catch((err) => console.error("Erreur récupération user:", err));
    } else {
      setMainUser(currentUser);
    }
  }, [userId, currentUser]);

  useEffect(() => {
    if (!tree?.id) {
      console.warn("⚠️ Pas de tree fourni au composant DynamicFamilyTree");
      return;
    }
 
    const treeRef = collection(db, COLLECTIONS.TREES);
  
    // Écoute en temps réel du tree
    const unsubscribeTree = onSnapshot(
      query(treeRef, where("id", "==", tree.id)),
      (snapshot) => {
        if (!snapshot.docs.length) {
          console.warn("⚠️ Aucun tree trouvé avec cet ID :", tree.id);
          return;
        }
  
        const treeData = snapshot.docs[0].data();
        const memberIds: string[] = treeData.memberIds || [];
  
        if (!memberIds.length) {
          setFamilyData([]);
          return;
        }
    
        const chunkSize = 10;
        const chunks: string[][] = [];
        for (let i = 0; i < memberIds.length; i += chunkSize) {
          chunks.push(memberIds.slice(i, i + chunkSize));
        }
    
        const unsubscribers: (() => void)[] = [];
        const allMembersMap = new Map<string, MemberType>();
  
        const updateAllMembers = () => {
          const membersArray = Array.from(allMembersMap.values());
          setFamilyData(membersArray);
        };
  
        chunks.forEach((idsChunk, index) => {
          const q = query(
            collection(db, COLLECTIONS.MEMBERS),
            where(documentId(), "in", idsChunk)
          );
  
          const unsub = onSnapshot(
            q,
            (snap) => {
  
              snap.docs.forEach((doc) => {
                const data = doc.data() as MemberType;
                allMembersMap.set(doc.id, { id: doc.id, ...data });
              });
  
              updateAllMembers();
            },
            (error) => {
              console.error("❌ Erreur snapshot members chunk", index + 1, error);
            }
          );
  
          unsubscribers.push(unsub);
        });
  
        return () => {
          unsubscribers.forEach((unsub) => unsub());
        };
      },
      (error) => {
        console.error("❌ Erreur snapshot tree :", error);
      }
    );
  
    return () => {
      unsubscribeTree();
    };
  }, [tree?.id]);
   
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

  useEffect(() => {
    if (tree && mainUser) setIsOwner(mainUser.id === tree.ownerId);
  }, [tree, mainUser]);

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

  useEffect(() => {
    if (tree && currentUser && tree.ownerId === currentUser.id) {
      setIsTreeOwner(true)
    }
  }, [tree, currentUser])

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
  
  const centralPerson = getMemberById(familyData, centralPersonId);

  useEffect(() => {
    const fetchParents = async () => {
      try {
        if (centralPerson && centralPerson.id) {
          const data = await getParentsByMemberId(centralPerson.id)
          setParents(data)
        }
      } catch {
        setParents([])}
    }
    fetchParents()
  }, [centralPerson])

  if (!mainUser || !familyData.length || !generations.length) {
    return <div>Chargement de l'arbre...</div>;
  }

  // Séparer les grands-parents paternels et maternels
  const paternalGrandparents = generations.find(gen => gen.type === 'paternal-grandparents')?.members || [];
  const maternalGrandparents = generations.find(gen => gen.type === 'maternal-grandparents')?.members || [];

  // Filtrer les autres générations
  const otherGenerations = generations.filter(gen =>
    gen.type !== 'paternal-grandparents' && gen.type !== 'maternal-grandparents'
  );

  return (
    <div className="space-y-8 px-6">
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
          isTreeOwner={isTreeOwner}
          onEdit={onEdit}
          onDelete={onDelete}
          parents={parents ? parents : []}
          onDetail={onDetail}
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
            isTreeOwner={isTreeOwner}
            onEdit={onEdit}
            onDelete={onDelete}
            onDetail={onDetail}
          />
        ))}
      </div>
    </div>
  );
};