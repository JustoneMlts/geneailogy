"use client"

import { useEffect, useState, useMemo } from "react"
import { useSelector, useDispatch } from "react-redux"
import { useRouter } from "next/navigation"
import { Button } from "./ui/button"
import { UserCheck, UserPlus } from "lucide-react"
import { CreatePostCard } from "@/components/createPostCard"
import { PostCard } from "@/components/postCard"
import { FeedPostType, LinkStatus, UserType } from "@/lib/firebase/models"
import { selectUser } from "@/lib/redux/slices/currentUserSlice"
import { useLinks } from "@/components/LinksProvider"
import { sendConnectionRequest } from "@/app/controllers/usersController"
import { addConnection } from "@/lib/redux/slices/connectionsSlice"
import { collection, onSnapshot, query, where } from "firebase/firestore"
import { COLLECTIONS } from "@/lib/firebase/collections"
import { db } from "@/lib/firebase/firebase"

interface OtherWallProps {
    wallOwner: UserType
}

export default function OtherWallPage({ wallOwner }: OtherWallProps) {
    const currentUser = useSelector(selectUser)
    const dispatch = useDispatch()
    const router = useRouter()
    const { links, usersMap } = useLinks()

    const [wallPosts, setWallPosts] = useState<FeedPostType[]>([])
    const [loading, setLoading] = useState(true)

    // --- Connexion en temps réel ---
    const connection = useMemo(() => {
        if (!currentUser?.id) return null
        return links.find(
            (link) =>
                (link.senderId === currentUser.id && link.receiverId === wallOwner.id) ||
                (link.receiverId === currentUser.id && link.senderId === wallOwner.id)
        )
    }, [links, currentUser?.id, wallOwner.id])

    const connectionStatus: LinkStatus | "none" = connection?.status ?? "none"
    const isSender = connection?.senderId === currentUser?.id

    // --- Gestion de l'envoi de demande ---
    const handleConnectionRequest = async (receiverId: string) => {
        if (!currentUser?.id) return

        try {
            const link = await sendConnectionRequest(
                currentUser.id,
                receiverId,
                currentUser.firstName,
                currentUser.lastName,
                currentUser.avatarUrl ?? ""
            )

            dispatch(
                addConnection({
                    senderId: currentUser.id,
                    receiverId,
                    status: "pending",
                    createdDate: Date.now(),
                    updatedDate: Date.now(),
                    linkId: link.linkId
                })
            )
        } catch (err) {
            console.error("Erreur en envoyant la demande:", err)
        }
    }

    const renderConnectionButton = () => {
        switch (connectionStatus) {
            case "none":
                return (
                    <Button
                        size="sm"
                        onClick={() => handleConnectionRequest(wallOwner.id!)}
                        className="flex items-center justify-center mt-3 h-10 px-2 py-2 bg-white text-blue-700 text-sm rounded-sm shadow hover:bg-gray-50 transition-colors"
                    >
                        Envoyer une demande d'ami
                        <UserPlus className="w-6 h-6 ml-1" />
                    </Button>
                )

            case "pending":
                if (isSender) {
                    return (
                        <Button
                            size="sm"
                            disabled
                            className="flex items-center justify-center mt-3 h-10 px-2 py-2 bg-white text-blue-700 text-sm rounded-sm shadow hover:bg-gray-50 transition-colors"
                        >
                            Demande d'ami envoyée
                            <UserPlus className="w-6 h-6 ml-1" />
                        </Button>
                    )
                } else {
                    return (
                        <Button
                            size="sm"
                            disabled
                            className="flex items-center justify-center mt-3 h-10 px-2 py-2 bg-purple-50 text-purple-700 text-sm rounded-sm shadow"
                        >
                            Demande reçue
                        </Button>
                    )
                }

            case "accepted":
                return (
                    <div className="flex items-center justify-center mt-3 h-8 px-2 py-2 bg-white text-blue-700 text-sm rounded-sm shadow transition-colors">
                        Ami
                        <UserCheck className="w-6 h-6 ml-1" />
                    </div>
                )

            default:
                return null
        }
    }

    useEffect(() => {
        if (!wallOwner?.id) return
        const q = query(collection(db, COLLECTIONS.FEED), where("destinatorId", "==", wallOwner.id))
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetched = snapshot.docs
                .map((doc) => ({ id: doc.id, ...doc.data() } as FeedPostType))
                .filter((post) => post && post.destinatorId === wallOwner.id)

            fetched.sort((a, b) => b.createdAt - a.createdAt)
            setWallPosts(fetched)
            setLoading(false)
        })
        return () => unsubscribe()
    }, [wallOwner?.id])

    const handlePostCreated = (newPost: FeedPostType) => {
        setWallPosts((prev) => (prev.some((p) => p.id === newPost.id) ? prev : [newPost, ...prev]))
    }

    const isOwnWall = currentUser?.id === wallOwner.id

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-green-50">
            <div className="w-2/3 mx-auto p-6">
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
                                {isOwnWall ? "Vos publications et celles de vos connexions" : "Publications postées ici"}
                            </p>
                        </div>
                    </div>

                    {!isOwnWall && (
                        <div className="flex flex-col gap-2">
                            {renderConnectionButton()}
                            <button
                                onClick={() => router.push(`/tree/${wallOwner.id}`)}
                                className="mt-3 px-4 py-2 bg-green-600 text-white text-sm rounded-lg shadow hover:bg-green-700 transition-colors"
                            >
                                🌳 Voir son arbre généalogique
                            </button>
                        </div>
                    )}
                </div>

                {currentUser?.id && (
                    <CreatePostCard user={currentUser} wallOwner={wallOwner} onPostCreated={handlePostCreated} />
                )}

                <div className="space-y-4">
                    {loading && <p>Chargement...</p>}
                    {!loading && wallPosts.length === 0 && <div className="text-center text-gray-500 mt-6">Aucun post sur ce mur pour le moment.</div>}
                    {wallPosts.map((post) => (
                        <PostCard
                            key={post.id}
                            post={{
                                ...post,
                                comments: post.comments || [],
                                isOnWall: post.authorId !== post.destinatorId,
                            }}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}
