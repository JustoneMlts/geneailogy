import { addDocumentToCollection, getAllDataFromCollectionWithWhereArray } from "@/lib/firebase/firebase-functions";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { UserType } from "@/lib/firebase/models";

export const createUser = async ({ email, firstName, lastName, uid }: { email: string, firstName: string, lastName: string, uid: string }) => {
    try {
        await addDocumentToCollection(COLLECTIONS.USERS, { email: email, firstName: firstName, lastName: lastName, uid: uid });
    } catch (error) {
        console.log("Error createUser", error);
    }
};

export const getUserById = async (uid: string): Promise<UserType | null> => {
  try {
    const q = query(collection(db, "Users"), where("uid", "==", uid));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.warn("Aucun utilisateur trouvé avec cet uid :", uid);
      return null;
    }

    const userDoc = querySnapshot.docs[0];
    const data = userDoc.data() as Omit<UserType, "id">;

    return {
      id: userDoc.id,
      ...data,
    };
  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur :", error);
    return null;
  }
}


