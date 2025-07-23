import { COLLECTIONS } from "@/lib/firebase/collections";
import { addDocumentToCollection, getAllDataFromCollection, getDataFromCollection } from "@/lib/firebase/firebase-functions";

export const createConversation = async (conversationData: any) => {
  try {
    await addDocumentToCollection(COLLECTIONS.CONVERSATIONS, conversationData);
  } catch (error) {
    console.log("Error createConversation", error);
  }
};

export const getConversations = async () => {
  return await getAllDataFromCollection(COLLECTIONS.CONVERSATIONS);
};

export const getConversationById = async (conversationId: string) => {
  return await getDataFromCollection(COLLECTIONS.CONVERSATIONS, conversationId);
};
