"use client"

import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { selectUser } from "@/lib/redux/slices/currentUserSlice"
import {
    getConnexionsByUserId,
    updateConnectionStatus,
    cancelConnectionRequest,
    deleteConnection,
    sendConnectionRequest,
} from "@/app/controllers/usersController"
import { UserLink, LinkStatus, UserType } from "@/lib/firebase/models"
import { Card, CardContent } from "./ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { UserPlus, Search } from "lucide-react"
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"

export const Connections = () => {
    const currentUser = useSelector(selectUser)
    const [connections, setConnections] = useState<UserLink[]>([])
    const [usersMap, setUsersMap] = useState<Record<string, UserType>>({})
    const [searchTerm, setSearchTerm] = useState("")
    const [filterStatus, setFilterStatus] = useState<"all" | LinkStatus>("all")

    // Charger les connexions Firestore
    useEffect(() => {
        if (!currentUser?.id) return
        const fetchConnections = async () => {
            if (currentUser.id) {
                try {
                    // 1. Récupérer les connexions
                    const data = await getConnexionsByUserId(currentUser.id)
                    setConnections(data)

                    // 2. Charger les infos des users liés
                    const usersMapTemp: Record<string, UserType> = {}

                    for (const conn of data) {
                        try {
                            // Ici on suppose que conn.userId correspond bien à l'UID Firebase du user
                            const userDocRef = doc(db, "Users", conn.userId) // ⚡ Attention : "Users" avec majuscule
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
                } catch (error) {
                    console.error("Erreur lors du chargement des connexions :", error)
                }
            }
        }
        fetchConnections()
    }, [currentUser])

    // Accepter une connexion
    const handleAccept = async (userId: string) => {
        if (!currentUser?.id) return
        await updateConnectionStatus(currentUser.id, userId, "accepted")
        setConnections((prev) =>
            prev.map((c) => (c.userId === userId ? { ...c, status: "accepted" } : c))
        )
    }

    // Annuler une demande
    const handleCancel = async (userId: string) => {
        if (!currentUser?.id) return
        await cancelConnectionRequest(currentUser.id, userId)
        setConnections((prev) => prev.filter((c) => c.userId !== userId))
    }

    // Supprimer un ami
    const handleRemove = async (userId: string) => {
        if (!currentUser?.id) return
        await deleteConnection(currentUser.id, userId)
        setConnections((prev) => prev.filter((c) => c.userId !== userId))
    }

    // Badge selon statut
    const getStatusBadge = (status: LinkStatus) => {
        switch (status) {
            case "accepted":
                return <Badge className="bg-green-100 text-green-800">Ami</Badge>
            case "pending":
                return <Badge className="bg-yellow-100 text-yellow-800">En attente</Badge>
            default:
                return null
        }
    }

    // Filtrage
    const filteredConnections = connections.filter((c) => {
        const user = usersMap[c.userId]
        const matchesSearch = user
            ? `${user.firstName} ${user.lastName}`
                .toLowerCase()
                .includes(searchTerm.toLowerCase())
            : false
        const matchesStatus = filterStatus === "all" || c.status === filterStatus
        return matchesSearch && matchesStatus
    })

    return (
        <div className="animate-fade-in p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Mes connexions</h1>
                    <p className="text-gray-600">Gérez vos relations ({filteredConnections.length})</p>
                </div>
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Inviter des contacts
                </Button>
            </div>

            {/* Filters */}
            <Card className="mb-6">
                <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                            placeholder="Rechercher..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <div>
                        <Select
                            value={filterStatus}
                            onValueChange={(value) => setFilterStatus(value as LinkStatus | "all")}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Statut" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tous</SelectItem>
                                <SelectItem value="accepted">Amis</SelectItem>
                                <SelectItem value="pending">En attente</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Connections Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {connections.map((conn) => {
                    const user = usersMap[conn.userId]
                    const isSender = conn.senderId === currentUser?.id 
                    const isReceiver = !isSender 
                    console.log(conn.senderId)
                    return (
                        <Card key={conn.userId} className="p-6 hover:shadow-lg transition-shadow">
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex justify-between items-center space-x-2">
                                    <Avatar>
                                        <AvatarImage src={user?.avatarUrl} />
                                        <AvatarFallback>{user ? user.firstName[0] + user.lastName[0] : "U"}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="font-bold text-lg">{user ? `${user.firstName} ${user.lastName}` : "Utilisateur"}</h3>
                                    </div>
                                </div>
                                <div>
                                    {getStatusBadge(conn.status)}
                                </div>
                            </div>

                            <div className="flex justify-between mt-4">
                                {conn.status === "pending" && isReceiver && (
                                    <>
                                        <Button size="sm" variant="outline" onClick={() => handleCancel(conn.userId)}>
                                            Refuser
                                        </Button>
                                        <Button size="sm" onClick={() => handleAccept(conn.userId)}>
                                            Accepter
                                        </Button>
                                    </>
                                )}
                                {conn.status === "pending" && isSender && (
                                    <Button size="sm" variant="outline" onClick={() => handleCancel(conn.userId)}>
                                        Annuler la demande
                                    </Button>
                                )}
                                {conn.status === "accepted" && (
                                    <Button size="sm" variant="outline" onClick={() => handleRemove(conn.userId)}>
                                        Supprimer
                                    </Button>
                                )}
                            </div>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}
