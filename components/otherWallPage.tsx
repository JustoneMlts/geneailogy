"use client"

import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { collection, onSnapshot, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"
import { selectUser } from "@/lib/redux/slices/currentUserSlice"
import { FeedPostType, UserType } from "@/lib/firebase/models"
import { CreatePostCard } from "@/components/createPostCard"
import { PostCard } from "@/components/postCard"
import { Tree } from "@/components/tree" // ✅ importe ton arbre
import { useRouter } from "next/navigation"

interface OtherWallProps {
    wallOwner: UserType
}

export default function OtherWallPage({ wallOwner }: OtherWallProps) {
    const currentUser = useSelector(selectUser)
    const [wallPosts, setWallPosts] = useState<FeedPostType[]>([])
    const [loading, setLoading] = useState(true)
    const [showTree, setShowTree] = useState(false)
    const router = useRouter()


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
        setWallPosts((prev) => {
            if (prev.some((post) => post.id === newPost.id)) return prev // ⚡ skip doublon
            return [newPost, ...prev]
        })
    }

    if (!wallOwner) return <div className="p-6">Utilisateur introuvable.</div>

    const isOwnWall = currentUser?.id === wallOwner.id

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-green-50">
            <div className="p-4 max-w-3xl mx-auto">
                {/* Header du mur */}
                <div className="flex justify-between items-center space-x-4 mb-6">
                    <div className="flex space-x-4">
                    <img
                        src={wallOwner.avatarUrl || "/placeholder.svg"}
                        alt="Avatar"
                        className="w-10 h-10 rounded-full border"
                    />
                    <div>
                        <h1 className="text-3xl font-bold">
                            {isOwnWall ? "Mon Journal" : `Mur de ${wallOwner.firstName} ${wallOwner.lastName}`}
                        </h1>
                        <p className="text-gray-600">
                            {isOwnWall
                                ? "Vos publications et celles de vos connexions"
                                : "Publications postées ici"}
                        </p>

                        {/* Bouton pour afficher l’arbre */}
                        
                    </div>
                    </div>
                    <div>
                        {!isOwnWall && (

                            <button
                                onClick={() => router.push(`/tree/${wallOwner.id}`)}
                                className="mt-3 px-4 py-2 bg-green-600 text-white text-sm rounded-lg shadow hover:bg-green-700 transition-colors"
                            >
                                🌳 Voir son arbre généalogique
                            </button>
                        )}
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
                                comments: post.comments || [], // ✅ jamais undefined
                                isOnWall: post.author.id !== post.destinator.id,
                            }}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}
