import { COLLECTIONS } from "@/lib/firebase/collections";
import { addDocumentToCollection, getAllDataFromCollection, getDataFromCollection, updateDocumentToCollection } from "@/lib/firebase/firebase-functions";

export const createFeedPost = async (postData: any) => {
  try {
    await addDocumentToCollection(COLLECTIONS.FEED, postData);
  } catch (error) {
    console.log("Error createFeedPost", error);
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
