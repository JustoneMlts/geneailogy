import { COLLECTIONS } from "@/lib/firebase/collections";
import { addDocumentToCollection, getAllDataFromCollection, getDataFromCollection, updateDocumentToCollection } from "@/lib/firebase/firebase-functions";

export const sendMessage = async (messageData: any) => {
  try {
    await addDocumentToCollection(COLLECTIONS.MESSAGES, messageData);
  } catch (error) {
    console.log("Error sendMessage", error);
  }
};

export const getMessages = async () => {
  return await getAllDataFromCollection(COLLECTIONS.MESSAGES);
};

export const getMessageById = async (messageId: string) => {
  return await getDataFromCollection(COLLECTIONS.MESSAGES, messageId);
};
