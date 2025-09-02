import { COLLECTIONS } from "@/lib/firebase/collections";
import { db } from "@/lib/firebase/firebase";
import { addDocumentToCollection, getAllDataFromCollection, getDataFromCollection, updateDocumentToCollection } from "@/lib/firebase/firebase-functions";
import { FeedPostType } from "@/lib/firebase/models";
import { addDoc, collection, getDocs, or, query, serverTimestamp, where } from "firebase/firestore";

export const createFeedPost = async (postData: FeedPostType) => {
   try {
    const dataToSave: FeedPostType = {
      ...postData,
      createdAt: Date.now(), // Timestamp généré côté serveur
      comments: [],
      likesIds: [],
    };

    const docRef = await addDoc(collection(db, "Feed"), dataToSave);
    console.log("Post créé avec l'ID :", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Erreur lors de la création du post :", error);
    throw error;
  }
};

export const getFeedPosts = async () => {
  return await getAllDataFromCollection(COLLECTIONS.FEED);
};

export const getFeedPostById = async (postId: string) => {
  return await getDataFromCollection(COLLECTIONS.FEED, postId);
};

export const updateFeedPost = async (postId: string, postData: any) => {
  try {
    await updateDocumentToCollection(COLLECTIONS.FEED, postId, postData);
  } catch (error) {
    console.log("Error updateFeedPost", error);
  }
};

export const getPostsByUserId = async (userId: string): Promise<FeedPostType[]> => {
  try {
    const q = query(
      collection(db, COLLECTIONS.FEED),
        where("destinator.id", "==", userId)
      );
    const querySnapshot = await getDocs(q);
    
    const posts: FeedPostType[] = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as Omit<FeedPostType, "id">),
    }));
    console.log("back posts : ", posts)
    return posts;
  } catch (error) {
    console.error("Erreur lors de la récupération des posts :", error);
    return [];
  }
};