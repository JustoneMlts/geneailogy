"use client"

import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { collection, onSnapshot, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"
import { selectUser } from "@/lib/redux/slices/currentUserSlice"
import { FeedPostType, UserType } from "@/lib/firebase/models"
import { CreatePostCard } from "@/components/createPostCard"
import { PostCard } from "@/components/postCard"
import { handleGetUserNameInitials } from "@/app/helpers/userHelper"

interface OtherWallProps {
    wallOwner: UserType
}

export default function OtherWallPage({ wallOwner }: OtherWallProps) {
    const currentUser = useSelector(selectUser)
    const [wallPosts, setWallPosts] = useState<FeedPostType[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (currentUser && currentUser.id) {
            console.log("wallOwner : ", wallOwner.id)
            console.log("currentUser : ", currentUser.id)
        }


    }, [wallOwner, currentUser])
    // Récupération des posts temps réel
    useEffect(() => {
        if (!wallOwner?.id) return
        const q = query(collection(db, "Feed"), where("destinator.id", "==", wallOwner.id))
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetched = snapshot.docs.map(
                (doc) => ({ id: doc.id, ...doc.data() } as FeedPostType)
            )
            fetched.sort((a, b) => b.createdAt - a.createdAt)
            setWallPosts(fetched)
            setLoading(false)
        })
        return () => unsubscribe()
    }, [wallOwner?.id])

    const handlePostCreated = (newPost: FeedPostType) => {
        setWallPosts((prev) => [newPost, ...prev])
    }

    if (!wallOwner) return <div className="p-6">Utilisateur introuvable.</div>

    const isOwnWall = currentUser?.id === wallOwner.id

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-green-50">
            <div className="p-4 max-w-3xl mx-auto">
                {/* Header du mur */}
                <div className="flex items-center space-x-4 mb-6">
                    <img
                        src={wallOwner.avatarUrl || "/placeholder.svg"}
                        alt="Avatar"
                        className="w-10 h-10 rounded-full border"
                    />
                    <div>
                        <h1 className="text-3xl font-bold">
                            {isOwnWall
                                ? "Mon Journal"
                                : `Mur de ${wallOwner.firstName} ${wallOwner.lastName}`}
                        </h1>
                        <p className="text-gray-600">
                            {isOwnWall
                                ? "Vos publications et celles de vos connexions"
                                : "Publications postées ici"}
                        </p>
                    </div>
                </div>

                {/* Créer un post */}
                {currentUser?.id && (
                    <CreatePostCard
                        user={currentUser}
                        wallOwner={wallOwner}
                        onPostCreated={handlePostCreated}
                    />
                )}

                {/* Liste des posts */}
                <div className="space-y-4">
                    {loading && <p>Chargement...</p>}
                    {!loading && wallPosts.length === 0 && (
                        <div className="text-center text-gray-500 mt-6">
                            Aucun post sur ce mur pour le moment.
                        </div>
                    )}
                    {wallPosts.map((post) => (
                        <PostCard
                            key={post.id}
                            post={{
                                ...post,
                                isOnWall: post.author.id !== post.destinator.id,
                            }}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}
