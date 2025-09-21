import { Camera, FileText, Heart, MessageSquare, Share2, TreePine, Send, MessageCircle } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Input } from "./ui/input"
import { useDispatch, useSelector } from "react-redux"
import { selectUser } from "@/lib/redux/slices/currentUserSlice"
import { handleGetUserNameFromPartial, handleGetUserNameInitialsFromPartial, handleGetUserName, handleGetUserNameInitials } from "@/app/helpers/userHelper"
import { useEffect, useState } from "react"
import { addCommentToPost, createFeedPost, toggleLikePost } from "@/app/controllers/feedController"
import { FeedPostType, UserLink } from "@/lib/firebase/models"
import { getCommentsCount, getLikeCount } from "@/app/helpers/feedHelper"
import { setActiveTab } from "@/lib/redux/slices/uiSlice"
import { collection, query, where, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"
import Link from "next/link"
import { Separator } from "./ui/separator"

export const Feed = () => {
  const currentUser = useSelector(selectUser)
  const [postMessage, setPostMessage] = useState<string>("")
  const [posts, setPosts] = useState<FeedPostType[]>([])
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>({});
  const [openComments, setOpenComments] = useState<{ [key: string]: boolean }>({});
  const dispatch = useDispatch()

  // Fonction pour écouter les posts en temps réel
  const listenPostsByUserIds = (userIds: string[], callback: (posts: FeedPostType[]) => void) => {
    if (userIds.length === 0) return () => { }
    const limitedIds = userIds.slice(0, 10) // Firestore limite `in` à 10 éléments

    const q = query(
      collection(db, "Feed"),
      where("author.id", "in", limitedIds)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPosts: FeedPostType[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as FeedPostType))

      // Tri décroissant par date
      fetchedPosts.sort((a, b) => b.createdAt - a.createdAt)
      callback(fetchedPosts)
    })

    return unsubscribe
  }

  // Hook pour récupérer les posts de l'utilisateur et de ses amis
  useEffect(() => {
    if (!currentUser?.id) return

    const linksArray: UserLink[] = Array.isArray(currentUser.links)
      ? currentUser.links
      : Object.values(currentUser.links ?? []) as UserLink[]

    const acceptedConnectionsIds = linksArray
      .filter(link => link.status === "accepted")
      .map(link => link.userId)

    const userIdsToListen = [currentUser.id, ...acceptedConnectionsIds]

    const unsubscribe = listenPostsByUserIds(userIdsToListen, setPosts)

    return () => unsubscribe()
  }, [currentUser])

  useEffect(() => {
    console.log(posts)
  }, [posts])

  // Fonction pour poster
  const handleSubmitInput = async () => {
    if (!currentUser?.id || !postMessage.trim()) return

    const newPost: FeedPostType = {
      author: {
        id: currentUser.id,
        firstName: currentUser.firstName || "",
        lastName: currentUser.lastName || "",
        avatar: currentUser.avatarUrl || "/placeholder.svg",
      },
      destinator: {
        id: currentUser.id,
        firstName: currentUser.firstName || "",
        lastName: currentUser.lastName || "",
        avatar: currentUser.avatarUrl || "/placeholder.svg",
      },
      content: postMessage.trim(),
      image: "",
      createdAt: Date.now(),
      timeAgo: "A l'instant",
      likesIds: [],
      comments: [],
      privacy: "public",
      isOnWall: true,
    }

    try {
      await createFeedPost(newPost)
      setPostMessage("")
      // Le feed sera mis à jour automatiquement grâce à onSnapshot
    } catch (err) {
      console.error("Erreur lors de la création du post :", err)
    }
  }

  const handleToggleLike = (post: FeedPostType) => {
    if (!currentUser?.id) return;
    const alreadyLiked = post.likesIds.includes(currentUser.id);
    toggleLikePost(post.id!, currentUser.id, alreadyLiked);
  };

  // Comment
  const handleAddComment = async (postId: string) => {
    console.log("currentUser", currentUser)

    if (!currentUser) return;
    const content = commentInputs[postId]?.trim();
    console.log("content", content)
    if (!content) return;

    await addCommentToPost(postId, {
      author: {
        name: `${currentUser.firstName} ${currentUser.lastName}`,
        avatar: currentUser.avatarUrl || "/placeholder.svg",
      },
      content,
      timeAgo: "À l'instant",
    });

    // Réinitialise le champ
    setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
  };

  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-bold mb-6 animate-slide-up">Fil d'actualité</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Create Post */}
          <Card className="shadow-md border-0 animate-slide-up animate-stagger-1 card-hover">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <Avatar className="animate-scale-in">
                  <AvatarImage src={currentUser?.avatarUrl} />
                  <AvatarFallback>{currentUser && handleGetUserNameInitials(currentUser)}</AvatarFallback>
                </Avatar>
                <div className="relative w-full">
                  <Input
                    placeholder="Partagez une découverte ou une histoire familiale..."
                    className="bg-gray-100 pr-10"
                    value={postMessage}
                    onChange={(e) => setPostMessage(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSubmitInput() }}
                  />
                  <Send
                    className="absolute w-5 h-5 right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-500 cursor-pointer transition-all duration-200 ease-in-out hover:scale-110"
                    onClick={handleSubmitInput}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-blue-600 transition-colors duration-200">
                  <Camera className="h-4 w-4 mr-2" /> Photo
                </Button>
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-blue-600 transition-colors duration-200">
                  <FileText className="h-4 w-4 mr-2" /> Document
                </Button>
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-blue-600 transition-colors duration-200">
                  <TreePine className="h-4 w-4 mr-2" /> Arbre
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Posts */}
          {posts.map((post) => (
            <Card key={post.id} className="shadow-md border-0 overflow-hidden animate-slide-up animate-stagger-2 card-hover">
              <CardContent className="p-0">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Avatar className="animate-scale-in">
                        <AvatarImage src={post.author.avatar} />
                        <AvatarFallback>{handleGetUserNameInitialsFromPartial(post.author)}</AvatarFallback>
                      </Avatar>
                      <div className="font-semibold">
                        {handleGetUserNameFromPartial(post.author)}
                        {post.author.id !== post.destinator.id && (
                          <span className="text-gray-500 text-sm"> sur le mur de {handleGetUserNameFromPartial(post.destinator)}</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">Il y a 2 heures</div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                        <circle cx="12" cy="12" r="1" />
                        <circle cx="19" cy="12" r="1" />
                        <circle cx="5" cy="12" r="1" />
                      </svg>
                    </Button>
                  </div>
                  <div className="mb-4">
                    <p className="text-gray-700 mb-4">{post.content}</p>
                    {post.image && (
                      <div className="rounded-lg overflow-hidden bg-gray-100 h-64 flex items-center justify-center animate-scale-in">
                        <img src={post.image} alt="Photo historique" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-center px-4  pb-2 sm:pb-3 text-sm text-gray-500">
                    <span>{post.likesIds.length} j'aime</span>
                    <button
                      onClick={() =>
                        setOpenComments((prev) => ({
                          ...prev,
                          [post.id!]: !prev[post.id!],
                        }))
                      }
                      className="hover:underline"
                    >
                      {post.comments.length} commentaire{post.comments.length > 1 ? "s" : ""}
                    </button>
                  </div>
                  <Separator />

                  <div className="px-3 sm:px-4 lg:px-6 py-2 sm:py-2">
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleLike(post)}
                        className={`flex-1 text-xs sm:text-sm ${(currentUser && currentUser.id) && post.likesIds.includes(currentUser.id)
                          ? "text-blue-600 hover:text-blue-700"
                          : "text-gray-600 hover:text-blue-600"
                          }`}
                      >
                        <Heart
                          className={`w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 mr-1 sm:mr-2 ${(currentUser && currentUser.id) && post.likesIds.includes(currentUser.id)
                            ? "fill-current"
                            : ""
                            }`}
                        />
                        J'aime
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setOpenComments((prev) => ({
                            ...prev,
                            [post.id!]: !prev[post.id!],
                          }))
                        }
                        className="flex-1 text-gray-600 hover:text-green-600 text-xs sm:text-sm"
                      >
                        <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 mr-1 sm:mr-2" />
                        Commenter
                      </Button>

                      <Button variant="ghost" size="sm" className="flex-1 text-gray-600 hover:text-purple-600 text-xs sm:text-sm">
                        <Share2 className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 mr-1 sm:mr-2" />
                        Partager
                      </Button>
                    </div>
                  </div>
                  {openComments[post.id!] && (
                    <>
                      {post.comments?.length > 0 && (
                        <div className="px-4 pt-2 space-y-2">
                          {post.comments.map((comment, idx) => (
                            <div key={idx} className="flex items-start space-x-2 text-sm">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={comment.author.avatar} />
                                <AvatarFallback>{comment.author.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <span className="font-semibold">{comment.author.name}</span> {comment.content}
                                <div className="text-xs text-gray-400">{comment.timeAgo}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center px-4 pt-2 space-x-2">
                          <Avatar className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0">
                            <AvatarImage src={currentUser?.avatarUrl} />
                            <AvatarFallback className="text-xs">{currentUser && handleGetUserNameInitials(currentUser)}</AvatarFallback>
                          </Avatar>
                        <Input
                          placeholder="Écrire un commentaire..."
                          className="text-sm"
                          value={commentInputs[post.id!] || ""}
                          onChange={(e) =>
                            setCommentInputs((prev) => ({ ...prev, [post.id!]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddComment(post.id!);
                          }}
                        />
                        <Button size="sm" onClick={() => handleAddComment(post.id!)} disabled={!commentInputs[post.id!]} className="flex-shrink-0">
                          <Send className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                      </div>
                    </>
                  )}
                  
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Suggestions & Recent Activity */}
        <div className="space-y-6">
          {/* Suggestions */}
          <Card className="shadow-md border-0 animate-slide-up animate-stagger-1 card-hover">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Suggestions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between animate-slide-up animate-stagger-1">
                  <div className="flex items-center space-x-3">
                    <Avatar className="animate-scale-in">
                      <AvatarImage src="/placeholder.svg?height=40&width=40" />
                      <AvatarFallback>JM</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold">Jean Martin</div>
                      <div className="text-xs text-gray-500">Possible cousin</div>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="transition-colors duration-200 bg-transparent">
                    Voir
                  </Button>
                </div>
                <div className="flex items-center justify-between animate-slide-up animate-stagger-2">
                  <div className="flex items-center space-x-3">
                    <Avatar className="animate-scale-in">
                      <AvatarImage src="/placeholder.svg?height=40&width=40" />
                      <AvatarFallback>LD</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold">Lucie Dubois</div>
                      <div className="text-xs text-gray-500">Possible tante</div>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="transition-colors duration-200 bg-transparent">
                    Voir
                  </Button>
                </div>
              </div>
              <div className="mt-4 text-center">
                <Link href="/dashboard" onClick={() => dispatch(setActiveTab("ai"))}>
                  <Button variant="link" size="sm" className="text-blue-600 transition-colors duration-200">
                    Voir toutes les suggestions
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="shadow-md border-0 animate-slide-up animate-stagger-2 card-hover">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Activité récente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3 animate-slide-up animate-stagger-1">
                  <div className="w-1 h-1 rounded-full bg-blue-500 mt-2"></div>
                  <div>
                    <div className="text-sm">
                      <span className="font-semibold">Marie Dubois</span> a ajouté une nouvelle photo
                    </div>
                    <div className="text-xs text-gray-500">Il y a 2 heures</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3 animate-slide-up animate-stagger-2">
                  <div className="w-1 h-1 rounded-full bg-blue-500 mt-2"></div>
                  <div>
                    <div className="text-sm">
                      <span className="font-semibold">Pierre Dupont</span> a mis à jour l'arbre généalogique
                    </div>
                    <div className="text-xs text-gray-500">Hier</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3 animate-slide-up animate-stagger-3">
                  <div className="w-1 h-1 rounded-full bg-blue-500 mt-2"></div>
                  <div>
                    <div className="text-sm">
                      <span className="font-semibold">Sophie Dupont</span> a ajouté un nouveau membre
                    </div>
                    <div className="text-xs text-gray-500">Il y a 2 jours</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
