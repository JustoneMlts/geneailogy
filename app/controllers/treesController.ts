import { COLLECTIONS } from "@/lib/firebase/collections";
import { addDocumentToCollection, getAllDataFromCollection, getDataFromCollection, updateDocumentToCollection } from "@/lib/firebase/firebase-functions";

export const createTree = async (treeData: any) => {
  try {
    await addDocumentToCollection(COLLECTIONS.TREES, treeData);
  } catch (error) {
    console.log("Error createTree", error);
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
