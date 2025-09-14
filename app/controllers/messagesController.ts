// app/controllers/messagesController.ts
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
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
  limit,
} from "firebase/firestore";
import { ConversationType, MessageType } from "@/lib/firebase/models"; // adaptes si nécessaires

// create or update a conversation doc
export const createOrUpdateConversation = async (conversationId: string | undefined, conversationData: Partial<ConversationType>) => {
  try {
    if (conversationId) {
      const ref = doc(db, COLLECTIONS.CONVERSATIONS, conversationId);
      await updateDoc(ref, {
        ...conversationData,
        updatedDate: Date.now(),
      } as any);
      return conversationId;
    } else {
      const ref = await addDoc(collection(db, COLLECTIONS.CONVERSATIONS), {
        ...conversationData,
        createdDate: Date.now(),
        updatedDate: Date.now(),
      });
      return ref.id;
    }
  } catch (err) {
    console.error("createOrUpdateConversation", err);
    throw err;
  }
};

// send a message in real time
export const sendMessage = async (message: Omit<MessageType, "id" | "createdDate"> & { createdDate?: number }) => {
  try {
    const messagesRef = collection(db, COLLECTIONS.MESSAGES);
    const createdDate = message.createdDate ?? Date.now();
    const docRef = await addDoc(messagesRef, {
      ...message,
      createdDate,
      isRead: false,
    });
    // update conversation metadata: lastMessage, updatedDate
    const convRef = doc(db, COLLECTIONS.CONVERSATIONS, message.conversationId);
    await updateDoc(convRef, {
      lastMessage: message.text || "",
      updatedDate: Date.now(),
      lastSenderId: message.senderId,
    } as any);
    return docRef.id;
  } catch (err) {
    console.error("sendMessage", err);
    throw err;
  }
};

// listen to conversations for a user (real-time)
export const listenUserConversations = (userId: string, callback: (conversations: any[]) => void) => {
  const q = query(
    collection(db, COLLECTIONS.CONVERSATIONS),
    where("participantIds", "array-contains", userId),
    orderBy("updatedDate", "desc")
  );
  const unsub = onSnapshot(q, (snapshot) => {
    const convs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(convs);
  });
  return unsub;
};

// listen to messages of a conversation (real-time, ordered)
export const listenConversationMessages = (conversationId: string, callback: (messages: any[]) => void) => {
  const q = query(
    collection(db, COLLECTIONS.MESSAGES),
    where("conversationId", "==", conversationId),
    orderBy("createdDate", "asc")
  );
  const unsub = onSnapshot(q, (snapshot) => {
    const msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(msgs);
  });
  return unsub;
};

// mark messages as read in a conversation for a given user
export const markConversationAsRead = async (conversationId: string, readerId: string) => {
  try {
    // set conversation lastRead map or updated reader field and mark messages as read
    const messagesRef = collection(db, COLLECTIONS.MESSAGES);
    const q = query(
      messagesRef,
      where("conversationId", "==", conversationId),
      where("isRead", "==", false)
    );
    const querySnapshot = await getDocs(q);
    const batch = writeBatch(db);
    querySnapshot.docs.forEach(docSnap => {
      const data = docSnap.data();
      // only mark as read if message sender is not the reader
      if (data.senderId !== readerId) {
        batch.update(doc(db, COLLECTIONS.MESSAGES, docSnap.id), { isRead: true });
      }
    });
    // update conversation lastSeen / readAt for reader
    const convRef = doc(db, COLLECTIONS.CONVERSATIONS, conversationId);
    batch.update(convRef, { [`lastSeen.${readerId}`]: Date.now() });
    await batch.commit();
  } catch (err) {
    console.error("markConversationAsRead", err);
  }
};
