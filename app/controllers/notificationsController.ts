import { COLLECTIONS } from "@/lib/firebase/collections";
import { addDocumentToCollection, getAllDataFromCollection, getDataFromCollection, updateDocumentToCollection } from "@/lib/firebase/firebase-functions";

export const createNotification = async (notificationData: any) => {
  try {
    await addDocumentToCollection(COLLECTIONS.NOTIFICATIONS, notificationData);
  } catch (error) {
    console.log("Error createNotification", error);
  }
};

export const getNotifications = async () => {
  return await getAllDataFromCollection(COLLECTIONS.NOTIFICATIONS);
};

export const getNotificationById = async (notificationId: string) => {
  return await getDataFromCollection(COLLECTIONS.NOTIFICATIONS, notificationId);
};

export const markNotificationAsRead = async (notificationId: string) => {
  try {
    await updateDocumentToCollection(COLLECTIONS.NOTIFICATIONS, notificationId, { read: true });
  } catch (error) {
    console.log("Error markNotificationAsRead", error);
  }
};
