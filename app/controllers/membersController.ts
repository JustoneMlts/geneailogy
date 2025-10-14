import { COLLECTIONS } from "@/lib/firebase/collections";
import {
  updateDocumentToCollection,
  getAllDataFromCollection,
  getDataFromCollection,
} from "@/lib/firebase/firebase-functions";
import { MemberType, LocationData, TreeType } from "../../lib/firebase/models";
import {
  addDoc, arrayUnion, collection, doc, getDoc, getDocs,
  updateDoc, arrayRemove, deleteDoc,
  setDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";

function removeUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined)) as Partial<T>;
}

/* -------------------------------------------------------------------------- */
/*                               RELATIONS                                    */
/* -------------------------------------------------------------------------- */

export const addRelation = async (
  personToAddId: string,
  targetPersonId: string,
  field: keyof MemberType,
  reciprocal: boolean = false
) => {
  if (personToAddId === targetPersonId) return;

  const targetRef = doc(db, COLLECTIONS.MEMBERS, targetPersonId);
  const targetSnap = await getDoc(targetRef);
  if (!targetSnap.exists()) return;

  await updateDoc(targetRef, { [field]: arrayUnion(personToAddId) });

  if (reciprocal) {
    const sourceRef = doc(db, COLLECTIONS.MEMBERS, personToAddId);
    await updateDoc(sourceRef, { [field]: arrayUnion(targetPersonId) });
  }
};

export const cleanMemberRelations = async (memberId: string) => {
  const memberRef = doc(db, COLLECTIONS.MEMBERS, memberId);
  const memberSnap = await getDoc(memberRef);
  if (!memberSnap.exists()) return;

  const memberData = memberSnap.data() as MemberType;
  const updates: any = {};

  const relationFields = ["parentsIds", "childrenIds", "brothersIds"] as const;

  relationFields.forEach((field) => {
    const currentArray = (memberData[field] as string[]) || [];
    const cleanedArray = currentArray.filter((id) => id !== memberId);
    if (cleanedArray.length !== currentArray.length) {
      updates[field] = cleanedArray;
    }
  });

  if (Object.keys(updates).length > 0) {
    await updateDoc(memberRef, updates);
  }
};

export const updateRelations = async (memberId: string, member: MemberType) => {
  const updates: Promise<any>[] = [];
  updates.push(cleanMemberRelations(memberId));

  for (const parentId of member.parentsIds ?? []) {
    if (parentId !== memberId) {
      updates.push(addRelation(memberId, parentId, "childrenIds"));
    }
  }

  for (const childId of member.childrenIds ?? []) {
    if (childId !== memberId) {
      updates.push(addRelation(memberId, childId, "parentsIds"));
    }
  }

  for (const siblingId of member.brothersIds ?? []) {
    if (siblingId !== memberId) {
      updates.push(addRelation(memberId, siblingId, "brothersIds", true));
    }
  }

  const siblingSet = new Set(member.brothersIds ?? []);
  for (const parentId of member.parentsIds ?? []) {
    if (parentId === memberId) continue;
    const parentSnap = await getDoc(doc(db, COLLECTIONS.MEMBERS, parentId));
    if (!parentSnap.exists()) continue;

    const parentData = parentSnap.data() as MemberType;
    for (const siblingId of parentData.childrenIds ?? []) {
      if (siblingId !== memberId && !siblingSet.has(siblingId)) {
        updates.push(addRelation(memberId, siblingId, "brothersIds", true));
      }
    }
  }

  if (member.mariageId && member.mariageId !== memberId) {
    updates.push(addRelation(memberId, member.mariageId, "mariageId", true));
    updates.push(updateDoc(doc(db, COLLECTIONS.MEMBERS, memberId), { isMarried: true }));
    updates.push(updateDoc(doc(db, COLLECTIONS.MEMBERS, member.mariageId), { isMarried: true }));
  }

  await Promise.all(updates);
};

/* -------------------------------------------------------------------------- */
/*                                 CRUD                                       */
/* -------------------------------------------------------------------------- */

export const addMember = async (
  memberData: Omit<MemberType, "id">,
  customId?: string
): Promise<string> => {
  const cleanedData = removeUndefined(memberData);
  const relationFields = ["parentsIds", "childrenIds", "brothersIds"] as const;

  relationFields.forEach((field) => {
    if (cleanedData[field]) {
      cleanedData[field] = (cleanedData[field] as string[]).filter((id) => id && id.trim() !== "");
    }
  });

  let newMemberId: string;
  if (customId) {
    // Utiliser le customId fourni
    await setDoc(doc(db, COLLECTIONS.MEMBERS, customId), cleanedData);
    newMemberId = customId;
  } else {
    // Sinon laisser Firestore générer un id
    const docRef = await addDoc(collection(db, COLLECTIONS.MEMBERS), cleanedData);
    newMemberId = docRef.id;
  }

  await updateRelations(newMemberId, { ...cleanedData, id: newMemberId } as MemberType);

  // 🔹 Ajouter le nom de famille dans le tree si nouveau
  if (cleanedData.treeId && cleanedData.lastName) {
    const treeRef = doc(db, COLLECTIONS.TREES, cleanedData.treeId);
    const treeSnap = await getDoc(treeRef);
    const treeData = treeSnap.exists() ? (treeSnap.data() as TreeType) : null;

    if (treeData) {
      const lastName = cleanedData.lastName.trim();
      const lastNameLower = lastName.toLowerCase();

      const updates: any = {};

      if (!treeData.surnames?.includes(lastName)) {
        updates.surnames = arrayUnion(lastName);
      }
      if (!treeData.surnamesLower?.includes(lastNameLower)) {
        updates.surnamesLower = arrayUnion(lastNameLower);
      }

      if (Object.keys(updates).length > 0) {
        await updateDoc(treeRef, updates);
      }
    }
  }

  // 🔹 Ajouter la nationalité dans le tree si nouvelle
  if (cleanedData.treeId && typeof cleanedData.nationality === "string") {
    const treeRef = doc(db, COLLECTIONS.TREES, cleanedData.treeId);
    await updateDoc(treeRef, { origin: arrayUnion(cleanedData.nationality) });
  }

  if (cleanedData.treeId && Array.isArray(cleanedData.nationality)) {
    const treeRef = doc(db, COLLECTIONS.TREES, cleanedData.treeId);
    for (const nat of cleanedData.nationality) {
      await updateDoc(treeRef, { origin: arrayUnion(nat) });
    }
  }

  return newMemberId;
};

export const updateMember = async (memberId: string, memberData: Partial<MemberType>) => {
  const safeData = removeUndefined(memberData);
  const relationFields = ["parentsIds", "childrenIds", "brothersIds"] as const;

  relationFields.forEach((field) => {
    if (safeData[field]) {
      safeData[field] = (safeData[field] as string[]).filter((id) => id && id !== memberId);
    }
  });

  // 🔹 Récupérer l'ancien nom de famille avant mise à jour
  const oldMemberSnap = await getDoc(doc(db, COLLECTIONS.MEMBERS, memberId));
  const oldLastName = oldMemberSnap.exists() ? (oldMemberSnap.data() as MemberType).lastName : null;
  const oldTreeId = oldMemberSnap.exists() ? (oldMemberSnap.data() as MemberType).treeId : null;

  await updateDoc(doc(db, COLLECTIONS.MEMBERS, memberId), { ...safeData, updatedDate: Date.now() });

  const updatedSnap = await getDoc(doc(db, COLLECTIONS.MEMBERS, memberId));
  if (updatedSnap.exists()) {
    const updatedMember = updatedSnap.data() as MemberType;
    await updateRelations(memberId, updatedMember);

    // 🔹 Gérer le changement de nom de famille
    // 🔹 Gérer le changement de nom de famille
    if (safeData.lastName && oldLastName && safeData.lastName !== oldLastName && updatedMember.treeId) {
      const treeRef = doc(db, COLLECTIONS.TREES, updatedMember.treeId);
      const treeSnap = await getDoc(treeRef);
      const treeData = treeSnap.exists() ? (treeSnap.data() as TreeType) : null;

      if (treeData) {
        const newName = safeData.lastName.trim();
        const newNameLower = newName.toLowerCase();
        const oldNameLower = oldLastName.toLowerCase();

        const updates: any = {};

        // Ajouter le nouveau nom s’il n’existe pas encore
        if (!treeData.surnames?.includes(newName)) {
          updates.surnames = arrayUnion(newName);
        }
        if (!treeData.surnamesLower?.includes(newNameLower)) {
          updates.surnamesLower = arrayUnion(newNameLower);
        }

        // Vérifier si l’ancien nom est encore utilisé
        const membersSnap = await getDocs(collection(db, COLLECTIONS.MEMBERS));
        const stillHasOldName = membersSnap.docs.some((d) => {
          const data = d.data() as MemberType;
          return d.id !== memberId && data.treeId === updatedMember.treeId && data.lastName === oldLastName;
        });

        if (!stillHasOldName) {
          updates.surnames = arrayRemove(oldLastName);
          updates.surnamesLower = arrayRemove(oldNameLower);
        }

        if (Object.keys(updates).length > 0) {
          await updateDoc(treeRef, updates);
        }
      }
    }


  }
};

/* -------------------------------------------------------------------------- */
/*                          REMOVE MEMBER + CLEAN                             */
/* -------------------------------------------------------------------------- */

function isSameLocation(a: LocationData, b: LocationData): boolean {
  return (
    a.city?.toLowerCase() === b.city?.toLowerCase() &&
    a.country?.toLowerCase() === b.country?.toLowerCase()
  );
}

async function cleanTreeAfterMemberRemoval(treeId: string, removedMember: MemberType) {
  const treeRef = doc(db, COLLECTIONS.TREES, treeId);
  const membersSnap = await getDocs(collection(db, COLLECTIONS.MEMBERS));

  const remainingMembers = membersSnap.docs
    .map((d) => ({ id: d.id, ...(d.data() as MemberType) }))
    .filter((m) => m.treeId === treeId && m.id !== removedMember.id);

  if (removedMember.lastName) {
    const lastName = removedMember.lastName.trim();
    const lastNameLower = lastName.toLowerCase();
    const stillHasName = remainingMembers.some((m) => m.lastName === lastName);

    if (!stillHasName) {
      await updateDoc(treeRef, {
        surnames: arrayRemove(lastName),
        surnamesLower: arrayRemove(lastNameLower),
      });
    }
  }

  if (removedMember.birthPlace) {
    const stillHasLocation = remainingMembers.some(
      (m) => m.birthPlace && isSameLocation(m.birthPlace, removedMember.birthPlace!)
    );
    if (!stillHasLocation) {
      await updateDoc(treeRef, { locations: arrayRemove(removedMember.birthPlace) });
    }
  }

  // 🔹 Supprimer la nationalité si plus aucun membre ne l'a
  if (removedMember.nationality) {
    const stillHasNationality = remainingMembers.some(
      (m) => m.nationality === removedMember.nationality
    );
    if (!stillHasNationality) {
      await updateDoc(treeRef, { origin: arrayRemove(removedMember.nationality) });
    }
  }
}

export const removeMember = async (memberId: string) => {
  const memberRef = doc(db, COLLECTIONS.MEMBERS, memberId);
  const memberSnap = await getDoc(memberRef);
  if (!memberSnap.exists()) return;

  const memberData = { id: memberId, ...(memberSnap.data() as MemberType) };

  // 🔹 Nettoyer l'arbre (y compris familyNames)
  if (memberData.treeId) {
    await cleanTreeAfterMemberRemoval(memberData.treeId, memberData);
  }

  // 🔹 Nettoyer les relations des autres membres
  const allMembersSnap = await getDocs(collection(db, COLLECTIONS.MEMBERS));
  for (const docSnap of allMembersSnap.docs) {
    const data = docSnap.data() as MemberType;
    const updates: any = {};

    if (data.parentsIds?.includes(memberId)) {
      updates.parentsIds = data.parentsIds.filter((id) => id !== memberId);
    }
    if (data.childrenIds?.includes(memberId)) {
      updates.childrenIds = data.childrenIds.filter((id) => id !== memberId);
    }
    if (data.brothersIds?.includes(memberId)) {
      updates.brothersIds = data.brothersIds.filter((id) => id !== memberId);
    }
    if (data.mariageId === memberId) {
      updates.mariageId = null;
      updates.isMarried = false;
    }

    if (Object.keys(updates).length > 0) {
      await updateDoc(doc(db, COLLECTIONS.MEMBERS, docSnap.id), updates);
    }
  }

  // 🔹 Supprimer le membre
  await deleteDoc(memberRef);
};

/* -------------------------------------------------------------------------- */
/*                              GETTERS                                       */
/* -------------------------------------------------------------------------- */

export const getMembers = async () => {
  return await getAllDataFromCollection(COLLECTIONS.MEMBERS);
};

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

export const cleanAllMembersRelations = async () => {
  const snapshot = await getDocs(collection(db, COLLECTIONS.MEMBERS));
  const cleanupPromises: Promise<void>[] = [];

  snapshot.forEach((docSnap) => {
    cleanupPromises.push(cleanMemberRelations(docSnap.id));
  });

  await Promise.all(cleanupPromises);
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

export const getParentsByMemberId = async (memberId: string): Promise<MemberType[]> => {
  try {
    const memberSnap = await getDoc(doc(db, COLLECTIONS.MEMBERS, memberId));
    if (!memberSnap.exists()) return [];

    const memberData = memberSnap.data() as MemberType;
    const parentIds = memberData.parentsIds || [];
    if (!parentIds.length) return [];

    const parents: MemberType[] = [];
    for (const pid of parentIds) {
      const parentSnap = await getDoc(doc(db, COLLECTIONS.MEMBERS, pid));
      if (parentSnap.exists()) {
        parents.push({ id: parentSnap.id, ...(parentSnap.data() as MemberType) });
      }
    }
    return parents;
  } catch (error) {
    console.error("Erreur lors de la récupération des parents :", error);
    return [];
  }
};