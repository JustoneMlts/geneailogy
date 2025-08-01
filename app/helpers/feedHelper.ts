import { CommentType } from "@/lib/firebase/models";

export const getLikeCount = (likesId: string[] = []): number => {
  return likesId.length;
};

export const getCommentsCount = (comments: CommentType[] = []): number => {
  return comments.length;
};