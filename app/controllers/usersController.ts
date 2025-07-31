import { addDocumentToCollection, getAllDataFromCollectionWithWhereArray, updateDocumentToCollection } from "@/lib/firebase/firebase-functions";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { collection, doc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { UserType } from "@/lib/firebase/models";

export const createUser = async ({ email, firstName, lastName, uid }: { email: string, firstName: string, lastName: string, uid: string }) => {
    try {
        await addDocumentToCollection(COLLECTIONS.USERS, { 
          email: email, 
          firstName: firstName, 
          lastName: lastName, 
          uid: uid,  
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
          isActive: true 
        });
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

export const updateUserAvatar = async (userId: string, avatarUrl: string) => {
  try {
    await updateDocumentToCollection(COLLECTIONS.USERS, userId, {
      avatarUrl,
      updatedDate: Date.now(),
    });
  } catch (error) {
    console.error("❌ Error updating avatar:", error);
  }
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

