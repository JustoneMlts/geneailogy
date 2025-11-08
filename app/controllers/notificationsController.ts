import { COLLECTIONS } from "@/lib/firebase/collections";
import { db } from "@/lib/firebase/firebase";
import { addDocumentToCollection, getAllDataFromCollection, getDataFromCollection, updateDocumentToCollection } from "@/lib/firebase/firebase-functions";
import { NotificationType } from "@/lib/firebase/models";
import { addDoc, collection, doc, getDocs, orderBy, query, where, writeBatch } from "firebase/firestore";

export const createNotification = async (
  notification: Omit<NotificationType, "id" | "createdDate" | "timestamp" | "unread">
) => {
  try {
    const notificationsRef = collection(db, "Notifications")

    await addDoc(notificationsRef, {
      ...notification,
      createdDate: Date.now(),
      timestamp: Date.now(),
      unread: true,
    })
  } catch (error) {
    console.error("Erreur lors de la création de la notification :", error)
  }
}

export const getNotifications = async () => {
  return await getAllDataFromCollection(COLLECTIONS.NOTIFICATIONS);
};

export const getNotificationById = async (notificationId: string) => {
  return await getDataFromCollection(COLLECTIONS.NOTIFICATIONS, notificationId);
};

export const markNotificationAsRead = async (notificationId: string) => {
  try {
    await updateDocumentToCollection(COLLECTIONS.NOTIFICATIONS, notificationId, {
      unread: false,
    })
  } catch (error) {
    console.log("Error markNotificationAsRead", error)
  }
}

export const getMyNotifications = async (userId: string): Promise<NotificationType[]> => {
  try {
    const notificationsRef = collection(db, COLLECTIONS.NOTIFICATIONS);
    
    // Requête filtrée par recipientId et triée par timestamp DESC (plus récent en premier)
    const q = query(
      notificationsRef,
      where("recipientId", "==", userId),
      orderBy("timestamp", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    
    const notifications: NotificationType[] = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as NotificationType[];
    
    return notifications;
  } catch (error) {
    console.error("Erreur lors de la récupération des notifications utilisateur :", error);
    return [];
  }
};

export const getMyUnreadNotifications = async (userId: string): Promise<NotificationType[]> => {
  try {
    const notificationsRef = collection(db, COLLECTIONS.NOTIFICATIONS);
    
    const q = query(
      notificationsRef,
      where("recipientId", "==", userId),
      where("unread", "==", true),
      orderBy("timestamp", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    
    const notifications: NotificationType[] = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as NotificationType[];
    
    return notifications;
  } catch (error) {
    console.error("Erreur lors de la récupération des notifications non lues :", error);
    return [];
  }
};

export const markAllNotificationsAsRead = async (notifications: NotificationType[]) => {
  try {
    const unreadNotifs = notifications.filter((n) => n.unread)

    await Promise.all(
      unreadNotifs.map((notif) =>{
        if (notif.id)
        updateDocumentToCollection(COLLECTIONS.NOTIFICATIONS, notif.id, {
          unread: false,
        })}
      )
    )

    console.log("✅ Toutes les notifications ont été marquées comme lues")
  } catch (error) {
    console.log("Error markAllNotificationsAsRead", error)
  }
}

export const markConnectionNotificationsAsReadInDB = async (userId: string) => {
  // Récupère toutes les notifications de type "connection" non lues pour cet utilisateur
  const q = query(
    collection(db, "Notifications"),
    where("recipientId", "==", userId),
    where("type", "==", "connection"),
    where("unread", "==", true)
  )
  const snap = await getDocs(q)

  const batch = writeBatch(db)
  snap.forEach((docSnap) => {
    batch.update(doc(db, "Notifications", docSnap.id), { unread: false })
  })

  await batch.commit()
}

export const markMessagesNotificationsAsRead = async (userId: string) => {
  try {
    const q = query(
      collection(db, COLLECTIONS.NOTIFICATIONS),
      where("recipientId", "==", userId),
      where("type", "==", "message"),
      where("unread", "==", true)
    )

    const snap = await getDocs(q)
    if (snap.empty) {
      return
    }

    const batch = writeBatch(db)
    snap.forEach((docSnap) => {
      batch.update(doc(db, COLLECTIONS.NOTIFICATIONS, docSnap.id), { unread: false })
    })

    await batch.commit()
    console.log(`✅ ${snap.size} notifications de messages marquées comme lues`)
  } catch (error) {
    console.error("❌ Erreur lors du marquage des notifications de messages :", error)
  }
}