// src/hooks/useFeedWithLiveAuthors.ts
import { useEffect, useRef, useState } from "react";
import { listenPostsByUserIds } from "@/app/controllers/feedController"; 
import { reconcileUserListeners, unsubscribeAllUsers } from "@/lib/listeners/useLiveManager";
import type { FeedPostType } from "@/lib/firebase/models";

/**
 * usage:
 * const { posts, loading } = useFeedWithLiveAuthors(followedUserIds);
 */
export function useFeedWithLiveAuthors(userIdsToListen: string[]) {
  const [posts, setPosts] = useState<FeedPostType[]>([]);
  const postsUnsubRef = useRef<() => void | null>(null);

  useEffect(() => {
    if (!userIdsToListen || userIdsToListen.length === 0) {
      setPosts([]);
      // detach any user listeners
      reconcileUserListeners([]);
      return;
    }

    // 1) start listening posts (ton code)
    if (postsUnsubRef.current) {
      postsUnsubRef.current();
      postsUnsubRef.current = null;
    }

    postsUnsubRef.current = listenPostsByUserIds(userIdsToListen, (fetchedPosts: FeedPostType[]) => {
      setPosts(fetchedPosts);

      // extract unique author ids from posts
      const authorIds = Array.from(new Set(fetchedPosts.map((p) => p.authorId).filter(Boolean)));
      // reuse reconcile to subscribe to only these users
      reconcileUserListeners(authorIds);
    });

    return () => {
      // cleanup both posts and users listeners
      if (postsUnsubRef.current) postsUnsubRef.current();
      postsUnsubRef.current = null;
      reconcileUserListeners([]); // detaches all user listeners relevant to feed
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(userIdsToListen)]);

  return { posts };
}
