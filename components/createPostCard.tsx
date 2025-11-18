"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera, FileText, Send, X } from "lucide-react"
import { handleGetUserNameInitials } from "@/app/helpers/userHelper"
import { FeedPostType, UserType } from "@/lib/firebase/models"
import { createFeedPost, updateFeedPost } from "@/app/controllers/feedController"
import { uploadFileToStorage } from "@/lib/firebase/firebase-functions"
import { cp } from "fs"

interface CreatePostCardProps {
  user: UserType
  wallOwner: UserType
  onPostCreated?: (post: FeedPostType) => void
  isEditing?: boolean
  post?: FeedPostType
}

export function CreatePostCard({ user, wallOwner, onPostCreated, isEditing, post }: CreatePostCardProps) {
  const [postMessage, setPostMessage] = useState<string>("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const imageInputRef = useRef<HTMLInputElement | null>(null)
  const docInputRef = useRef<HTMLInputElement | null>(null)

  const isOwnWall = user.id === wallOwner.id

  // 🔹 Gestion de l’upload (image ou document)
  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "image" | "document"
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const url = await uploadFileToStorage(
        file,
        type === "image" ? "feed-images" : "feed-documents"
      )
      setSelectedFile(file)
      setFileUrl(url)
    } catch (err) {
      console.error("Erreur lors de l’upload :", err)
    }
  }

  // 🔹 Supprimer le fichier uploadé
  const handleRemoveFile = () => {
    setSelectedFile(null)
    setFileUrl(null)
  }

  // 🔹 Création du post
  const handleSubmitPost = async () => {
    if (!user?.id || (!postMessage.trim() && !fileUrl) || isLoading) return

    setIsLoading(true)

    const newPost: FeedPostType = {
      authorId: user.id ?? "",
      destinatorId: wallOwner.id ?? "",
      content: postMessage.trim(),
      image: selectedFile?.type.startsWith("image/") ? fileUrl ?? "" : "",
      documentUrl:
        selectedFile &&
          !selectedFile.type.startsWith("image/") &&
          fileUrl
          ? fileUrl
          : undefined,
      documentName:
        selectedFile && !selectedFile.type.startsWith("image/")
          ? selectedFile.name
          : undefined,
      createdAt: Date.now(),
      timeAgo: "À l'instant",
      likesIds: [],
      comments: [],
      privacy: "public",
      isOnWall: user.id !== wallOwner.id,
    }

    try {
      const cleanPost = Object.fromEntries(
        Object.entries(newPost).filter(([_, v]) => v !== undefined)
      ) as FeedPostType

      const postId = (await createFeedPost(cleanPost)) as unknown as string | undefined
      const postWithId = { ...cleanPost, id: postId }

      setPostMessage("")
      setSelectedFile(null)
      setFileUrl(null)
      onPostCreated?.(postWithId)
    } catch (err) {
      console.error("Erreur lors de la création du post :", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditPost = async () => {
    if (!user?.id || (!postMessage.trim() && !fileUrl) || isLoading || !post) return

    setIsLoading(true)

    const newPost: FeedPostType = {
      authorId: user.id ?? "",
      destinatorId: wallOwner.id ?? "",
      content: postMessage.trim(),
      image: selectedFile?.type.startsWith("image/") ? fileUrl ?? "" : "",
      documentUrl:
        selectedFile &&
          !selectedFile.type.startsWith("image/") &&
          fileUrl
          ? fileUrl
          : undefined,
      documentName:
        selectedFile && !selectedFile.type.startsWith("image/")
          ? selectedFile.name
          : undefined,
      createdAt: Date.now(),
      timeAgo: "À l'instant",
      likesIds: [],
      comments: [],
      privacy: "public",
      isOnWall: user.id !== wallOwner.id,
    }

    try {
      const cleanPost = Object.fromEntries(
        Object.entries(newPost).filter(([_, v]) => v !== undefined)
      ) as FeedPostType
      if (post && post.id) {
        const postId = (await updateFeedPost(post?.id, cleanPost)) as unknown as string | undefined
        const postWithId = { ...cleanPost, id: postId }

        setPostMessage("")
        setSelectedFile(null)
        setFileUrl(null)
        onPostCreated?.(postWithId)
      }

    } catch (err) {
      console.error("Erreur lors de la création du post :", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {!isEditing ? (
        <Card className="shadow-md border-0 animate-slide-up card-hover mb-6">
          <CardContent className="p-4">
            {!isOwnWall && (
              <div className="mb-3 p-2 bg-blue-50 rounded-lg text-sm text-blue-700">
                Vous écrivez sur le mur de{" "}
                <span className="font-semibold">
                  {wallOwner.firstName} {wallOwner.lastName}
                </span>
              </div>
            )}

            <div className="flex items-start space-x-4">
              <Avatar className="animate-scale-in">
                <AvatarImage src={user.avatarUrl} />
                <AvatarFallback>
                  {handleGetUserNameInitials(user)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                {/* Aperçu du fichier au-dessus */}
                {fileUrl && (
                  <div className="relative mb-3 inline-block">
                    {selectedFile?.type.startsWith("image/") ? (
                      <div className="relative inline-block">
                        <img
                          src={fileUrl}
                          alt="aperçu"
                          className="rounded-lg border border-gray-200 shadow-sm max-w-28 max-h-32 object-cover"
                        />
                        <button
                          onClick={handleRemoveFile}
                          className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100 transition"
                        >
                          <X className="w-3 h-3 text-gray-700" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between bg-gray-100 rounded-md px-3 py-2 border border-gray-200 relative">
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 font-medium truncate max-w-[80%]"
                        >
                          {selectedFile?.name}
                        </a>
                        <button
                          onClick={handleRemoveFile}
                          className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-md hover:bg-gray-100 transition"
                        >
                          <X className="w-3 h-3 text-gray-700" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Input texte */}
                <div className="relative">
                  <Input
                    placeholder={
                      isOwnWall
                        ? "Partagez une découverte ou une histoire familiale..."
                        : `Écrivez quelque chose sur le mur de ${wallOwner.firstName}...`
                    }
                    className="bg-gray-100 pr-10"
                    value={postMessage}
                    onChange={(e) => setPostMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleSubmitPost()
                      }
                    }}
                  />
                  <Send
                    className="absolute w-5 h-5 right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-500 cursor-pointer transition-all duration-200 ease-in-out hover:scale-110"
                    onClick={handleSubmitPost}
                  />
                </div>
              </div>
            </div>

            {/* Boutons photo / document */}
            <div className="flex w-full justify-center mt-4 pt-4 border-t border-gray-100">
              <div className="flex w-1/2 items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-blue-600 transition-colors duration-200"
                  onClick={() => imageInputRef.current?.click()}
                >
                  <Camera className="h-4 w-4 mr-2" /> Photo
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-blue-600 transition-colors duration-200"
                  onClick={() => docInputRef.current?.click()}
                >
                  <FileText className="h-4 w-4 mr-2" /> Document
                </Button>
              </div>
            </div>

            {/* Inputs cachés */}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileChange(e, "image")}
            />
            <input
              ref={docInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              className="hidden"
              onChange={(e) => handleFileChange(e, "document")}
            />
          </CardContent>
        </Card>
      ) :
        (
          <div className="w-full flex flex-col space-y-2 mb-6">
           <div className="relative"> 
              <Input
                placeholder={
                  isEditing
                    ? `${post?.content}`
                    : "Partagez une découverte ou une histoire familiale..."
                }
                className="bg-gray-100 pr-10"
                value={postMessage}
                onChange={(e) => setPostMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && isEditing) {
                    e.preventDefault()
                    handleEditPost()
                  }
                }}
              />
              <Send
                className="absolute w-5 h-5 right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-500 cursor-pointer transition-all duration-200 ease-in-out hover:scale-110"
                onClick={handleEditPost}
              />
            </div>
          </div>
        )
      }
    </>
  )
}
