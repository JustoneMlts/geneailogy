"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  ImageIcon,
  Video,
  Smile,
  Send,
  MapPin,
} from "lucide-react"
import { handleGetUserNameInitials } from "@/app/helpers/userHelper"
import { FeedPostType, UserType } from "@/lib/firebase/models"
import { createFeedPost} from "../app/controllers/feedController"

interface CreatePostCardProps {
  user: UserType
  wallOwner: UserType // Le propriétaire du mur
  onPostCreated?: (post: FeedPostType) => void
}

export function CreatePostCard({ user, wallOwner, onPostCreated }: CreatePostCardProps) {
  const [postContent, setPostContent] = useState("")
  const [privacy, setPrivacy] = useState("public")
  const [isLoading, setIsLoading] = useState(false)

  const isOwnWall = user.id === wallOwner.id

  const handleSubmitPost = async () => {
    if (!postContent.trim() || !user?.id || !wallOwner.id || isLoading) return

    setIsLoading(true)

    const now = Date.now()

    const newPost: FeedPostType = {
      // Firestore va générer l'id automatiquement
      author: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatarUrl || "/placeholder.svg",
      },
      destinator: {
        id: wallOwner.id,
        firstName: wallOwner.firstName,
        lastName: wallOwner.lastName,
        avatar: wallOwner.avatarUrl || "/placeholder.svg",
      },
      content: postContent,
      timeAgo: "À l'instant", // tu peux remplacer par une vraie logique ensuite
      privacy: "public", // ou autre selon la logique métier
      likesIds: [],
      isLiked: false,
      isOnWall: user.id !== wallOwner.id,
      image: "", // à gérer si upload
      location: "", // à gérer plus tard
      comments: [],
      createdAt: now,
    }

    try {
      const postId = await createFeedPost(newPost)
      const postWithId = { ...newPost, id: postId }

      setPostContent("")
      onPostCreated?.(postWithId)

    } catch (error) {
      console.error("Erreur lors de la création du post:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="mb-4 sm:mb-6">
      <CardContent className="py-3 sm:p-4 lg:py-6">
        {/* Message contextuel si ce n'est pas son propre mur */}
        {!isOwnWall && (
          <div className="mb-3 p-2 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              Vous écrivez sur le mur de{" "}
              <span className="font-semibold">
                {wallOwner.firstName} {wallOwner.lastName}
              </span>
            </p>
          </div>
        )}

        <div className="flex space-x-2 sm:space-x-3 lg:space-x-4">
          <Avatar className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 flex-shrink-0">
            <AvatarImage src={user?.avatarUrl} />
            <AvatarFallback className="text-lg sm:text-xl">
              {user && handleGetUserNameInitials(user)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <Textarea
              placeholder={
                isOwnWall
                  ? "Que voulez-vous partager sur votre mur ?"
                  : `Écrivez quelque chose sur le mur de ${wallOwner.firstName}...`
              }
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              className="min-h-[80px] sm:min-h-[100px] resize-none border-none shadow-none focus-visible:ring-0 text-sm sm:text-base lg:text-lg placeholder:text-gray-500"
            />
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100 space-y-3 sm:space-y-0">
              <div className="flex flex-wrap gap-2 sm:gap-3 lg:gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-blue-600 text-xs sm:text-sm p-1 sm:p-2"
                >
                  <ImageIcon className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Photo</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-green-600 text-xs sm:text-sm p-1 sm:p-2"
                >
                  <Video className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Vidéo</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-red-600 text-xs sm:text-sm p-1 sm:p-2"
                >
                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Lieu</span>
                </Button>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-3">
                <select
                  value={privacy}
                  onChange={(e) => setPrivacy(e.target.value)}
                  className="text-xs sm:text-sm border rounded-md px-2 py-1 bg-gray-50 min-w-0 w-1/2"
                >
                  <option value="public">🌍 Public</option>
                  <option value="connections">👥 Connexions</option>
                  <option value="private">🔒 Privé</option>
                </select>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm px-2 sm:px-4"
                  disabled={!postContent.trim() || isLoading}
                  size="sm"
                  onClick={handleSubmitPost}
                >
                  <Send className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  {isLoading ? "Publication..." : "Publier"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}