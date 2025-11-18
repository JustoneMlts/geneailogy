import { COLLECTIONS } from "@/lib/firebase/collections";
import { db } from "@/lib/firebase/firebase";
import { addDocumentToCollection, getAllDataFromCollection, getDataFromCollection, updateDocumentToCollection } from "@/lib/firebase/firebase-functions";
import { FeedPostType, Links } from "@/lib/firebase/models";
import { addDoc, arrayRemove, arrayUnion, collection, doc, documentId, getDocs, onSnapshot, or, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";
import { store } from "@/lib/redux/store";
import { reconcileUserListeners, unsubscribeAllUsers } from "@/lib/listeners/useLiveManager";

export const createFeedPost = async (postData: FeedPostType) => {
  try {
    const collectionRef = collection(db, "Feed");
    const docRef = await addDoc(collectionRef, {}); // crée un doc vide pour récupérer l’ID

    // On met à jour l'objet avec l'id et on nettoie les undefined
    const dataToSave: FeedPostType = {
      ...postData,
      id: docRef.id,
    };

    // Supprime les champs undefined pour Firestore
    Object.keys(dataToSave).forEach(
      (key) =>
        (dataToSave[key as keyof typeof dataToSave] === undefined ||
          dataToSave[key as keyof typeof dataToSave] === null) &&
        delete dataToSave[key as keyof typeof dataToSave]
    );

    await setDoc(docRef, dataToSave); // safe
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
  console.log("Updating post:", postId, postData);
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

export const listenPostsByUserIds = (
  userIds: string[],
  callback: (posts: FeedPostType[]) => void
) => {
  if (!userIds || userIds.length === 0) {
    callback([]);
    return () => {};
  }

  // Firestore impose max 10 IDs par requête "in"
  const chunks: string[][] = [];
  for (let i = 0; i < userIds.length; i += 10) {
    chunks.push(userIds.slice(i, i + 10));
  }

  const postsMap = new Map<number, FeedPostType[]>();

  const unsubscribes = chunks.map((idsChunk, chunkIndex) => {
    const q = query(
      collection(db, COLLECTIONS.FEED),
      where("authorId", "in", idsChunk)
    );

    return onSnapshot(q, (snapshot) => {
      const posts: FeedPostType[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as FeedPostType)
      }));

      postsMap.set(chunkIndex, posts);

      // Fusion de tous les chunks
      const allPosts = Array.from(postsMap.values())
        .flat()
        .sort((a, b) => b.createdAt - a.createdAt);

      callback(allPosts);
    });
  });

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