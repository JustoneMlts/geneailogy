import { COLLECTIONS } from "@/lib/firebase/collections";
import {
  updateDocumentToCollection,
  getAllDataFromCollection,
  getDataFromCollection,
} from "@/lib/firebase/firebase-functions";
import { MemberType } from "../../lib/firebase/models";
import { addDoc, arrayUnion, collection, doc, getDoc, getDocs, setDoc, updateDoc, arrayRemove } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";

function removeUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined)) as Partial<T>;
}

/**
 * Ajoute une relation entre deux membres
 * @param personToAddId - ID de la personne à ajouter dans la liste
 * @param targetPersonId - ID de la personne dont on modifie la liste
 * @param field - Le champ à modifier (ex: childrenIds, parentsIds, etc.)
 * @param reciprocal - Si true, ajoute aussi la relation inverse
 */
export const addRelation = async (
  personToAddId: string,
  targetPersonId: string,
  field: keyof MemberType,
  reciprocal: boolean = false
) => {
  // Éviter l'auto-référence
  if (personToAddId === targetPersonId) {
    console.warn(`Tentative d'auto-référence évitée: ${personToAddId} -> ${targetPersonId} pour ${field}`);
    return;
  }

  console.log(`Adding relation: ${personToAddId} sera ajouté dans ${field} de ${targetPersonId}`);

  const targetRef = doc(db, COLLECTIONS.MEMBERS, targetPersonId);
  const targetSnap = await getDoc(targetRef);
  if (!targetSnap.exists()) {
    console.warn(`Le membre cible ${targetPersonId} n'existe pas`);
    return;
  }

  // Mettre à jour le document cible
  await updateDoc(targetRef, { [field]: arrayUnion(personToAddId) });

  // Si réciproque, mettre à jour le document source
  if (reciprocal) {
    const sourceRef = doc(db, COLLECTIONS.MEMBERS, personToAddId);
    await updateDoc(sourceRef, { [field]: arrayUnion(targetPersonId) });
  }
};

/**
 * Nettoie les relations incohérentes d'un membre
 */
export const cleanMemberRelations = async (memberId: string) => {
  const memberRef = doc(db, COLLECTIONS.MEMBERS, memberId);
  const memberSnap = await getDoc(memberRef);
  
  if (!memberSnap.exists()) return;
  
  const memberData = memberSnap.data() as MemberType;
  const updates: any = {};
  
  // Nettoyer les auto-références dans tous les champs de relation
  const relationFields = ['parentsIds', 'childrenIds', 'brothersIds'] as const;
  
  relationFields.forEach(field => {
    const currentArray = memberData[field] as string[] || [];
    const cleanedArray = currentArray.filter(id => id !== memberId);
    
    if (cleanedArray.length !== currentArray.length) {
      updates[field] = cleanedArray;
    }
  });
  
  // Appliquer les nettoyages s'il y en a
  if (Object.keys(updates).length > 0) {
    await updateDoc(memberRef, updates);
  }
};

/**
 * Met à jour toutes les relations d'un membre (parents, enfants, frères, conjoint)
 */
export const updateRelations = async (memberId: string, member: MemberType) => {
  console.log(`🔄 Mise à jour des relations pour ${member.firstName} ${member.lastName} (${memberId})`);
  
  const updates: Promise<any>[] = [];

  // Nettoyer d'abord les auto-références
  updates.push(cleanMemberRelations(memberId));

  // 1️⃣ Parents → enfant (unidirectionnel)
  // Ajouter ce membre comme enfant de ses parents
  console.log(`Parents à traiter: ${member.parentsIds?.join(', ') || 'aucun'}`);
  for (const parentId of member.parentsIds ?? []) {
    if (parentId !== memberId) { 
      console.log(`➡️ Ajout de ${memberId} dans childrenIds de ${parentId}`);
      updates.push(addRelation(memberId, parentId, "childrenIds"));
    }
  }

  // 2️⃣ Enfants → parent (unidirectionnel) 
  // Ajouter ce membre comme parent de ses enfants
  console.log(`Enfants à traiter: ${member.childrenIds?.join(', ') || 'aucun'}`);
  for (const childId of member.childrenIds ?? []) {
    if (childId !== memberId) { 
      console.log(`➡️ Ajout de ${memberId} dans parentsIds de ${childId}`);
      updates.push(addRelation(memberId, childId, "parentsIds"));
    }
  }

  // 3️⃣ Frères explicites → réciproque
  for (const siblingId of member.brothersIds ?? []) {
    if (siblingId !== memberId) {
      updates.push(addRelation(memberId, siblingId, "brothersIds", true));
    }
  }

  // 4️⃣ Frères automatiques via parents
  const siblingSet = new Set(member.brothersIds ?? []);
  for (const parentId of member.parentsIds ?? []) {
    if (parentId === memberId) continue; // Éviter les parents auto-référentiels
    
    const parentSnap = await getDoc(doc(db, COLLECTIONS.MEMBERS, parentId));
    if (!parentSnap.exists()) continue;

    const parentData = parentSnap.data() as MemberType;
    for (const siblingId of parentData.childrenIds ?? []) {
      if (siblingId !== memberId && !siblingSet.has(siblingId)) {
        updates.push(addRelation(memberId, siblingId, "brothersIds", true));
      }
    }
  }

  // 5️⃣ Conjoint → réciproque
  if (member.mariageId && member.mariageId !== memberId) {
    updates.push(addRelation(memberId, member.mariageId, "mariageId", true));
    updates.push(updateDoc(doc(db, COLLECTIONS.MEMBERS, memberId), { isMarried: true }));
    updates.push(updateDoc(doc(db, COLLECTIONS.MEMBERS, member.mariageId), { isMarried: true }));
  }

  await Promise.all(updates);
};

/**
 * Crée un nouveau membre et met à jour ses relations
 */
export const addMember = async (memberData: Omit<MemberType, "id">): Promise<string> => {
  const cleanedData = removeUndefined(memberData);
  
  // Nettoyer les auto-références avant même de créer le membre
  const relationFields = ['parentsIds', 'childrenIds', 'brothersIds'] as const;
  relationFields.forEach(field => {
    if (cleanedData[field]) {
      cleanedData[field] = (cleanedData[field] as string[]).filter(id => id && id.trim() !== '');
    }
  });
  
  const docRef = await addDoc(collection(db, COLLECTIONS.MEMBERS), cleanedData);
  const newMemberId = docRef.id;

  await updateRelations(newMemberId, { ...cleanedData, id: newMemberId } as MemberType);

  return newMemberId;
};

/**
 * Met à jour un membre et ses relations
 */
export const updateMember = async (memberId: string, memberData: Partial<MemberType>) => {
  const safeData = removeUndefined(memberData);
  
  // Nettoyer les auto-références dans les données d'entrée
  const relationFields = ['parentsIds', 'childrenIds', 'brothersIds'] as const;
  relationFields.forEach(field => {
    if (safeData[field]) {
      safeData[field] = (safeData[field] as string[]).filter(id => id && id !== memberId);
    }
  });
  
  await updateDoc(doc(db, COLLECTIONS.MEMBERS, memberId), { ...safeData, updatedDate: Date.now() });

  const updatedSnap = await getDoc(doc(db, COLLECTIONS.MEMBERS, memberId));
  if (updatedSnap.exists()) {
    const updatedMember = updatedSnap.data() as MemberType;
    await updateRelations(memberId, updatedMember);
  }
};

// 🔹 Récupérer tutti i membri
export const getMembers = async () => {
  return await getAllDataFromCollection(COLLECTIONS.MEMBERS);
};

// 🔹 Récupérer un membro par ID
export const getMemberById = async (memberId: string): Promise<MemberType | null> => {
  try {
    const doc = await getDataFromCollection(COLLECTIONS.MEMBERS, memberId);
    if (!doc) return null;
    return { id: memberId, ...(doc as MemberType) };
  } catch (error) {
    console.error("Erreur getMemberById :", error);
    return null;
  }
};

// 🔹 Récupérer più membri
export const getFamilyMembersByIds = async (memberIds: string[]): Promise<MemberType[]> => {
  if (!memberIds.length) return [];

  const snapshot = await getDocs(collection(db, COLLECTIONS.MEMBERS));
  const members: MemberType[] = [];

  snapshot.forEach((docSnap) => {
    const data = docSnap.data() as MemberType;
    if (memberIds.includes(docSnap.id)) {
      members.push({ id: docSnap.id, ...data });
    }
  });

  return memberIds.map((id) => members.find((m) => m?.id === id)).filter((m): m is MemberType => !!m);
};

/**
 * Fonction utilitaire pour nettoyer toute la base de données des auto-références
 */
export const cleanAllMembersRelations = async () => {
  const snapshot = await getDocs(collection(db, COLLECTIONS.MEMBERS));
  const cleanupPromises: Promise<void>[] = [];
  
  snapshot.forEach((docSnap) => {
    cleanupPromises.push(cleanMemberRelations(docSnap.id));
  });
  
  await Promise.all(cleanupPromises);
  console.log("Nettoyage terminé pour tous les membres");
};

export const getMembersBirthPlaces = async (): Promise<
  { id: string; firstName: string; lastName: string; birthPlace: { lat: number; lng: number; city?: string; country?: string } }[]
> => {
  const snapshot = await getDocs(collection(db, COLLECTIONS.MEMBERS));
  const birthPlaces: {
    id: string;
    firstName: string;
    lastName: string;
    birthPlace: { lat: number; lng: number; city?: string; country?: string };
  }[] = [];

  snapshot.forEach((docSnap) => {
    const data = docSnap.data() as MemberType;

    if (data.birthPlace && data.birthPlace.latitude && data.birthPlace.longitude) {
      birthPlaces.push({
        id: docSnap.id,
        firstName: data.firstName,
        lastName: data.lastName,
        birthPlace: {
          lat: data.birthPlace.latitude,
          lng: data.birthPlace.longitude,
          city: data.birthPlace.city,
          country: data.birthPlace.country,
        },
      });
    }
  });

  return birthPlaces;
};