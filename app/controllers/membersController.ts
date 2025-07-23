import { COLLECTIONS } from "@/lib/firebase/collections";
import { addDocumentToCollection, getAllDataFromCollection, getDataFromCollection, updateDocumentToCollection } from "@/lib/firebase/firebase-functions";

export const addMember = async (memberData: any) => {
  try {
    await addDocumentToCollection(COLLECTIONS.MEMBERS, memberData);
  } catch (error) {
    console.log("Error addMember", error);
  }
};

export const updateMember = async (memberId: string, memberData: any) => {
  try {
    await updateDocumentToCollection(COLLECTIONS.MEMBERS, memberId, memberData);
  } catch (error) {
    console.log("Error updateMember", error);
  }
};

export const getMembers = async () => {
  return await getAllDataFromCollection(COLLECTIONS.MEMBERS);
};

export const getMemberById = async (memberId: string) => {
  return await getDataFromCollection(COLLECTIONS.MEMBERS, memberId);
};
