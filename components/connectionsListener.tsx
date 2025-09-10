// controllers/connectionsListener.ts
import { db } from "@/lib/firebase/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { AppDispatch } from "@/lib/redux/store";
import { setConnections } from "@/lib/redux/slices/connectionsSlice";
import { UserLink } from "@/lib/firebase/models";

export const listenToConnections = (userId: string, dispatch: AppDispatch) => {
  const q = query(
    collection(db, "Connections"),
    where("participants", "array-contains", userId) // ou adapte selon ton modèle
  );

  return onSnapshot(q, (snapshot) => {
    const links: UserLink[] = snapshot.docs.map((doc) => ({
      ...(doc.data() as UserLink),
    }));
    dispatch(setConnections(links));
  });
};