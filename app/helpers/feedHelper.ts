import { CommentDisplayType } from "@/lib/firebase/models";

export const getLikeCount = (likesId: string[] = []): number => {
  return likesId.length;
};

export const getCommentsCount = (comments: CommentDisplayType[] = []): number => {
  return comments.length;
};