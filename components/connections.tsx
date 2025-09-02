import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Button } from "./ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Badge } from "./ui/badge"
import { Input } from "@/components/ui/input"

import {
    MapPin,
    Calendar,
    Users,
    MessageCircle,
    UserPlus,
    Search
} from "lucide-react"

interface Connection {
    id: string
    name: string
    avatar: string
    initials: string
    relationship: string
    location: string
    joinDate: string
    mutualConnections: number
    isOnline: boolean
    lastActive: string
    email?: string
    phone?: string
    website?: string
    bio: string
    sharedAncestors: string[]
    connectionType: "family" | "researcher" | "friend"
    status: "connected" | "pending" | "blocked"
}

const mockConnections: Connection[] = [
    {
        id: "1",
        name: "Marie Dubois",
        avatar: "/placeholder.svg?height=60&width=60",
        initials: "MD",
        relationship: "Cousine éloignée",
        location: "Lyon, France",
        joinDate: "2023-03-15",
        mutualConnections: 12,
        isOnline: true,
        lastActive: "En ligne",
        email: "marie.dubois@email.com",
        bio: "Passionnée de généalogie depuis 15 ans, spécialisée dans les familles lyonnaises du 19ème siècle.",
        sharedAncestors: ["Pierre Dupont", "Marie Martin"],
        connectionType: "family",
        status: "connected",
    },
    {
        id: "2",
        name: "Pierre Martin",
        avatar: "/placeholder.svg?height=60&width=60",
        initials: "PM",
        relationship: "Arrière-petit-cousin",
        location: "Paris, France",
        joinDate: "2023-01-20",
        mutualConnections: 8,
        isOnline: false,
        lastActive: "Il y a 2 heures",
        phone: "+33 1 23 45 67 89",
        bio: "Historien amateur, je recherche les traces de ma famille dans les archives parisiennes.",
        sharedAncestors: ["Jean Dupont"],
        connectionType: "family",
        status: "connected",
    },
    {
        id: "3",
        name: "Sophie Bernard",
        avatar: "/placeholder.svg?height=60&width=60",
        initials: "SB",
        relationship: "Chercheuse",
        location: "Marseille, France",
        joinDate: "2023-05-10",
        mutualConnections: 5,
        isOnline: false,
        lastActive: "Il y a 1 jour",
        website: "www.genealogie-provence.fr",
        bio: "Généalogiste professionnelle spécialisée dans les familles provençales.",
        sharedAncestors: ["Claire Bernard"],
        connectionType: "researcher",
        status: "connected",
    },
    {
        id: "4",
        name: "Jean-Luc Petit",
        avatar: "/placeholder.svg?height=60&width=60",
        initials: "JP",
        relationship: "Ami généalogiste",
        location: "Bordeaux, France",
        joinDate: "2023-02-28",
        mutualConnections: 15,
        isOnline: true,
        lastActive: "En ligne",
        email: "jl.petit@email.com",
        bio: "Membre actif de plusieurs associations généalogiques, toujours prêt à aider.",
        sharedAncestors: ["Louise Petit"],
        connectionType: "friend",
        status: "connected",
    },
    {
        id: "5",
        name: "Anne Moreau",
        avatar: "/placeholder.svg?height=60&width=60",
        initials: "AM",
        relationship: "Demande en attente",
        location: "Toulouse, France",
        joinDate: "2023-06-01",
        mutualConnections: 3,
        isOnline: false,
        lastActive: "Il y a 3 jours",
        bio: "Nouvelle sur la plateforme, je recherche des informations sur la famille Moreau.",
        sharedAncestors: [],
        connectionType: "family",
        status: "pending",
    },
]

export const Connections = () => {
    const [searchTerm, setSearchTerm] = useState("")
    const [filterType, setFilterType] = useState("all")
    const [filterStatus, setFilterStatus] = useState("all")
    const [connections, setConnections] = useState(mockConnections)
    const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null)

    const filteredConnections = connections.filter((connection) => {
        const matchesSearch =
            connection.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            connection.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
            connection.relationship.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesType = filterType === "all" || connection.connectionType === filterType
        const matchesStatus = filterStatus === "all" || connection.status === filterStatus

        return matchesSearch && matchesType && matchesStatus
    })

    const handleAcceptConnection = (connectionId: string) => {
        setConnections((prev) =>
            prev.map((conn) => (conn.id === connectionId ? { ...conn, status: "connected" as const } : conn)),
        )
    }

    const handleRejectConnection = (connectionId: string) => {
        setConnections((prev) => prev.filter((conn) => conn.id !== connectionId))
    }

    const handleRemoveConnection = (connectionId: string) => {
        setConnections((prev) => prev.filter((conn) => conn.id !== connectionId))
    }

    const getConnectionTypeLabel = (type: string) => {
        switch (type) {
            case "family":
                return "Famille"
            case "researcher":
                return "Chercheur"
            case "friend":
                return "Ami"
            default:
                return type
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "connected":
                return <Badge className="bg-green-100 text-green-800">Connecté</Badge>
            case "pending":
                return <Badge className="bg-yellow-100 text-yellow-800">En attente</Badge>
            case "blocked":
                return <Badge className="bg-red-100 text-red-800">Bloqué</Badge>
            default:
                return null
        }
    }

    return (
        <div className="animate-fade-in">
            <div className="p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 animate-fade-in">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 mb-2">Mes connexions</h1>
                            <p className="text-gray-600">
                                Gérez votre réseau de contacts généalogiques ({filteredConnections.length} connexions)
                            </p>
                        </div>
                        <div className="flex items-center space-x-4 mt-4 md:mt-0">
                            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                                <UserPlus className="mr-2 h-4 w-4" />
                                Inviter des contacts
                            </Button>
                        </div>
                    </div>

                    {/* Filters */}
                    <Card className="mb-6 animate-slide-up">
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="md:col-span-2">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                        <Input
                                            placeholder="Rechercher par nom, lieu ou relation..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Select value={filterType} onValueChange={setFilterType}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Type de connexion" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Tous les types</SelectItem>
                                            <SelectItem value="family">Famille</SelectItem>
                                            <SelectItem value="researcher">Chercheur</SelectItem>
                                            <SelectItem value="friend">Ami</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Statut" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Tous les statuts</SelectItem>
                                            <SelectItem value="connected">Connecté</SelectItem>
                                            <SelectItem value="pending">En attente</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Connections Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredConnections.map((connection, index) => (
                            <Card
                                key={connection.id}
                                className="hover:shadow-lg transition-shadow cursor-pointer animate-slide-up"
                                style={{ animationDelay: `${index * 0.1}s` }}
                                onClick={() => setSelectedConnection(connection)}
                            >
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="relative">
                                                <Avatar className="h-12 w-12">
                                                    <AvatarImage src={connection.avatar || "/placeholder.svg"} />
                                                    <AvatarFallback>{connection.initials}</AvatarFallback>
                                                </Avatar>
                                                {connection.isOnline && (
                                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-800">{connection.name}</h3>
                                                <p className="text-sm text-gray-600">{connection.relationship}</p>
                                            </div>
                                        </div>
                                        {getStatusBadge(connection.status)}
                                    </div>

                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center text-sm text-gray-600">
                                            <MapPin className="h-4 w-4 mr-2" />
                                            {connection.location}
                                        </div>
                                        <div className="flex items-center text-sm text-gray-600">
                                            <Calendar className="h-4 w-4 mr-2" />
                                            Membre depuis {new Date(connection.joinDate).toLocaleDateString("fr-FR")}
                                        </div>
                                        <div className="flex items-center text-sm text-gray-600">
                                            <Users className="h-4 w-4 mr-2" />
                                            {connection.mutualConnections} connexions communes
                                        </div>
                                    </div>

                                    <p className="text-sm text-gray-700 mb-4 line-clamp-2">{connection.bio}</p>

                                    {connection.sharedAncestors.length > 0 && (
                                        <div className="mb-4">
                                            <p className="text-xs text-gray-500 mb-2">Ancêtres communs :</p>
                                            <div className="flex flex-wrap gap-1">
                                                {connection.sharedAncestors.map((ancestor, i) => (
                                                    <Badge key={i} variant="secondary" className="text-xs">
                                                        {ancestor}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between">
                                        <Badge variant="outline">{getConnectionTypeLabel(connection.connectionType)}</Badge>
                                        <div className="flex items-center space-x-2">
                                            {connection.status === "pending" ? (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleRejectConnection(connection.id)
                                                        }}
                                                    >
                                                        Refuser
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleAcceptConnection(connection.id)
                                                        }}
                                                    >
                                                        Accepter
                                                    </Button>
                                                </>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        // Ouvrir conversation
                                                    }}
                                                >
                                                    <MessageCircle className="h-4 w-4 mr-1" />
                                                    Message
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {filteredConnections.length === 0 && (
                        <div className="text-center py-12 animate-fade-in">
                            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">Aucune connexion trouvée</h3>
                            <p className="text-gray-500">
                                {searchTerm || filterType !== "all" || filterStatus !== "all"
                                    ? "Essayez de modifier vos critères de recherche"
                                    : "Commencez à construire votre réseau en invitant des contacts"}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
