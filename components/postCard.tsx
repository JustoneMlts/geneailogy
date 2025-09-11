import { toggleLikePost } from "@/app/controllers/feedController"
import { handleGetUserNameInitials } from "@/app/helpers/userHelper"
import { selectUser } from "@/lib/redux/slices/currentUserSlice"
import { Globe, Users, MoreHorizontal, MapPin, Heart, MessageCircle, Share2, Send, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useSelector } from "react-redux"
import { useState } from "react"
import { useRouter } from "next/navigation"

export function PostCard({ post }: { post: any }) {
  const currentUser = useSelector(selectUser)
  const [liked, setLiked] = useState(post.likesIds.includes(currentUser?.id || ""))
  const [likeCount, setLikeCount] = useState(post.likesIds.length)
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [showLikers, setShowLikers] = useState(false) // 🔥 Nouveau
  const router = useRouter()

  const handleLike = () => {
    if (!currentUser?.id) return
    const alreadyLiked = post.likesIds.includes(currentUser.id)
    setLiked(!alreadyLiked)
    setLikeCount(alreadyLiked ? likeCount - 1 : likeCount + 1)

    // Mise à jour Firestore
    toggleLikePost(post.id!, currentUser.id, alreadyLiked)
  }

  const handleComment = () => {
    if (newComment.trim()) {
      // Ajouter le commentaire
      setNewComment("")
    }
  }

  const handleNavigate = (userId: string) => {
        router.push(`/wall/${userId}`)
    }

  return (
    <Card className="mb-4 sm:mb-6 transition-shadow hover:shadow-lg">
      <CardContent className="p-0">
        {/* Header du post */}
        <div className="p-3 sm:p-4 lg:p-6 pb-2 sm:pb-3 lg:pb-4">
          <div className="flex items-start justify-between">
            <div className="flex space-x-2 sm:space-x-3 min-w-0 flex-1">
              <Avatar className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 flex-shrink-0 cursor-pointer" onClick={() => {handleNavigate(post.author.id)}}>
                <AvatarImage src={post.author.avatar || "/placeholder.svg"} />
                <AvatarFallback className="text-xs sm:text-sm">{post.author.initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2 flex-wrap">
                  <h3 className="font-semibold cursor-pointer hover:underline text-gray-900 text-sm sm:text-base truncate" onClick={() => {handleNavigate(post.author.id)}}>{post.author.firstName + " " + post.author.lastName}</h3>
                  {post.author.verified && (
                    <Badge className="bg-blue-100 text-blue-800 text-xs flex-shrink-0">Vérifié</Badge>
                  )}
                  {post.isOnWall && (
                    <span className="text-gray-500 text-xs sm:text-sm flex-shrink-0">→ sur votre mur</span>
                  )}
                </div>
                <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-500 mt-1">
                  <span>{post.timeAgo}</span>
                  <span>•</span>
                  {post.privacy === "public" && <Globe className="w-3 h-3 sm:w-4 sm:h-4" />}
                  {post.privacy === "connections" && <Users className="w-3 h-3 sm:w-4 sm:h-4" />}
                  {post.privacy === "private" && <Lock className="w-3 h-3 sm:w-4 sm:h-4" />}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-gray-600 h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0"
            >
              <MoreHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>
        </div>

        {/* Contenu du post */}
        <div className="px-3 sm:px-4 lg:px-6 pb-2 sm:pb-3 lg:pb-4">
          <p className="text-gray-800 leading-relaxed text-sm sm:text-base">{post.content}</p>
          {post.image && (
            <div className="mt-3 sm:mt-4 rounded-lg overflow-hidden">
              <img
                src={post.image || "/placeholder.svg"}
                alt="Post image"
                className="w-full h-auto max-h-64 sm:max-h-80 lg:max-h-96 object-cover"
              />
            </div>
          )}
          {post.location && (
            <div className="flex items-center space-x-2 mt-2 sm:mt-3 text-gray-600">
              <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="text-xs sm:text-sm truncate">{post.location}</span>
            </div>
          )}
        </div>

        {/* Stats */}
        {(likeCount > 0 || post.comments.length > 0) && (
          <div className="px-3 sm:px-4 lg:px-6 pb-2 sm:pb-3">
            <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500">
              {likeCount > 0 && (
                <button
                  onClick={() => setShowLikers(true)}
                  className="flex items-center space-x-1 hover:underline"
                >
                  <div className="flex -space-x-1">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <Heart className="w-2 h-2 sm:w-3 sm:h-3 text-white fill-current" />
                    </div>
                  </div>
                  <span>{likeCount} j'aime</span>
                </button>
              )}
              {post.comments.length > 0 && (
                <button onClick={() => setShowComments(!showComments)} className="hover:underline">
                  {post.comments.length} commentaire{post.comments.length > 1 ? "s" : ""}
                </button>
              )}
            </div>
          </div>
        )}

        <Separator />

        {/* Actions */}
        <div className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3">
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={`flex-1 text-xs sm:text-sm ${liked ? "text-blue-600 hover:text-blue-700" : "text-gray-600 hover:text-blue-600"
                }`}
            >
              <Heart className={`w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 mr-1 sm:mr-2 ${liked ? "fill-current" : ""}`} />
              J'aime
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
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

        {/* Commentaires */}
        {showComments && (
          <>
            <Separator />
            <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 space-y-3 sm:space-y-4">
              {/* Nouveau commentaire */}
              <div className="flex space-x-2 sm:space-x-3">
                <Avatar className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0">
                  <AvatarImage src={currentUser?.avatarUrl} />
                  <AvatarFallback className="text-xs">{currentUser && handleGetUserNameInitials(currentUser)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 flex space-x-2 min-w-0">
                  <Input
                    placeholder="Écrivez un commentaire..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="flex-1 text-xs sm:text-sm"
                    onKeyPress={(e) => e.key === "Enter" && handleComment()}
                  />
                  <Button size="sm" onClick={handleComment} disabled={!newComment.trim()} className="flex-shrink-0">
                    <Send className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </div>
              </div>

              {/* Liste des commentaires */}
              {post.comments.map((comment: any, index: number) => (
                <div key={index} className="flex space-x-2 sm:space-x-3">
                  <Avatar className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0">
                    <AvatarImage src={comment.author.avatar || "/placeholder.svg"} />
                    <AvatarFallback className="text-xs">{comment.author.initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className=" rounded-lg px-2">
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
      </CardContent>
    </Card>
  )
}