"use client"

import { useEffect, useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import { selectUser } from "@/lib/redux/slices/currentUserSlice"
import {
    getConnexionsByUserId,
    updateConnectionStatus,
    cancelConnectionRequest,
    deleteConnection,
} from "@/app/controllers/usersController"
import { UserLink, LinkStatus, UserType } from "@/lib/firebase/models"
import { Card, CardContent } from "./ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { UserPlus, Search, Users, UserCheck, Clock, X, Check, Mail, MapPin, Briefcase } from "lucide-react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"

// Redux
import {
    setConnections,
    updateConnectionStatusInStore,
    removeConnectionFromStore,
    selectConnections,
} from "../lib/redux/slices/connectionsSlice"
import { markConnectionNotificationsAsRead, selectNotifications, setActivePage } from "@/lib/redux/slices/notificationSlice"
import { markConnectionNotificationsAsReadInDB } from "@/app/controllers/notificationsController"
import { useRouter } from "next/navigation"
import { ConnectionsSkeleton } from "../components/connectionsSekeleton"

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

    // 1️⃣ Définir la page active et marquer les notifications comme lues
    useEffect(() => {
        dispatch(setActivePage("connections"))
        return () => {
            dispatch(setActivePage(null))
        }
    }, [dispatch])

    // 2️⃣ Marquer automatiquement les notifications "connection" comme lues
    useEffect(() => {
        if (!currentUser?.id) return

        if (notifications.some(n => n.type === "connection" && n.unread)) {
            dispatch(markConnectionNotificationsAsRead())
            markConnectionNotificationsAsReadInDB(currentUser.id)
                .catch(err => console.error("Erreur update Firestore :", err))
        }
    }, [notifications, currentUser, dispatch])

    // Charger connexions + users
    useEffect(() => {
        if (!currentUser?.id) return

        const fetchConnections = async () => {
            try {
                setIsLoading(true)
                if (currentUser.id) {
                    const data = await getConnexionsByUserId(currentUser.id)
                    dispatch(setConnections(data))

                    const usersMapTemp: Record<string, UserType> = {}
                    for (const conn of data) {
                        try {
                            const userDocRef = doc(db, "Users", conn.userId)
                            const snapshot = await getDoc(userDocRef)
                            if (snapshot.exists()) {
                                const user = snapshot.data() as UserType
                                usersMapTemp[conn.userId] = { ...user, id: snapshot.id }
                            }
                        } catch (err) {
                            console.error("Erreur lors du chargement d'un user:", conn.userId, err)
                        }
                    }
                    setUsersMap(usersMapTemp)
                }
            } catch (error) {
                console.error("Erreur lors du chargement des connexions :", error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchConnections()
    }, [currentUser, dispatch])

    const handleAccept = async (userId: string) => {
        if (!currentUser?.id) return

        await updateConnectionStatus(
            currentUser.id,
            userId,
            "accepted",
            currentUser.firstName,
            currentUser.lastName,
            currentUser.avatarUrl
        )

        dispatch(
            updateConnectionStatusInStore({
                userId,
                senderId: userId,
                status: "accepted",
            })
        )
    }

    const handleCancel = async (userId: string, senderId: string) => {
        if (!currentUser?.id) return

        await cancelConnectionRequest(currentUser.id, userId)

        dispatch(
            removeConnectionFromStore({
                userId,
                senderId,
            })
        )
    }

    const handleRemove = async (userId: string, senderId: string) => {
        if (!currentUser?.id) return

        await deleteConnection(currentUser.id, userId)

        dispatch(
            removeConnectionFromStore({
                userId,
                senderId,
            })
        )
    }

    const handleNavigate = (userId: string) => {
        router.push(`/wall/${userId}`)
    }

    // Séparer les amis et les demandes
    const acceptedFriends = connections.filter(c => c.status === "accepted")
    const pendingRequests = connections.filter(c => 
        c.status === "pending" && c.senderId !== currentUser?.id
    )
    const sentRequests = connections.filter(c => 
        c.status === "pending" && c.senderId === currentUser?.id
    )

    // Filtrer selon la recherche
    const filteredFriends = acceptedFriends.filter((c) => {
        const user = usersMap[c.userId]
        return user
            ? `${user.firstName} ${user.lastName}`
                .toLowerCase()
                .includes(searchTerm.toLowerCase())
            : false
    })

    const filteredRequests = pendingRequests.filter((c) => {
        const user = usersMap[c.userId]
        return user
            ? `${user.firstName} ${user.lastName}`
                .toLowerCase()
                .includes(searchTerm.toLowerCase())
            : false
    })

    if (isLoading) {
        return <ConnectionsSkeleton />
    }

    return (
        <div className="min-h-screen">
            <div className="animate-fade-in p-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                        <div>
                            <h1 className="text-4xl font-bold text-gray-800 mb-2">Connexions</h1>
                            <p className="text-gray-600 text-lg">
                                Gérez votre réseau et restez connecté avec votre communauté
                            </p>
                        </div>
                        <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg">
                            <UserPlus className="mr-2 h-4 w-4" />
                            Inviter des contacts
                        </Button>
                    </div>

                    {/* Stats Cards */}
                    {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-blue-100 text-sm font-medium">Amis</p>
                                        <p className="text-3xl font-bold mt-1">{acceptedFriends.length}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                        <UserCheck className="w-6 h-6" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-purple-100 text-sm font-medium">Demandes reçues</p>
                                        <p className="text-3xl font-bold mt-1">{pendingRequests.length}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                        <Clock className="w-6 h-6" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-pink-500 to-pink-600 text-white border-0">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-pink-100 text-sm font-medium">Invitations envoyées</p>
                                        <p className="text-3xl font-bold mt-1">{sentRequests.length}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                        <Mail className="w-6 h-6" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div> */}
                </div>

                {/* Tabs + Search */}
                <div className="bg-white rounded-xl shadow-sm mb-6 overflow-hidden">
                    <div className="flex flex-col md:flex-row justify-between items-center p-4 gap-4 border-b">
                        {/* Tabs */}
                        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                            <button
                                onClick={() => setActiveTab("friends")}
                                className={`px-6 py-2 rounded-md font-medium transition-all ${
                                    activeTab === "friends"
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
                                className={`px-6 py-2 rounded-md font-medium transition-all relative ${
                                    activeTab === "requests"
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
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 border-gray-200 focus:border-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Content */}
                {activeTab === "friends" && (
                    <div>
                        {filteredFriends.length === 0 ? (
                            <Card className="p-12 text-center bg-white/80">
                                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                                    {searchTerm ? "Aucun ami trouvé" : "Aucun ami pour le moment"}
                                </h3>
                                <p className="text-gray-500">
                                    {searchTerm
                                        ? "Essayez avec un autre terme de recherche"
                                        : "Commencez à construire votre réseau !"}
                                </p>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredFriends.map((conn) => {
                                    const user = usersMap[conn.userId]
                                    if (!user) return null

                                    return (
                                        <Card
                                            key={conn.userId}
                                            className="group hover:shadow-xl transition-all duration-300 overflow-hidden bg-white border-0 shadow-md"
                                        >
                                            {/* Cover gradient */}
                                            <div className="h-20 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400"></div>
                                            
                                            <CardContent className="p-6 -mt-10 relative">
                                                {/* Avatar */}
                                                <div className="flex justify-center mb-4">
                                                    <Avatar className="w-20 h-20 border-4 border-white shadow-lg ring-2 ring-blue-100">
                                                        <AvatarImage src={user.avatarUrl} />
                                                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xl">
                                                            {user.firstName[0]}{user.lastName[0]}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                </div>

                                                {/* Info */}
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

                                                {/* Actions */}
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
                                                        onClick={() => handleRemove(conn.userId, conn.senderId)}
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "requests" && (
                    <div className="space-y-6">
                        {/* Demandes reçues */}
                        {filteredRequests.length > 0 && (
                            <div>
                                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-purple-600" />
                                    Demandes d'amis reçues
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {filteredRequests.map((conn) => {
                                        const user = usersMap[conn.userId]
                                        if (!user) return null

                                        return (
                                            <Card
                                                key={conn.userId}
                                                className="hover:shadow-lg transition-all bg-white border-0 shadow-md"
                                            >
                                                <CardContent className="p-6">
                                                    <div className="flex items-start gap-4">
                                                        <Avatar className="w-16 h-16 ring-2 ring-purple-100">
                                                            <AvatarImage src={user.avatarUrl} />
                                                            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                                                                {user.firstName[0]}{user.lastName[0]}
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
                                                                    onClick={() => handleAccept(conn.userId)}
                                                                >
                                                                    <Check className="w-4 h-4 mr-1" />
                                                                    Accepter
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="border-gray-200 hover:border-red-500 hover:text-red-600"
                                                                    onClick={() => {
                                                                        if (currentUser?.id) {
                                                                            handleCancel(currentUser.id, conn.userId)
                                                                        }
                                                                    }}
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
                                    {sentRequests.map((conn) => {
                                        const user = usersMap[conn.userId]
                                        if (!user) return null

                                        return (
                                            <Card
                                                key={conn.userId}
                                                className="hover:shadow-lg transition-all bg-white border-0 shadow-md"
                                            >
                                                <CardContent className="p-6">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-4">
                                                            <Avatar className="w-14 h-14 ring-2 ring-pink-100">
                                                                <AvatarImage src={user.avatarUrl} />
                                                                <AvatarFallback className="bg-gradient-to-br from-pink-500 to-red-500 text-white">
                                                                    {user.firstName[0]}{user.lastName[0]}
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
                                                            onClick={() => {
                                                                if (currentUser?.id) {
                                                                    handleCancel(currentUser.id, conn.userId)
                                                                }
                                                            }}
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

                        {/* Empty state */}
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