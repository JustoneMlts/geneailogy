import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { store } from "@/lib/redux/store";
import { setLiveUser, removeLiveUser, MinimalUser } from "@/lib/redux/slices/usersLiveSlice";

const subscribers: Record<string, () => void> = {};

export const subscribeToUser = (userId: string) => {
  if (!userId || subscribers[userId]) return;

  const userDocRef = doc(db, "Users", userId);
  const unsub = onSnapshot(userDocRef, (snap) => {
    if (!snap.exists()) return;

    const data = snap.data() as Partial<MinimalUser>;
    const user: MinimalUser = {
      id: snap.id,
      firstName: data.firstName ?? "",
      lastName: data.lastName ?? "",
      avatar: data.avatar ?? "/placeholder.svg",
    };

    store.dispatch(setLiveUser(user));
  });

  subscribers[userId] = unsub;
};

export const unsubscribeUser = (userId: string) => {
  const unsub = subscribers[userId];
  if (unsub) {
    unsub();
    delete subscribers[userId];
    store.dispatch(removeLiveUser(userId));
  }
};

export const reconcileUserListeners = (userIds: string[]) => {
  const wanted = new Set(userIds.filter(Boolean));

  Object.keys(subscribers).forEach((uid) => {
    if (!wanted.has(uid)) unsubscribeUser(uid);
  });

  wanted.forEach((uid) => {
    if (!subscribers[uid]) subscribeToUser(uid);
  });
};

export const unsubscribeAllUsers = () => {
  Object.keys(subscribers).forEach((uid) => unsubscribeUser(uid));
};
