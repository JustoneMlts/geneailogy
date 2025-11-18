import { addCommentToPost, toggleLikePost, deleteFeedPost } from "@/app/controllers/feedController";
import { handleGetUserNameInitials } from "@/app/helpers/userHelper";
import { selectUser } from "@/lib/redux/slices/currentUserSlice";
import { Globe, Users, MoreHorizontal, MapPin, Heart, MessageCircle, Share2, Send, Lock, FileText, Edit, Delete } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useSelector } from "react-redux";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createNotification } from "@/app/controllers/notificationsController";
import { FeedPostType, UserType } from "@/lib/firebase/models";
import { selectLiveUserById } from "@/lib/redux/slices/usersLiveSlice";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { selectFriends } from "@/lib/redux/slices/friendsSlice";
import { CreatePostCard } from "./createPostCard";


export function PostCard({ post }: { post: FeedPostType }) {
  const currentUser = useSelector(selectUser);
  const dispatch = useAppDispatch();
  const friends = useAppSelector(selectFriends);

  const [liked, setLiked] = useState(post.likesIds.includes(currentUser?.id || ""));
  const [likeCount, setLikeCount] = useState(post.likesIds.length);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [openMenu, setOpenMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPost, setCurrentPost] = useState<FeedPostType>(post);

  const router = useRouter();

  useEffect(() => {
    setCurrentPost(post);
  }, [post]);

  const getAuthor = (authorId : string) => {
    if (currentUser?.id === authorId) return currentUser;
    return friends.find((friend: UserType) => friend.id === authorId);
  }
  
  const handleLike = async (post: FeedPostType) => {
    if (!currentUser?.id) return;
    const author = getAuthor(post.authorId);
    const alreadyLiked = post.likesIds.includes(currentUser.id);
    setLiked(!alreadyLiked);
    setLikeCount(alreadyLiked ? likeCount - 1 : likeCount + 1);

    if (author.id !== currentUser.id) {
      await createNotification({
        recipientId: author.id,
        senderId: currentUser.id,
        senderName: `${currentUser.firstName} ${currentUser.lastName}`,
        senderAvatarUrl: currentUser.avatarUrl ?? "",
        type: "like",
        message: `${currentUser.firstName} ${currentUser.lastName} a aimé votre publication.`,
        relatedId: post.id,
        title: "Vous avez reçu un like",
      });
    }

    toggleLikePost(post.id!, currentUser.id, alreadyLiked);
  };

  const handleComment = async (post: FeedPostType) => {
    if (!currentUser) return;
    const content = newComment.trim();
    if (!content) return;
    const author = getAuthor(post.authorId);

    await addCommentToPost(post.id!, {
      author: {
        name: `${currentUser.firstName} ${currentUser.lastName}`,
        avatar: currentUser.avatarUrl || "/placeholder.svg",
      },
      content,
      timeAgo: "À l'instant",
    });

    if (author.id !== currentUser.id) {
      await createNotification({
        recipientId: author.id,
        senderId: currentUser.id,
        senderName: `${currentUser.firstName} ${currentUser.lastName}`,
        senderAvatarUrl: currentUser.avatarUrl ?? "",
        type: "comment",
        message: content,
        relatedId: post.id,
        title: `${currentUser.firstName} ${currentUser.lastName} a commenté votre publication`,
      });
    }

    setNewComment("");
  };

  const handleNavigate = (userId: string) => {
    router.push(`/wall/${userId}`);
  };

  const handleOpenMenu = () => {
    setOpenMenu(!openMenu);
  }

  const handleEdit = () => {
    setIsEditing(true);
    setOpenMenu(false);
  };

  const handleDelete = async (currentPost: FeedPostType) => {    
    if (!currentPost.id) return;
    try {
      await deleteFeedPost(currentPost.id);
      // Optionally, you can add some UI feedback here, like removing the post from the feed
    } catch (error) {
      console.error("Erreur lors de la suppression du post :", error);
    }
  };

  const handlePostCreated = () => {
    setIsEditing(false);
  }

  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (!target.closest('.relative')) {
      setOpenMenu(false);
    }
  };

  useEffect(() => {
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  return (
    <Card className="mb-4 sm:mb-6 transition-shadow hover:shadow-lg">
      <CardContent className="p-0">
        {/* Header */}
        <div className="p-3 sm:p-4 lg:p-6 pb-2 sm:pb-3 lg:pb-4">
          <div className="flex items-start justify-between">
            <div className="flex space-x-2 sm:space-x-3 min-w-0 flex-1">
              <Avatar
                className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 flex-shrink-0 cursor-pointer"
                onClick={() => handleNavigate(getAuthor(currentPost.authorId).id)}
              >
                <AvatarImage src={getAuthor(currentPost.authorId).avatarUrl} />
                <AvatarFallback className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-lg">
                  {getAuthor(currentPost.authorId).initials || handleGetUserNameInitials(getAuthor(currentPost.authorId))}
                </AvatarFallback>
              </Avatar>
             
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2 flex-wrap">
                  <h3
                    className="font-semibold cursor-pointer hover:underline text-gray-900 text-sm sm:text-base truncate"
                    onClick={() => handleNavigate(getAuthor(currentPost.authorId).id)}
                  >
                    {getAuthor(currentPost.authorId).firstName} {getAuthor(currentPost.authorId).lastName}
                  </h3>
                  {getAuthor(currentPost.authorId).verified && <Badge className="bg-blue-100 text-blue-800 text-xs flex-shrink-0">Vérifié</Badge>}
                  {currentPost.isOnWall && <span className="text-gray-500 text-xs sm:text-sm flex-shrink-0">→ sur votre mur</span>}
                </div>
                <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-500 mt-1">
                  <span>{currentPost.timeAgo}</span>
                  <span>•</span>
                  {currentPost.privacy === "public" && <Globe className="w-3 h-3 sm:w-4 sm:h-4" />}
                  {currentPost.privacy === "connections" && <Users className="w-3 h-3 sm:w-4 sm:h-4" />}
                  {currentPost.privacy === "private" && <Lock className="w-3 h-3 sm:w-4 sm:h-4" />}
                </div>
              </div>
            </div>
             {isEditing && (
                <div className="flex items-center">
                  <h3 className="mb-3 p-2 bg-blue-50 rounded-lg text-sm text-blue-700">Modification du post</h3>
                </div>
              )}
            {currentUser?.id === currentPost.authorId &&
            <div className="relative">
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600 h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0" onClick={handleOpenMenu}>
                <MoreHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
              {openMenu && <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                <button

                  className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  onClick={handleEdit}
                >
                  <Edit className="w-4 h-4 mr-3" />
                  Modifier
                </button>
                <hr className="my-1 border-gray-200" />
                <button
                  className="w-full flex items-center text-red-600 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  onClick={() => handleDelete(currentPost)}
                >
                  <Delete className="w-4 h-4 mr-3 text-red-600" />
                  Supprimer
                </button>
              </div>
              }
            </div>
            }
          </div>         
        </div>

        {!isEditing ? (
          <>
            <div className="px-3 sm:px-4 lg:px-6 pb-2 sm:pb-3 lg:pb-4">
              <p className="text-gray-800 leading-relaxed text-sm sm:text-base">{currentPost.content}</p>
              {currentPost.image && <img src={currentPost.image} alt="Post image" className="mt-3 sm:mt-4 rounded-lg w-full object-cover max-h-60" />}
              {currentPost.documentUrl && (
                <div className="mt-3 sm:mt-4 w-1/3 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2">
                    <div className="flex items-center space-x-2 truncate">
                      <FileText className="w-4 h-4 text-gray-600 flex-shrink-0" />
                      <a href={currentPost.documentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 over:underline text-sm font-medium truncate">
                        {currentPost.documentName || "Voir le document"}
                      </a>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => window.open(currentPost.documentUrl, "_blank")} className="text-gray-600 hover:text-blue-600 flex-shrink-0">Ouvrir</Button>
                  </div>
                </div>
              )}
              {currentPost.location && (
                <div className="flex items-center space-x-2 mt-2 sm:mt-3 text-gray-600">
                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="text-xs sm:text-sm truncate">{currentPost.location}</span>
                </div>
              )}
            </div>

            {/* Stats */}
            {(likeCount > 0 || currentPost.comments.length > 0) && (
              <div className="px-3 sm:px-4 lg:px-6 pb-2 sm:pb-3">
                <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500">
                  {likeCount > 0 && <span>{likeCount} j'aime</span>}
                  {currentPost.comments.length > 0 && <span>{currentPost.comments.length} commentaire{currentPost.comments.length > 1 ? "s" : ""}</span>}
                </div>
              </div>
            )}

            <Separator />

            {/* Actions */}
            <div className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 flex space-x-1">
              <Button variant="ghost" size="sm" onClick={() => handleLike(currentPost)} className={`flex-1 text-xs sm:text-sm ${liked ? "text-blue-600" : "text-gray-600"}`}>
                <Heart className={`w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 mr-1 sm:mr-2 ${liked ? "fill-current" : ""}`} />J'aime
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowComments(!showComments)} className="flex-1 text-gray-600 text-xs sm:text-sm">
                <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 mr-1 sm:mr-2" />Commenter
              </Button>
              {/* <Button variant="ghost" size="sm" className="flex-1 text-gray-600 text-xs sm:text-sm">
                <Share2 className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 mr-1 sm:mr-2" />Partager
              </Button> */}
            </div>

            {/* Commentaires */}
            {showComments && (
              <>
                <Separator />
                <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 space-y-3 sm:space-y-4">
                  {/* Nouveau commentaire */}
                  <div className="flex space-x-2 sm:space-x-3">
                    <Avatar className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0">
                      <AvatarImage src={currentUser?.avatarUrl || "/placeholder.svg"} />
                      <AvatarFallback className="text-xs">{currentUser && handleGetUserNameInitials(currentUser)}</AvatarFallback>
                    </Avatar>
                    <Input
                      placeholder="Écrivez un commentaire..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="flex-1 text-xs sm:text-sm"
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleComment(currentPost) } }}
                    />
                    <Button size="sm" onClick={() => handleComment(currentPost)} disabled={!newComment.trim()}>
                      <Send className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                  </div>

                  {/* Liste des commentaires */}
                  {currentPost.comments.map((comment, index) => (
                    <div key={index} className="flex space-x-2 sm:space-x-3">
                      <Avatar className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0">
                        <AvatarImage src={comment.author.avatar || "/placeholder.svg"} />
                        <AvatarFallback className="text-xs">{comment.author.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="rounded-lg px-2">
                          <div className="font-semibold text-xs sm:text-sm text-gray-900">{comment.author.name}</div>
                          <p className="text-gray-800 text-xs sm:text-sm break-words">{comment.content}</p>
                        </div>
                        <div className="flex items-center space-x-3 sm:space-x-4 mt-1 text-xs text-gray-500">
                          <span>{comment.timeAgo}</span>
                          <button className="hover:underline">J'aime</button>
                          <button className="hover:underline">Répondre</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="p-4">
            {currentUser &&
              <CreatePostCard user={currentUser} wallOwner={currentUser} post={currentPost} onPostCreated={handlePostCreated} isEditing={isEditing} />
            }
          </div> 
        )}
      </CardContent>
    </Card>
  );
}
