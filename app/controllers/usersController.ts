import { addDocumentToCollection, getAllDataFromCollectionWithWhereArray, updateDocumentToCollection } from "@/lib/firebase/firebase-functions";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { addDoc, arrayRemove, arrayUnion, collection, deleteDoc, deleteField, doc, getDoc, getDocs, limit, query, setDoc, updateDoc, where } from "firebase/firestore";
import { db, storage } from "@/lib/firebase/firebase";
import { Links, LinkStatus, MemberType, TreeType, UserLink, UserType } from "@/lib/firebase/models";
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
  uid,
  avatarUrl
}: {
  email: string;
  firstName: string;
  lastName: string;
  uid: string;
  avatarUrl?: string;
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
      avatarUrl: avatarUrl ? avatarUrl : "",
      bio: "",
      phoneNumber: "",
      localisation: "",
      oldestAncestor: "",
      familyOrigin: "",
      researchInterests: "",
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

export const syncUserToMember = async (userId: string) => {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return;

    const user = userSnap.data() as UserType;

    // Construire les champs à synchroniser
    const syncedData: Partial<MemberType> = {
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatarUrl || "",
      bio: user.bio || "",
      nationality: user.nationality,
      updatedDate: Date.now(),
    };

    // 🔹 Filtrer les undefined avant updateDoc
    const cleanData = Object.fromEntries(
      Object.entries(syncedData).filter(([_, v]) => v !== undefined)
    );

    const memberRef = doc(db, COLLECTIONS.MEMBERS, userId);
    const memberSnap = await getDoc(memberRef);

    if (!memberSnap.exists()) {
      console.warn(`⚠️ Aucun member trouvé pour ${userId}`);
      return;
    }

    await updateDoc(memberRef, cleanData);

    console.log(`✅ Member synchronisé avec le User ${userId}`);
  } catch (error) {
    console.error("❌ Erreur syncUserToMember:", error);
  }
};

export const updateUser = async (user: UserType & { id: string }): Promise<boolean> => {
  try {
    if (!user.id) throw new Error("Aucun ID fourni.");

    const userRef = doc(db, COLLECTIONS.USERS, user.id);
    const { id, ...userData } = user;

    const updateData: Record<string, any> = { updatedDate: Date.now() };
    Object.entries(userData).forEach(([k, v]) => {
      if (v !== undefined) updateData[k] = v;
    });

    await updateDoc(userRef, updateData);

    // 🔹 Synchroniser automatiquement le Member
    await syncUserToMember(user.id);

    return true;
  } catch (err) {
    console.error("Erreur updateUser:", err);
    return false;
  }
};

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
  console.log("getUsersByIds called with:", userIds)
  if (userIds.length === 0) return []

  const q = query(collection(db, "Users"), where("id", "in", userIds))
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

export const getUsersByFriendsIds = async (friendsIds: string[]): Promise<UserType[]> => {
  console.log("getUsersByFriendsIds called with:", friendsIds);
  if (!friendsIds || friendsIds.length === 0) return [];

  const users: UserType[] = [];

  for (const friendId of friendsIds) {
    const user = await getUserById(friendId);
    if (user) users.push(user);
  }

  console.log("getUsersByFriendsIds result:", users);
  return users;
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

export const sendConnectionRequest = async (
  senderId: string,
  receiverId: string,
  senderFirstName: string,
  senderLastName: string,
  senderAvatar?: string
) => {
  try {
    // Créer un nouveau document dans la collection Links
    const linksCollection = collection(db, COLLECTIONS.LINKS);

    const newLink: Omit<Links, 'linkId'> = {
      senderId,
      receiverId,
      status: "pending",
      createdDate: Date.now(),
      updatedDate: Date.now(),
    };

    // ⚠️ CORRECTION : Un seul addDoc au lieu de deux
    const linkDocRef = await addDoc(linksCollection, newLink);

    // Créer la notification
    const senderName = `${senderFirstName} ${senderLastName}`;
    await createNotification({
      recipientId: receiverId,
      senderId,
      senderName,
      senderAvatarUrl: senderAvatar || "",
      type: "connection",
      title: "Demande de connexion",
      message: `${senderName} veut t'ajouter en ami !`,
    });

    return { ...newLink, linkId: linkDocRef.id };
  } catch (error) {
    console.error("Erreur lors de l'envoi de la demande :", error);
    throw error;
  }
};

export const updateConnectionStatus = async (
  linkId: string,
  status: LinkStatus,
  receiverFirstName: string,
  receiverLastName: string,
  receiverAvatar?: string
) => {
  try {
    const linkRef = doc(db, COLLECTIONS.LINKS, linkId);
    const linkDoc = await getDoc(linkRef);

    if (!linkDoc.exists()) {
      throw new Error("Le lien n'existe pas");
    }

    const linkData = linkDoc.data() as Links;
    const { senderId, receiverId } = linkData;

    // Mettre à jour le statut du lien
    await updateDoc(linkRef, {
      status,
      updatedDate: Date.now()
    });

    // Si accepté, ajouter le linkId dans le tableau friends des deux utilisateurs
    if (status === "accepted") {
      const senderRef = doc(db, COLLECTIONS.USERS, senderId);
      const receiverRef = doc(db, COLLECTIONS.USERS, receiverId);

      await Promise.all([
        updateDoc(senderRef, {
          friends: arrayUnion(receiverId)
        }),
        updateDoc(receiverRef, {
          friends: arrayUnion(senderId)
        })
      ]);

      // Créer une notification d'acceptation
      const receiverName = `${receiverFirstName} ${receiverLastName}`;
      await createNotification({
        recipientId: senderId,
        senderId: receiverId,
        senderName: receiverName,
        senderAvatarUrl: receiverAvatar || "",
        type: "connection",
        title: "Connexion acceptée",
        message: `${receiverName} a accepté votre demande !`,
      });
    }

    return { linkId, status };
  } catch (error) {
    console.error("Erreur lors de la mise à jour du statut :", error);
    throw error;
  }
};

export const cancelConnectionRequest = async (linkId: string) => {
  try {
    const linkRef = doc(db, COLLECTIONS.LINKS, linkId);
    const linkDoc = await getDoc(linkRef);

    if (!linkDoc.exists()) {
      throw new Error("Le lien n'existe pas");
    }

    const linkData = linkDoc.data() as Links;

    // Vérifier que le statut est bien "pending"
    if (linkData.status !== "pending") {
      throw new Error("Seules les demandes en attente peuvent être annulées");
    }

    // Supprimer le document de la collection Links
    await deleteDoc(linkRef);
  } catch (error) {
    console.error("Erreur lors de l'annulation :", error);
    throw error;
  }
};

export const deleteConnection = async (linkId: string) => {
  try {
    const linkRef = doc(db, COLLECTIONS.LINKS, linkId);
    const linkDoc = await getDoc(linkRef);

    if (!linkDoc.exists()) {
      throw new Error("Le lien n'existe pas");
    }

    const linkData = linkDoc.data() as Links;
    const { senderId, receiverId } = linkData;

    // Supprimer le linkId du tableau friends des deux utilisateurs
    const senderRef = doc(db, COLLECTIONS.USERS, senderId);
    const receiverRef = doc(db, COLLECTIONS.USERS, receiverId);

    await Promise.all([
      updateDoc(senderRef, {
        friends: arrayRemove(linkId)
      }),
      updateDoc(receiverRef, {
        friends: arrayRemove(linkId)
      })
    ]);

    // Supprimer le document de la collection Links
    await deleteDoc(linkRef);
  } catch (error) {
    console.error("Erreur lors de la suppression :", error);
    throw error;
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

// Ajouter cette fonction pour mettre à jour les conversationsIds
export const addConversationToUser = async (userId: string, conversationId: string) => {
  try {
    const userRef = doc(db, "Users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      console.error("Utilisateur non trouvé");
      return;
    }

    const currentConversations = userSnap.data()?.conversationsIds || [];

    // Éviter les doublons
    if (!currentConversations.includes(conversationId)) {
      await updateDoc(userRef, {
        conversationsIds: [...currentConversations, conversationId],
      });
    }
  } catch (error) {
    console.error("Erreur lors de la mise à jour des conversations:", error);
  }
};

export const deleteFriendship = async (
  linkId: string,
  currentUserId: string,
  otherUserId: string
): Promise<void> => {
  try {
    // 1️⃣ Supprimer mutuellement les IDs du tableau friends
    const currentUserRef = doc(db, "Users", currentUserId)
    const otherUserRef = doc(db, "Users", otherUserId)

    await Promise.all([
      updateDoc(currentUserRef, {
        friends: arrayRemove(otherUserId),
      }),
      updateDoc(otherUserRef, {
        friends: arrayRemove(currentUserId),
      }),
    ])

    // 2️⃣ Supprimer le document Links
    const linkRef = doc(db, "Links", linkId)
    await deleteDoc(linkRef)

    console.log(`✅ Amitié supprimée: ${linkId}`)
  } catch (error) {
    console.error("❌ Erreur lors de la suppression de l'amitié:", error)
    throw error
  }
}