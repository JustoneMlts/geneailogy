import { COLLECTIONS } from "@/lib/firebase/collections";
import {
  addDocumentToCollection,
  updateDocumentToCollection,
  getAllDataFromCollection,
  getDataFromCollection
} from "@/lib/firebase/firebase-functions";
import { MemberType } from "../../lib/firebase/models"; // ton interface
import { collection, doc, getDoc, getDocs, query, setDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";

function removeUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined)
  ) as Partial<T>
}

// Ajouter un membre
export const addMember = async (
  memberData: Omit<MemberType, "id">,
  customId?: string
): Promise<string> => {
  try {
    const docRef = customId
      ? doc(db, COLLECTIONS.MEMBERS, customId) // impose l'ID
      : doc(collection(db, COLLECTIONS.MEMBERS));

    await setDoc(docRef, {
      ...memberData,
      id: docRef.id, // ajout du champ id
      createdDate: Date.now(),
      updatedDate: Date.now(),
      isActive: true,
    });

    return docRef.id;
  } catch (error) {
    console.error("❌ Error addMember:", error);
    throw error;
  }
};

// Mettre à jour un membre
export const updateMember = async (
  memberId: string,
  memberData: Partial<MemberType>
) => {
  try {
    const safeData = removeUndefined(memberData)

    await updateDocumentToCollection(COLLECTIONS.MEMBERS, memberId, {
      ...safeData,
      updatedDate: Date.now(),
    })
  } catch (error) {
    console.error("❌ Error updateMember:", error)
    throw error
  }
}

// Récupérer tous les membres
export const getMembers = async () => {
  return await getAllDataFromCollection(COLLECTIONS.MEMBERS);
};

// Récupérer un membre par ID
export const getMemberById = async (memberId: string): Promise<MemberType | null> => {
  try {
    const doc = await getDataFromCollection(COLLECTIONS.MEMBERS, memberId)

    if (!doc) return null

    const member: MemberType = {
      id: memberId,
      ...(doc as MemberType), // ✅ on cast uniquement doc
    }

    return member
  } catch (error) {
    console.error("Erreur getMemberById :", error)
    return null
  }
}

export const getFamilyMembersByIds = async (memberIds: string[]): Promise<MemberType[]> => {
  if (!memberIds.length) return [];

  const snapshot = await getDocs(collection(db, COLLECTIONS.MEMBERS));
  const members: MemberType[] = [];
  
  snapshot.forEach((doc) => {
    const data = doc.data() as MemberType;
    if (memberIds.includes(doc.id)) { // utiliser doc.id directement
      members.push({ id: doc.id, ...data });
    }
  });

  // Maintenir l'ordre des memberIds
  const sortedMembers = memberIds
    .map(id => members.find(m => m.id === id))
    .filter((m): m is MemberType => !!m);

  return sortedMembers;
};

