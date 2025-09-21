import { COLLECTIONS } from "@/lib/firebase/collections";
import { db } from "@/lib/firebase/firebase";
import { addDocumentToCollection, getAllDataFromCollection, getDataFromCollection, updateDocumentToCollection } from "@/lib/firebase/firebase-functions";
import { FeedPostType } from "@/lib/firebase/models";
import { addDoc, arrayRemove, arrayUnion, collection, doc, getDocs, onSnapshot, or, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";

export const createFeedPost = async (postData: FeedPostType) => {
  try {
    const collectionRef = collection(db, "Feed");
    const docRef = await addDoc(collectionRef, {}); // crée un doc vide pour récupérer l’ID
    const dataToSave: FeedPostType = {
      ...postData,
      id: docRef.id, // 🔑 on ajoute l’ID généré
      createdAt: Date.now(),
      comments: [],
      likesIds: [],
    };

    await setDoc(docRef, dataToSave); // on écrase le doc vide avec les vraies données

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
    return posts;
  } catch (error) {
    console.error("Erreur lors de la récupération des posts :", error);
    return [];
  }
};

export const getPostsByUserIds = async (userIds: string[]): Promise<FeedPostType[]> => {
  try {
    if (userIds.length === 0) return [];

    // Firestore: limiter à 10 max
    const chunks: string[][] = [];
    for (let i = 0; i < userIds.length; i += 10) {
      chunks.push(userIds.slice(i, i + 10));
    }

    const posts: FeedPostType[] = [];

    for (const chunk of chunks) {
      const q = query(
        collection(db, COLLECTIONS.FEED),
        where("destinator.id", "in", chunk)
      );
      const querySnapshot = await getDocs(q);
      querySnapshot.docs.forEach((doc) => {
        posts.push({ id: doc.id, ...(doc.data() as Omit<FeedPostType, "id">) });
      });
    }

    // Trier par date de création
    posts.sort((a, b) => b.createdAt - a.createdAt);

    return posts;
  } catch (error) {
    console.error("Erreur lors de la récupération des posts :", error);
    return [];
  }
};


export const listenPostsByUserIds = (userIds: string[], callback: (posts: FeedPostType[]) => void) => {
  const q = query(
    collection(db, "Feed"),
    where("author.id", "in", userIds) // on récupère seulement les posts des IDs donnés
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const posts: FeedPostType[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as FeedPostType));
    // Tri décroissant par date
    posts.sort((a, b) => b.createdAt - a.createdAt);
    callback(posts);
  });

  return unsubscribe;
};

/** Ajoute ou retire un like */
export const toggleLikePost = async (postId: string, userId: string, liked: boolean) => {
  const postRef = doc(db, "Feed", postId);
  await updateDoc(postRef, {
    likesIds: liked ? arrayRemove(userId) : arrayUnion(userId),
  });
};

/** Ajoute un commentaire */
export const addCommentToPost = async (
  postId: string,
  comment: { author: { name: string; avatar: string }; content: string; timeAgo: string }
) => {
  console.log("postId : ", postId)
  const postRef = doc(db, "Feed", postId);
  await updateDoc(postRef, {
    comments: arrayUnion(comment), // ✅ conserve les anciens commentaires
  });
};