import { addDocumentToCollection, getAllDataFromCollectionWithWhereArray, updateDocumentToCollection } from "@/lib/firebase/firebase-functions";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { arrayUnion, collection, deleteField, doc, getDoc, getDocs, limit, query, setDoc, updateDoc, where } from "firebase/firestore";
import { db, storage  } from "@/lib/firebase/firebase";
import { LinkStatus, MemberType, TreeType, UserLink, UserType } from "@/lib/firebase/models";
import { createOrReplaceAvatar } from "./filesController";
import { createNotification } from "./notificationsController"
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { addMember } from "./membersController";
import { createTree } from "./treesController";

const removeUndefinedValues = (obj: any): any => {
  const cleaned: any = {};

  Object.keys(obj).forEach(key => {
    const value = obj[key];

    if (value !== undefined) {
      // Nettoyage récursif pour les objets imbriqués
      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        const cleanedNested = removeUndefinedValues(value);
        if (Object.keys(cleanedNested).length > 0) {
          cleaned[key] = cleanedNested;
        }
      } else {
        cleaned[key] = value;
      }
    }
  });

  return cleaned;
};

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
    // 1. Créer les données utilisateur selon UserType
    let userData: Omit<UserType, 'id'> = {
      email,
      firstName,
      lastName,
      firstNameLower: firstName.toLocaleLowerCase(),
      lastNameLower: lastName.toLocaleLowerCase(),
      birthDate: undefined,
      nationality: undefined,
      avatarUrl: "",
      bio: "",
      phoneNumber: "",
      localisation: "",
      oldestAncestor: "",
      familyOrigin: "",
      researchInterests: "",
      links: [],
      treesIds: [],
      createdDate: Date.now(),
      updatedDate: Date.now(),
      isActive: true,
    };

    userData = removeUndefinedValues(userData); // Supprime tous les undefined

    // 2. Créer l'utilisateur avec son id
    await setDoc(doc(db, COLLECTIONS.USERS, uid), userData);

    // 3. Créer une famille pour cet utilisateur
    let treeData: Omit<TreeType, 'id'> = {
      name: `Famille ${lastName}`,
      description: `Arbre généalogique de la famille ${lastName}`,
      ownerId: uid,
      memberIds: [uid],
      origin: [],
      createdDate: Date.now(),
      updatedDate: Date.now(),
      isActive: true,
    };

    treeData = removeUndefinedValues(treeData);

    const familyId = await createTree(treeData);

    // 4. Créer un membre dans cette famille avec le même id que le User
    let memberData: Omit<MemberType, 'id'> = {
      firstName,
      lastName,
      birthDate: undefined,
      deathDate: undefined,
      birthPlace: undefined,
      gender: undefined,
      avatar: "",
      bio: "",
      nationality: undefined,
      treeId: familyId,
      mariageId: undefined,
      isMarried: false,
      parentsIds: [],
      childrenIds: [],
      brothersIds: [],
      createdDate: Date.now(),
      updatedDate: Date.now(),
      isActive: true,
    };

    memberData = removeUndefinedValues(memberData);

    // 🔹 Ici on force le member.id à être le même que uid
    await addMember(memberData, uid);

    return { userId: uid, familyId };
  } catch (error) {
    console.log("Error createUser", error);
    throw error;
  }
};

export const updateUser = async (user: UserType): Promise<boolean> => {
  try {
    if (!user.id) throw new Error("Aucun ID fourni.")

    const userRef = doc(db, "Users", user.id)
    const { id, ...userData } = user

    const updateData: Record<string, any> = { updatedDate: Date.now() }
    Object.entries(userData).forEach(([k, v]) => {
      if (v !== undefined) updateData[k] = v
    })

    await updateDoc(userRef, updateData)
    return true
  } catch (err) {
    console.error("Erreur updateUser:", err)
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

export const getUsersByIds = async (userIds: string[]): Promise<UserType[]> => {
  if (userIds.length === 0) return []

  const q = query(collection(db, "users"), where("id", "in", userIds))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => doc.data() as UserType)
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

export const updateUserAvatar = async (file: File, userId: string): Promise<string | null> => {
  try {
    const storageRef = ref(storage, `avatars/${userId}`)
    await uploadBytes(storageRef, file)
    const url = await getDownloadURL(storageRef)

    const userRef = doc(db, "Users", userId)
    await updateDoc(userRef, { avatarUrl: url, updatedDate: Date.now() })

    return url
  } catch (err) {
    console.error("Erreur updateUserAvatar:", err)
    return null
  }
}

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

export const sendConnectionRequest = async (senderId: string, receiverId: string, senderFirstName: string, senderLastName: string, senderAvatar?: string) => {
  try {
    const senderRef = doc(db, COLLECTIONS.USERS, senderId);
    const receiverRef = doc(db, COLLECTIONS.USERS, receiverId);

    const senderLink: UserLink = { userId: receiverId, status: "pending", senderId };
    const receiverLink: UserLink = { userId: senderId, status: "pending", senderId };

    await updateDoc(senderRef, { [`links.${receiverId}`]: senderLink });
    await updateDoc(receiverRef, { [`links.${senderId}`]: receiverLink });

    const senderName = senderFirstName + " " + senderLastName;
    if (senderAvatar !== "") {
      await createNotification({
        recipientId: receiverId,
        senderId: senderId,
        senderName: senderName,
        senderAvatarUrl: senderAvatar,
        type: "connection",
        title: "Demande de connexion",
        message: `${senderName} veut t'ajouter en ami !`,
      })
    }
    else {
      await createNotification({
        recipientId: receiverId,
        senderId: senderId,
        senderName: senderName,
        type: "connection",
        title: "Demande de connexion",
        message: `${senderName} veut t'ajouter en ami !`,
      })
    }

    return receiverLink;
  } catch (error) {
    console.error("Erreur lors de l'envoi de la demande :", error);
    throw error;
  }
};

// Accepter/refuser une demande (récepteur)
export const updateConnectionStatus = async (senderId: string, receiverId: string, status: string, senderFirstName: string, senderLastName: string, senderAvatar?: string) => {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, receiverId);
    const senderRef = doc(db, COLLECTIONS.USERS, senderId);

    // Mise à jour du lien côté receiver
    await updateDoc(userRef, { [`links.${senderId}.status`]: status });

    // Si accepté, mise à jour côté sender pour symétrie
    if (status === "accepted") {
      await updateDoc(senderRef, { [`links.${receiverId}.status`]: status });
      const senderName = senderFirstName + " " + senderLastName;
      if (senderAvatar !== "") {
        await createNotification({
          recipientId: receiverId,
          senderId: senderId,
          senderName: senderName,
          senderAvatarUrl: senderAvatar,
          type: "connection",
          title: "Acceptation de connexion",
          message: `${senderName} à accepter ta demande !`,
        })
      }
      else {
        await createNotification({
          recipientId: receiverId,
          senderId: senderId,
          senderName: senderName,
          type: "connection",
          title: "Demande de connexion",
          message: `${senderName} à accepter ta demande !`,
        })
      }
    }
  } catch (error) {
    console.error("Erreur lors de la mise à jour du statut :", error);
    throw error;
  }
};

// Annuler une demande (uniquement par l'expéditeur)
export const cancelConnectionRequest = async (senderId: string, receiverId: string) => {
  try {
    const senderRef = doc(db, COLLECTIONS.USERS, senderId);
    const receiverRef = doc(db, COLLECTIONS.USERS, receiverId);

    await Promise.all([
      updateDoc(senderRef, { [`links.${receiverId}`]: deleteField() }),
      updateDoc(receiverRef, { [`links.${senderId}`]: deleteField() }),
    ]);
  } catch (error) {
    console.error("Erreur lors de l'annulation :", error);
    throw error;
  }
};

// Supprimer un ami
export const deleteConnection = async (userId1: string, userId2: string) => {
  try {
    const user1Ref = doc(db, COLLECTIONS.USERS, userId1);
    const user2Ref = doc(db, COLLECTIONS.USERS, userId2);

    await Promise.all([
      updateDoc(user1Ref, { [`links.${userId2}`]: deleteField() }),
      updateDoc(user2Ref, { [`links.${userId1}`]: deleteField() }),
    ]);
  } catch (error) {
    console.error("Erreur lors de la suppression :", error);
    throw error;
  }
};

// Récupérer toutes les connexions
export const getConnexionsByUserId = async (userId: string): Promise<UserLink[]> => {
  try {
    const userSnap = await getDoc(doc(db, COLLECTIONS.USERS, userId));
    if (!userSnap.exists()) return [];

    const userData = userSnap.data() as UserType;
    return Object.values(userData.links || {}) as UserLink[];
  } catch (error) {
    console.error("Erreur lors de la récupération des connexions :", error);
    return [];
  }
};

const getUserDisplayName = async (userId: string): Promise<string> => {
  try {
    const userSnap = await getDoc(doc(db, COLLECTIONS.USERS, userId));
    if (userSnap.exists()) {
      const userData = userSnap.data() as UserType;
      return userData.firstName + ' ' + userData.lastName || "Utilisateur";
    }
    return "Utilisateur";
  } catch (error) {
    console.error("Erreur lors de la récupération du nom utilisateur :", error);
    return "Utilisateur";
  }
};

export const findUserByInfo = async (
  firstName: string,
  lastName: string,
  birthDate: number
): Promise<UserType | null> => {
  try {
    const usersRef = collection(db, COLLECTIONS.USERS);

    const q = query(
      usersRef,
      where("firstName", "==", firstName),
      where("lastName", "==", lastName),
      where("birthDate", "==", birthDate)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    const docSnap = snapshot.docs[0];
    return { id: docSnap.id, ...docSnap.data() } as UserType;
  } catch (error) {
    console.error("❌ Erreur findUserByInfo:", error);
    return null;
  }
};