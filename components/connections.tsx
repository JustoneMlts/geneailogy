"use client"

import { useEffect, useState, useMemo } from "react"
import { useSelector, useDispatch } from "react-redux"
import { useRouter } from "next/navigation"
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"

// Redux
import { selectUser } from "@/lib/redux/slices/currentUserSlice"
import {
    selectConnections,
    setConnections,
    updateConnectionStatusInStore,
    removeConnectionFromStore,
} from "@/lib/redux/slices/connectionsSlice"
import {
    selectNotifications,
    setActivePage,
    markConnectionNotificationsAsRead,
} from "@/lib/redux/slices/notificationSlice"

import { markConnectionNotificationsAsReadInDB } from "@/app/controllers/notificationsController"
import {
    updateConnectionStatus,
    cancelConnectionRequest,
    deleteConnection,
} from "@/app/controllers/usersController"

import { Links, UserType } from "@/lib/firebase/models"
import { ConnectionsSkeleton } from "@/components/connectionsSekeleton"

// UI
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
    Users,
    Clock,
    Check,
    X,
    Mail,
    MapPin,
    UserPlus,
    Search,
    UserCheck,
} from "lucide-react"

export const Connections = () => {
    const currentUser = useSelector(selectUser)
    const connections = useSelector(selectConnections)
    const notifications = useSelector(selectNotifications)
    const dispatch = useDispatch()
    const router = useRouter()

    const [usersMap, setUsersMap] = useState<Record<string, UserType>>({})
    const [searchTerm, setSearchTerm] = useState("")
    const [activeTab, setActiveTab] = useState<"friends" | "requests">("friends")
    const [isLoading, setIsLoading] = useState(true)
    const [links, setLinks] = useState<Links[]>([])

    useEffect(() => {
        dispatch(setActivePage("connections"))
        return () => {
            dispatch(setActivePage(null))
        }
    }, [dispatch])

    // 🔔 Marquer les notifs "connection" comme lues
    useEffect(() => {
        if (!currentUser?.id) return
        if (notifications.some(n => n.type === "connection" && n.unread)) {
            dispatch(markConnectionNotificationsAsRead())
            markConnectionNotificationsAsReadInDB(currentUser.id).catch(console.error)
        }
    }, [notifications, currentUser, dispatch])

    // 👥 Charger les links depuis la collection Links
    useEffect(() => {
        if (!currentUser?.id) return

        const fetchLinks = async () => {
            try {
                setIsLoading(true)
                
                // Récupérer tous les links où l'utilisateur est sender ou receiver
                const linksCollection = collection(db, "Links")
                const qSender = query(linksCollection, where("senderId", "==", currentUser.id))
                const qReceiver = query(linksCollection, where("receiverId", "==", currentUser.id))
                
                const [senderSnap, receiverSnap] = await Promise.all([
                    getDocs(qSender),
                    getDocs(qReceiver)
                ])
                
                const allLinks: Links[] = []
                
                senderSnap.forEach(doc => {
                    allLinks.push({ 
                        linkId: doc.id, 
                        ...doc.data() 
                    } as Links)
                })
                
                receiverSnap.forEach(doc => {
                    allLinks.push({ 
                        linkId: doc.id, 
                        ...doc.data() 
                    } as Links)
                })
                
                setLinks(allLinks)
                
                // Charger les informations des utilisateurs
                const usersMapTemp: Record<string, UserType> = {}
                const userIds = new Set<string>()
                
                allLinks.forEach(link => {
                    if (link.senderId !== currentUser.id) userIds.add(link.senderId)
                    if (link.receiverId !== currentUser.id) userIds.add(link.receiverId)
                })
                
                for (const userId of userIds) {
                    try {
                        const snapshot = await getDoc(doc(db, "Users", userId))
                        if (snapshot.exists()) {
                            usersMapTemp[userId] = {
                                ...(snapshot.data() as UserType),
                                id: snapshot.id,
                            }
                        }
                    } catch (err) {
                        console.error("Erreur lors du chargement user:", userId, err)
                    }
                }
                
                setUsersMap(usersMapTemp)
            } catch (error) {
                console.error("Erreur chargement connexions :", error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchLinks()
    }, [currentUser])
    
    const handleAccept = async (linkId: string) => {
        if (!currentUser?.id) return

        try {
            await updateConnectionStatus(
                linkId,
                "accepted",
                currentUser.firstName,
                currentUser.lastName,
                currentUser.avatarUrl ?? ""
            )

            // Mettre à jour l'état local
            setLinks(prev => 
                prev.map(link => 
                    link.linkId === linkId 
                        ? { ...link, status: "accepted" }
                        : link
                )
            )
        } catch (error) {
            console.error("Erreur lors de l'acceptation:", error)
        }
    }

    // ✅ Refuser / annuler une demande
    const handleCancel = async (linkId: string) => {
        try {
            await cancelConnectionRequest(linkId)
            
            // Retirer le link de l'état local
            setLinks(prev => prev.filter(link => link.linkId !== linkId))
        } catch (error) {
            console.error("Erreur lors de l'annulation:", error)
        }
    }

    // ✅ Supprimer une connexion existante
    const handleRemove = async (linkId: string) => {
        try {
            await deleteConnection(linkId)
            
            // Retirer le link de l'état local
            setLinks(prev => prev.filter(link => link.linkId !== linkId))
        } catch (error) {
            console.error("Erreur lors de la suppression:", error)
        }
    }
    
    const handleNavigate = (userId: string) => router.push(`/wall/${userId}`)

    // 🧩 Calculs dérivés
    const acceptedFriends = useMemo(
        () => links.filter(link => link.status === "accepted"),
        [links]
    )

    const pendingRequests = useMemo(
        () => links.filter(
            link => link.status === "pending" && link.receiverId === currentUser?.id
        ),
        [links, currentUser]
    )

    const sentRequests = useMemo(
        () => links.filter(
            link => link.status === "pending" && link.senderId === currentUser?.id
        ),
        [links, currentUser]
    )

    const filteredFriends = acceptedFriends.filter(link => {
        const otherId = link.senderId === currentUser?.id ? link.receiverId : link.senderId
        const user = usersMap[otherId]
        return user
            ? `${user.firstName} ${user.lastName}`
                .toLowerCase()
                .includes(searchTerm.toLowerCase())
            : false
    })

    const filteredRequests = pendingRequests.filter(link => {
        const user = usersMap[link.senderId]
        return user
            ? `${user.firstName} ${user.lastName}`
                .toLowerCase()
                .includes(searchTerm.toLowerCase())
            : false
    })

    if (isLoading) return <ConnectionsSkeleton />

    // 🧠 UI
    return (
        <div className="min-h-screen">
            <div className="animate-fade-in p-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                        <div>
                            <h1 className="text-4xl font-bold text-gray-800 mb-2">
                                Connexions
                            </h1>
                            <p className="text-gray-600 text-lg">
                                Gérez votre réseau et restez connecté avec votre communauté
                            </p>
                        </div>
                        <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg">
                            <UserPlus className="mr-2 h-4 w-4" />
                            Inviter des contacts
                        </Button>
                    </div>
                </div>

                {/* Tabs + Search */}
                <div className="bg-white rounded-xl shadow-sm mb-6 overflow-hidden">
                    <div className="flex flex-col md:flex-row justify-between items-center p-4 gap-4 border-b">
                        {/* Tabs */}
                        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                            <button
                                onClick={() => setActiveTab("friends")}
                                className={`px-6 py-2 rounded-md font-medium transition-all ${activeTab === "friends"
                                    ? "bg-white text-blue-600 shadow-sm"
                                    : "text-gray-600 hover:text-gray-900"
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4" />
                                    Amis ({acceptedFriends.length})
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab("requests")}
                                className={`px-6 py-2 rounded-md font-medium transition-all relative ${activeTab === "requests"
                                    ? "bg-white text-purple-600 shadow-sm"
                                    : "text-gray-600 hover:text-gray-900"
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    Demandes ({pendingRequests.length})
                                    {pendingRequests.length > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                            {pendingRequests.length}
                                        </span>
                                    )}
                                </div>
                            </button>
                        </div>

                        {/* Search */}
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                                placeholder="Rechercher..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="pl-10 border-gray-200 focus:border-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* CONTENT */}
                {activeTab === "friends" ? (
                    filteredFriends.length === 0 ? (
                        <Card className="p-12 text-center bg-white/80">
                            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">
                                {searchTerm ? "Aucun ami trouvé" : "Aucun ami pour le moment"}
                            </h3>
                            <p className="text-gray-500">
                                {searchTerm
                                    ? "Essayez un autre terme de recherche"
                                    : "Commencez à construire votre réseau !"}
                            </p>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredFriends.map(link => {
                                const otherId = link.senderId === currentUser?.id
                                    ? link.receiverId
                                    : link.senderId
                                const user = usersMap[otherId]
                                if (!user || !link.linkId) return null
                                
                                return (
                                    <Card
                                        key={link.linkId}
                                        className="group hover:shadow-xl transition-all bg-white border-0 shadow-md"
                                    >
                                        <div className="h-20 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400"></div>
                                        <CardContent className="p-6 -mt-10 relative">
                                            <div className="flex justify-center mb-4">
                                                <Avatar className="w-20 h-20 border-4 border-white shadow-lg ring-2 ring-blue-100">
                                                    <AvatarImage src={user.avatarUrl} />
                                                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xl">
                                                        {user.firstName[0]}
                                                        {user.lastName[0]}
                                                    </AvatarFallback>
                                                </Avatar>
                                            </div>
                                            <div className="text-center mb-4">
                                                <h3 className="font-bold text-lg text-gray-800 mb-1">
                                                    {user.firstName} {user.lastName}
                                                </h3>
                                                {user.localisation && (
                                                    <div className="flex items-center justify-center text-gray-500 text-sm mb-2">
                                                        <MapPin className="w-3 h-3 mr-1" />
                                                        {user.localisation}
                                                    </div>
                                                )}
                                                <Badge className="bg-green-100 text-green-700 border-0">
                                                    <UserCheck className="w-3 h-3 mr-1" />
                                                    Ami
                                                </Badge>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="flex-1 border-gray-200 hover:border-blue-500 hover:text-blue-600"
                                                    onClick={() => handleNavigate(user.id!)}
                                                >
                                                    Voir le profil
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                    onClick={() => handleRemove(link.linkId!)}
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    )
                ) : (
                    <div className="space-y-6">
                        {/* Demandes reçues */}
                        {filteredRequests.length > 0 && (
                            <div>
                                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-purple-600" />
                                    Demandes d'amis reçues
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {filteredRequests.map(link => {
                                        const user = usersMap[link.senderId]
                                        if (!user || !link.linkId) return null
                                        
                                        return (
                                            <Card
                                                key={link.linkId}
                                                className="hover:shadow-lg transition-all bg-white border-0 shadow-md"
                                            >
                                                <CardContent className="p-6">
                                                    <div className="flex items-start gap-4">
                                                        <Avatar className="w-16 h-16 ring-2 ring-purple-100">
                                                            <AvatarImage src={user.avatarUrl} />
                                                            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                                                                {user.firstName[0]}
                                                                {user.lastName[0]}
                                                            </AvatarFallback>
                                                        </Avatar>

                                                        <div className="flex-1">
                                                            <h3 className="font-bold text-lg text-gray-800">
                                                                {user.firstName} {user.lastName}
                                                            </h3>
                                                            {user.localisation && (
                                                                <div className="flex items-center text-gray-500 text-sm mt-1">
                                                                    <MapPin className="w-3 h-3 mr-1" />
                                                                    {user.localisation}
                                                                </div>
                                                            )}
                                                            <div className="flex gap-2 mt-3">
                                                                <Button
                                                                    size="sm"
                                                                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                                                                    onClick={() => handleAccept(link.linkId!)}
                                                                >
                                                                    <Check className="w-4 h-4 mr-1" />
                                                                    Accepter
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="border-gray-200 hover:border-red-500 hover:text-red-600"
                                                                    onClick={() => handleCancel(link.linkId!)}
                                                                >
                                                                    <X className="w-4 h-4 mr-1" />
                                                                    Refuser
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Invitations envoyées */}
                        {sentRequests.length > 0 && (
                            <div>
                                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <Mail className="w-5 h-5 text-pink-600" />
                                    Invitations envoyées
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {sentRequests.map(link => {
                                        const user = usersMap[link.receiverId]
                                        if (!user || !link.linkId) return null
                                        
                                        return (
                                            <Card
                                                key={link.linkId}
                                                className="hover:shadow-lg transition-all bg-white border-0 shadow-md"
                                            >
                                                <CardContent className="p-6">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-4">
                                                            <Avatar className="w-14 h-14 ring-2 ring-pink-100">
                                                                <AvatarImage src={user.avatarUrl} />
                                                                <AvatarFallback className="bg-gradient-to-br from-pink-500 to-red-500 text-white">
                                                                    {user.firstName[0]}
                                                                    {user.lastName[0]}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <h3 className="font-semibold text-gray-800">
                                                                    {user.firstName} {user.lastName}
                                                                </h3>
                                                                <Badge className="bg-yellow-100 text-yellow-700 border-0 mt-1">
                                                                    <Clock className="w-3 h-3 mr-1" />
                                                                    En attente
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="text-gray-500 hover:text-red-600 hover:bg-red-50"
                                                            onClick={() => handleCancel(link.linkId!)}
                                                        >
                                                            Annuler
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Empty */}
                        {filteredRequests.length === 0 && sentRequests.length === 0 && (
                            <Card className="p-12 text-center bg-white/80">
                                <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                                    Aucune demande en attente
                                </h3>
                                <p className="text-gray-500">
                                    Toutes vos demandes ont été traitées !
                                </p>
                            </Card>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}