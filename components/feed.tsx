import { Camera, FileText, Heart, MessageSquare, Share2, TreePine, Send, MessageCircle, MapPin } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Input } from "./ui/input"
import { useDispatch, useSelector } from "react-redux"
import { selectUser } from "@/lib/redux/slices/currentUserSlice"
import { handleGetUserNameFromPartial, handleGetUserNameInitialsFromPartial, handleGetUserName, handleGetUserNameInitials } from "@/app/helpers/userHelper"
import { useEffect, useState } from "react"
import { addCommentToPost, createFeedPost, toggleLikePost } from "@/app/controllers/feedController"
import { FeedPostType, UserLink, UserType } from "@/lib/firebase/models"
import { collection, query, where, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"
import { FeedSkeleton } from "./feedSkeleton"
import { PostCard } from "./postCard"

export const Feed = () => {
  const currentUser = useSelector(selectUser)
  const [postMessage, setPostMessage] = useState<string>("")
  const [posts, setPosts] = useState<FeedPostType[]>([])
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true)

  const handleUserSelect = (user: UserType): void => {
    setSelectedUser(user);
    console.log('Utilisateur sélectionné:', user);
    // Ici vous pouvez naviguer vers le profil de l'utilisateur
    // Par exemple: navigate(`/profile/${user.id}`)
  };

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

  const unsubscribe = listenPostsByUserIds(userIdsToListen, (fetched) => {
    setPosts(fetched)
    setLoading(false)
  })

  return () => unsubscribe()
}, [currentUser])


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

  return (
    <div className="animate-fade-in">
      <div className="min-h-screen">
        
        {/* Contenu principal */}
        <main className="w-2/3 mx-auto">
            <div className="p-6">
              <h1 className="text-3xl font-bold mb-6 animate-slide-up">Fil d'actualité</h1>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-3 space-y-6">
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
                {
                  loading ? (
                    <FeedSkeleton />
                  ) : posts.length === 0 ? (
                    <p className="text-gray-500 text-center py-10">Aucun post pour le moment.</p>
                  ) : (
                    posts.map((post) => (
                       <PostCard
              key={post.id}
              post={{
                ...post,
                isOnWall: post.author.id !== post.destinator.id, // 🔄 pour affichage flèche
              }}
            />
                    )))
                }
                  
                </div>

                {/* Suggestions & Recent Activity */}
               
              </div>
            </div>
        </main>
      </div>
    </div>
  )
}
