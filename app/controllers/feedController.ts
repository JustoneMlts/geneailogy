import { COLLECTIONS } from "@/lib/firebase/collections";
import { db } from "@/lib/firebase/firebase";
import { addDocumentToCollection, getAllDataFromCollection, getDataFromCollection, updateDocumentToCollection } from "@/lib/firebase/firebase-functions";
import { FeedPostType, Links } from "@/lib/firebase/models";
import { addDoc, arrayRemove, arrayUnion, collection, doc, documentId, getDocs, onSnapshot, or, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";

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
    console.error("Erreur lors de la mise à jour du post :", error);
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

export const getUserIdsFromLinkIds = async (
  linkIds: string[],
  currentUserId: string
): Promise<string[]> => {
  if (!linkIds || linkIds.length === 0) return [];

  try {
    // Firestore limite les "in" queries à 30 éléments
    // On découpe en chunks de 30
    const chunks: string[][] = [];
    for (let i = 0; i < linkIds.length; i += 30) {
      chunks.push(linkIds.slice(i, i + 30));
    }

    const allUserIds = new Set<string>();

    for (const chunk of chunks) {
      const q = query(
        collection(db, COLLECTIONS.LINKS),
        where(documentId(), "in", chunk)
      );

      const snapshot = await getDocs(q);
      
      snapshot.forEach(doc => {
        const link = doc.data() as Links;
        // Ajouter l'autre utilisateur (pas moi)
        if (link.senderId === currentUserId) {
          allUserIds.add(link.receiverId);
        } else {
          allUserIds.add(link.senderId);
        }
      });
    }

    return Array.from(allUserIds);
  } catch (error) {
    console.error("Erreur getUserIdsFromLinkIds:", error);
    return [];
  }
};

/**
 * Écoute en temps réel les posts des utilisateurs spécifiés
 */
export const listenPostsByUserIds = (
  userIds: string[],
  callback: (posts: FeedPostType[]) => void
) => {
  if (!userIds || userIds.length === 0) {
    callback([]);
    return () => {};
  }

  // Firestore limite les "in" queries à 30 éléments maximum
  // On découpe en chunks de 10 pour être sûr
  const chunks: string[][] = [];
  for (let i = 0; i < userIds.length; i += 10) {
    chunks.push(userIds.slice(i, i + 10));
  }

  // Map pour stocker les posts par chunk
  const postsMap = new Map<number, FeedPostType[]>();

  const unsubscribes = chunks.map((idsChunk, chunkIndex) => {
    const q = query(
      collection(db, COLLECTIONS.FEED),
      where("author.id", "in", idsChunk)
    );

    return onSnapshot(q, (snapshot) => {
      const posts: FeedPostType[] = snapshot.docs.map(
        (doc) => ({
          id: doc.id,
          ...doc.data(),
        } as FeedPostType)
      );

      // Stocke les posts de CE chunk
      postsMap.set(chunkIndex, posts);

      // Fusionne tous les chunks et trie par date
      const allPosts = Array.from(postsMap.values())
        .flat()
        .sort((a, b) => b.createdAt - a.createdAt);

      callback(allPosts);
    });
  });

  // Retourne une fonction pour se désabonner de tous les listeners
  return () => unsubscribes.forEach((unsub) => unsub());
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
  const postRef = doc(db, "Feed", postId);
  await updateDoc(postRef, {
    comments: arrayUnion(comment), 
  });
};