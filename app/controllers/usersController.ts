import { addDocumentToCollection, getAllDataFromCollectionWithWhereArray, updateDocumentToCollection } from "@/lib/firebase/firebase-functions";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { arrayUnion, collection, doc, getDoc, getDocs, limit, query, setDoc, updateDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { LinkStatus, UserLink, UserType } from "@/lib/firebase/models";
import { createOrReplaceAvatar } from "./filesController";


export const createUser = async ({
  email,
  firstName,
  lastName,
  uid
}: {
  email: string;
  firstName: string;
  lastName: string;
  uid: string;
}) => {
  try {
    const userData = {
      email,
      firstName,
      lastName,
      uid,
      birthDate: null,
      nationality: null,
      avatarUrl: "",
      bio: "",
      phoneNumber: "",
      localisation: "",
      origins: "",
      oldestAncester: "",
      createdDate: Date.now(),
      updatedDate: Date.now(),
      isActive: true,
    };

    await setDoc(doc(db, COLLECTIONS.USERS, uid), userData); // ← uid utilisé comme ID de doc
  } catch (error) {
    console.log("Error createUser", error);
  }
};


export const updateUser = async (user: UserType): Promise<boolean> => {
  try {
    if (!user.id) {
      throw new Error("L'utilisateur n'a pas d'ID. Impossible de mettre à jour sans ID.")
    }

    const userRef = doc(db, 'Users', user.id)

    const { id, ...userData } = user // on retire l'ID pour ne pas le stocker dans les champs

    await updateDoc(userRef, {
      ...userData,
      updatedDate: Date.now(), // on met à jour la date de mise à jour
    })

    return true
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l’utilisateur :', error)
    return false
  }
}

export const getUserById = async (id: string): Promise<UserType | null> => {
  try {
    const docRef = doc(db, "Users", id)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      console.warn("Aucun utilisateur trouvé avec cet ID :", id)
      return null
    }

    const data = docSnap.data() as Omit<UserType, "id">

    return {
      id: docSnap.id,
      ...data,
    }
  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur :", error)
    return null
  }
}

export const updateUserEmail = async (userId: string, newEmail: string) => {
  try {
    await updateDocumentToCollection(COLLECTIONS.USERS, userId, {
      email: newEmail,
      updatedDate: Date.now(),
    });
  } catch (error) {
    console.error("❌ Error updating email:", error);
  }
};

export const updateUserAvatar = async (
  file: File,
  userId: string
): Promise<string> => {
  const user = await getUserById(userId);

  if (!user) {
    throw new Error("Utilisateur introuvable.");
  }

  const newAvatarUrl = await createOrReplaceAvatar(file, user.avatarUrl);
  user.avatarUrl = newAvatarUrl;

  await updateUser(user);

  return newAvatarUrl;
};

export const updateUserBirthDate = async (userId: string, birthDate: number) => {
  try {
    await updateDocumentToCollection(COLLECTIONS.USERS, userId, {
      birthDate,
      updatedDate: Date.now(),
    });
  } catch (error) {
    console.error("❌ Error updating birthdate:", error);
  }
};

export const updateUserName = async (userId: string, firstName: string, lastName: string) => {
  try {
    await updateDocumentToCollection(COLLECTIONS.USERS, userId, {
      firstName,
      lastName,
      updatedDate: Date.now(),
    });
  } catch (error) {
    console.error("❌ Error updating name:", error);
  }
};

export const updateUserStatus = async (userId: string, isActive: boolean) => {
  try {
    await updateDocumentToCollection(COLLECTIONS.USERS, userId, {
      isActive,
      updatedDate: Date.now(),
    });
  } catch (error) {
    console.error("❌ Error updating isActive:", error);
  }
};

export const sendLinkRequest = async (fromUserId: string, toUserId: string) => {
  const fromUserRef = doc(db, "Users", fromUserId);
  const toUserRef = doc(db, "Users", toUserId);

  const link: UserLink = { userId: toUserId, status: "pending" };
  const reverseLink: UserLink = { userId: fromUserId, status: "pending" };

  await updateDoc(fromUserRef, {
    links: arrayUnion(link),
  });

  await updateDoc(toUserRef, {
    links: arrayUnion(reverseLink),
  });
};

export const updateLinkStatus = async (userId: string, targetUserId: string, newStatus: LinkStatus) => {
  const userRef = doc(db, "Users", userId);
  const targetUserRef = doc(db, "Users", targetUserId);

  const userSnap = await getDoc(userRef);
  const targetSnap = await getDoc(targetUserRef);

  if (!userSnap.exists() || !targetSnap.exists()) throw new Error("User not found");

  const userLinks: UserLink[] = userSnap.data().links || [];
  const targetLinks: UserLink[] = targetSnap.data().links || [];

  const updatedUserLinks = userLinks.map(link =>
    link.userId === targetUserId ? { ...link, status: newStatus } : link
  );
  const updatedTargetLinks = targetLinks.map(link =>
    link.userId === userId ? { ...link, status: newStatus } : link
  );

  await updateDoc(userRef, { links: updatedUserLinks });
  await updateDoc(targetUserRef, { links: updatedTargetLinks });
};

export const removeLink = async (userId: string, targetUserId: string) => {
  const userRef = doc(db, "Users", userId);
  const targetUserRef = doc(db, "Users", targetUserId);

  const userSnap = await getDoc(userRef);
  const targetSnap = await getDoc(targetUserRef);

  if (!userSnap.exists() || !targetSnap.exists()) throw new Error("User not found");

  const userLinks: UserLink[] = userSnap.data().links || [];
  const targetLinks: UserLink[] = targetSnap.data().links || [];

  const filteredUserLinks = userLinks.filter(link => link.userId !== targetUserId);
  const filteredTargetLinks = targetLinks.filter(link => link.userId !== userId);

  await updateDoc(userRef, { links: filteredUserLinks });
  await updateDoc(targetUserRef, { links: filteredTargetLinks });
};

export const getUserLinks = async (userId: string): Promise<UserLink[]> => {
  const userRef = doc(db, "Users", userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) throw new Error("User not found");

  return userSnap.data().links || [];
};

export const getUsers = async (): Promise<UserType[]> => {
  try {
    const usersRef = collection(db, "Users");
    const usersQuery = query(usersRef, limit(10)); // Limite à 10 utilisateurs
    const querySnapshot = await getDocs(usersQuery);

    const users: UserType[] = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as UserType[];

    return users;
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs :", error);
    return [];
  }
};


