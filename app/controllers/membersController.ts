import { COLLECTIONS } from "@/lib/firebase/collections";
import {
  addDocumentToCollection,
  updateDocumentToCollection,
  getAllDataFromCollection,
  getDataFromCollection
} from "@/lib/firebase/firebase-functions";
import { MemberType } from "../../lib/firebase/models"; // ton interface
import { collection, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";

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
export const updateMember = async (memberId: string, memberData: Partial<MemberType>) => {
  try {
    await updateDocumentToCollection(COLLECTIONS.MEMBERS, memberId, {
      ...memberData,
      updatedDate: Date.now(),
    });
  } catch (error) {
    console.error("❌ Error updateMember:", error);
    throw error;
  }
};

// Récupérer tous les membres
export const getMembers = async () => {
  return await getAllDataFromCollection(COLLECTIONS.MEMBERS);
};

// Récupérer un membre par ID
export const getMemberById = async (memberId: string) => {
  return await getDataFromCollection(COLLECTIONS.MEMBERS, memberId);
};

