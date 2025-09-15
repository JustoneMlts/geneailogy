import { COLLECTIONS } from "@/lib/firebase/collections";
import { db } from "@/lib/firebase/firebase";
import { addDocumentToCollection, getAllDataFromCollection, getDataFromCollection, updateDocumentToCollection } from "@/lib/firebase/firebase-functions";
import { MemberType, TreeType } from "@/lib/firebase/models";
import { arrayUnion, collection, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";


export const createTree = async (treeData: Omit<TreeType, 'id'>) => {
  try {
    // 1. Créer le document tree
    const docRef = doc(collection(db, COLLECTIONS.TREES));
    await setDoc(docRef, {
      ...treeData,
      createdDate: Date.now(),
      updatedDate: Date.now(),
      isActive: true
    });

    // 2. Mettre à jour l'utilisateur pour ajouter l'ID de l'arbre
    if (treeData.ownerId) {
      const userRef = doc(db, COLLECTIONS.USERS, treeData.ownerId);
      await updateDoc(userRef, {
        treesIds: arrayUnion(docRef.id),
        updatedDate: Date.now()
      });
    }

    return docRef.id;
  } catch (error) {
    console.log("Error createTree", error);
    throw error;
  }
};

export const updateTree = async (treeId: string, treeData: any) => {
  try {
    await updateDocumentToCollection(COLLECTIONS.TREES, treeId, treeData);
  } catch (error) {
    console.log("Error updateTree", error);
  }
};

export const getTrees = async () => {
  return await getAllDataFromCollection(COLLECTIONS.TREES);
};

export const getTreeById = async (treeId: string) => {
  return await getDataFromCollection(COLLECTIONS.TREES, treeId);
};


export const getMembersByTreeId = async (treeId: string): Promise<MemberType[]> => {
  try {
    const treeRef = doc(db, "Trees", treeId);
    const treeSnap = await getDoc(treeRef);
    console.log("treeRef", treeRef)
    console.log("treeSnap", treeSnap)

    if (!treeSnap.exists()) return [];

    const memberIds: string[] = treeSnap.data()?.memberIds || [];
    if (!memberIds.length) return [];

    // Firestore limit "in" query à 10 ids max par requête
    const batches: MemberType[] = [];
    for (let i = 0; i < memberIds.length; i += 10) {
      const batchIds = memberIds.slice(i, i + 10);
      const membersBatch = await Promise.all(
        batchIds.map(async id => {
          try {
            return await getDataFromCollection(COLLECTIONS.MEMBERS, id);
          } catch (err) {
            console.warn(`Member ${id} does not exist, skipping.`);
            return null; // retourner null si absent
          }
        })
      );

      batches.push(...(membersBatch.filter(Boolean) as MemberType[]));
    }

    // Maintenir l'ordre des IDs dans tree.memberIds
    const sortedMembers = memberIds
      .map(id => batches.find(m => m.id === id))
      .filter(Boolean) as MemberType[];

    console.log("sortedMembers", sortedMembers)
    return sortedMembers;
  } catch (error) {
    console.error("❌ Error getMembersByTreeId:", error);
    return [];
  }
};