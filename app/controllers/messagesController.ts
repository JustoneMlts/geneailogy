import { COLLECTIONS } from "@/lib/firebase/collections";
import { db } from "@/lib/firebase/firebase";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
  writeBatch,
  arrayUnion,
  setDoc,
} from "firebase/firestore";
import { ConversationType, MessageType, ConversationParticipant } from "@/lib/firebase/models";
import { getUserById } from "./usersController";

// Créer ou mettre à jour une conversation
export const createOrUpdateConversation = async (
  conversationId: string | undefined,
  conversationData: Partial<ConversationType>
) => {
  try {
    if (conversationId) {
      // UPDATE: conversation existante
      const ref = doc(db, COLLECTIONS.CONVERSATIONS, conversationId);
      await updateDoc(ref, {
        ...conversationData,
        updatedDate: Date.now(),
      } as any);
      return conversationId;
    } else {
      // CREATE: nouvelle conversation
      const ref = await addDoc(collection(db, COLLECTIONS.CONVERSATIONS), {
        ...conversationData,
        createdDate: Date.now(),
        updatedDate: Date.now(),
        hasUnreadMessages: false, // ✨ Initialisation
      });

      const newConversationId = ref.id;

      // Ajouter la conversation aux users
      const participantIds = conversationData.participantIds || [];
      if (participantIds.length > 0) {
        const batch = writeBatch(db);

        for (const userId of participantIds) {
          const userRef = doc(db, COLLECTIONS.USERS, userId);
          batch.update(userRef, {
            conversationsIds: arrayUnion(newConversationId),
          });
        }

        await batch.commit();
        console.log(`✅ Conversation ${newConversationId} ajoutée aux ${participantIds.length} users`);
      }

      return newConversationId;
    }
  } catch (err) {
    console.error("createOrUpdateConversation", err);
    throw err;
  }
};

export const createOrGetConversation = async (
  userId1: string,
  userId2: string,
  otherUserData?: { firstName: string; lastName: string; avatarUrl?: string }
) => {
  const convRef = collection(db, "Conversations");

  // 🔍 Chercher une conversation existante entre ces deux participants
  const q = query(convRef, where("participantIds", "array-contains", userId1));
  const snapshot = await getDocs(q);

  let existingConv = snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .find((conv: any) => conv.participantIds?.includes(userId2));

  if (existingConv) {
    console.log("✅ Conversation déjà existante:", existingConv);
    return existingConv; // ✅ avec id
  }

  // ❌ pas trouvée → on la crée
  const newConv = {
    participantIds: [userId1, userId2],
    participants: [
      { userId: userId1 },
      { userId: userId2, ...otherUserData },
    ],
    createdDate: Date.now(),
    updatedDate: Date.now(),
    lastMessage: "",
    lastSenderId: null,
    hasUnreadMessages: false,
    isActive: true,
  };

  const docRef = await addDoc(convRef, newConv);
  return { id: docRef.id, ...newConv }; // ✅ inclure id ici
};

// Envoyer un message
export const sendMessage = async (
  message: Omit<MessageType, "id" | "createdDate"> & { createdDate?: number }
) => {
  try {
    const messagesRef = collection(db, COLLECTIONS.MESSAGES);
    const createdDate = message.createdDate ?? Date.now();
    const docRef = await addDoc(messagesRef, {
      ...message,
      createdDate,
      isRead: false,
    });

    // Mettre à jour les métadonnées de la conversation
    const convRef = doc(db, COLLECTIONS.CONVERSATIONS, message.conversationId);
    await updateDoc(convRef, {
      lastMessage: message.text || "",
      updatedDate: Date.now(),
      lastSenderId: message.senderId,
      hasUnreadMessages: true, // ✨ Nouveau message = messages non lus
    } as any);

    return docRef.id;
  } catch (err) {
    console.error("sendMessage", err);
    throw err;
  }
};

// Écouter les conversations d'un user
export const listenUserConversations = (
  userId: string,
  callback: (conversations: ConversationType[]) => void
) => {
  const q = query(
    collection(db, COLLECTIONS.CONVERSATIONS),
    where("participantIds", "array-contains", userId),
    orderBy("updatedDate", "desc")
  );
  const unsub = onSnapshot(q, (snapshot) => {
    const convs = snapshot.docs.map(d => ({ 
      id: d.id, 
      ...d.data() 
    })) as ConversationType[];
    callback(convs);
  });
  return unsub;
};

// Écouter les messages d'une conversation
export const listenConversationMessages = (
  conversationId: string,
  callback: (messages: MessageType[]) => void
) => {
  const q = query(
    collection(db, COLLECTIONS.MESSAGES),
    where("conversationId", "==", conversationId),
    orderBy("createdDate", "asc")
  );
  const unsub = onSnapshot(q, (snapshot) => {
    const msgs = snapshot.docs.map(d => ({ 
      id: d.id, 
      ...d.data() 
    })) as MessageType[];
    callback(msgs);
  });
  return unsub;
};

// ✨ Marquer une conversation comme lue (version améliorée)
export const markConversationAsRead = async (
  conversationId: string,
  readerId: string
) => {
  try {
    const messagesRef = collection(db, COLLECTIONS.MESSAGES);
    const q = query(
      messagesRef,
      where("conversationId", "==", conversationId),
      where("isRead", "==", false)
    );

    const querySnapshot = await getDocs(q);
    const batch = writeBatch(db);

    let hasUnreadForOthers = false;

    querySnapshot.docs.forEach((docSnap) => {
      const data = docSnap.data();

      // On ne marque pas comme lu les messages envoyés par soi-même
      if (data.senderId === readerId) {
        // Mais on vérifie s'il y a d'autres lecteurs qui n'ont pas lu
        if (data.isRead === false) {
          hasUnreadForOthers = true;
        }
        return;
      }

      const messageRef = doc(db, COLLECTIONS.MESSAGES, docSnap.id);

      // Système hybride :
      // - on garde isRead pour compatibilité
      // - on ajoute un tableau readBy[] pour plus de granularité
      const updates: any = { isRead: true };
      if (data.readBy && Array.isArray(data.readBy)) {
        if (!data.readBy.includes(readerId)) {
          updates.readBy = arrayUnion(readerId);
        }
      } else {
        updates.readBy = [readerId];
      }

      batch.update(messageRef, updates);
    });

    // ✨ Mettre à jour hasUnreadMessages dans la conversation
    const convRef = doc(db, COLLECTIONS.CONVERSATIONS, conversationId);
    batch.update(convRef, { 
      [`lastSeen.${readerId}`]: Date.now(),
      hasUnreadMessages: hasUnreadForOthers // false si tous les messages sont lus
    });

    await batch.commit();
  } catch (err) {
    console.error("markConversationAsRead", err);
  }
};

// Chercher une conversation existante
export const findExistingConversation = async (
  userId1: string,
  userId2: string
): Promise<string | null> => {
  try {
    const q = query(
      collection(db, COLLECTIONS.CONVERSATIONS),
      where("participantIds", "array-contains", userId1)
    );
    const snapshot = await getDocs(q);

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const participantIds = data.participantIds || [];

      if (participantIds.includes(userId2) && participantIds.length === 2) {
        return docSnap.id;
      }
    }

    return null;
  } catch (error) {
    console.error("Erreur lors de la recherche de conversation existante:", error);
    return null;
  }
};

// Créer les participants à partir des UserTypes
export const createConversationParticipants = (
  users: Array<{ id: string; firstName: string; lastName: string; avatarUrl?: string; location?: string }>
): ConversationParticipant[] => {
  return users.map(user => ({
    userId: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    avatarUrl: user.avatarUrl,
    location: user.location,
  }));
};