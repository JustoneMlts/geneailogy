"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  TreePine,
  MessageCircle,
  Search,
  Users,
  MapPin,
  Calendar,
  UserPlus,
  UserMinus,
  Mail,
  Phone,
  Globe,
  Menu,
  X,
  Bell,
  Home,
  Sparkles,
  User,
  PinIcon,
  PinOffIcon,
} from "lucide-react"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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

function DesktopSidebar({
  activeTab,
  setActiveTab,
  isExpanded,
  setIsExpanded,
  isPinned,
  setIsPinned,
}: {
  activeTab: string
  setActiveTab: (tab: string) => void
  isExpanded: boolean
  setIsExpanded: (expanded: boolean) => void
  isPinned: boolean
  setIsPinned: (pinned: boolean) => void
}) {
  const [showText, setShowText] = useState(isPinned)

  const menuItems = [
    { id: "feed", label: "Feed", icon: Home, href: "/dashboard" },
    { id: "notifications", label: "Notifications", icon: Bell, badge: 3, href: "/dashboard" },
    { id: "tree", label: "Mon arbre", icon: TreePine, href: "/dashboard" },
    { id: "ai", label: "Suggestions IA", icon: Sparkles, href: "/dashboard" },
    { id: "search", label: "Recherche", icon: Search, href: "/dashboard" },
    { id: "connections", label: "Connexions", icon: Users, href: "/connections" },
    { id: "messages", label: "Messages", icon: MessageCircle, href: "/dashboard" },
  ]

  const handleMouseEnter = () => {
    if (!isPinned) {
      setIsExpanded(true)
      setTimeout(() => setShowText(true), 200)
    }
  }

  const handleMouseLeave = () => {
    if (!isPinned) {
      setShowText(false)
      setTimeout(() => setIsExpanded(false), 150)
    }
  }

  const handlePinToggle = () => {
    const newPinnedState = !isPinned
    setIsPinned(newPinnedState)

    if (newPinnedState) {
      setIsExpanded(true)
      setTimeout(() => setShowText(true), 200)
    } else {
      setShowText(false)
      setTimeout(() => setIsExpanded(false), 150)
    }
  }

  useEffect(() => {
    if (isPinned) {
      setIsExpanded(true)
      setShowText(true)
    } else {
      setShowText(false)
      setIsExpanded(false)
    }
  }, [isPinned])

  const shouldShowText = isExpanded && (isPinned || showText)

  return (
    <div
      className={`hidden md:flex flex-col h-screen bg-white border-r border-gray-200 transition-all duration-300 ease-in-out ${
        isExpanded ? "w-64" : "w-16"
      } fixed left-0 top-0 z-40 shadow-lg`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 min-h-[73px] flex items-center">
        <div className="flex items-center justify-between w-full">
          <Link href="/dashboard" className="flex items-center space-x-3">
            <TreePine className="h-8 w-8 text-blue-600 flex-shrink-0" />
            <span
              className={`text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent whitespace-nowrap transition-all duration-200 ${
                shouldShowText ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
              }`}
            >
              GeneAIlogy
            </span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePinToggle}
            className={`h-6 w-6 flex-shrink-0 transition-all duration-200 ${
              shouldShowText ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
            }`}
          >
            {isPinned ? <PinOffIcon className="h-4 w-4" /> : <PinIcon className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Menu Items */}
      <div className="flex-1 py-4">
        <nav className="space-y-2 px-2">
          {menuItems.map((item) => (
            <Link key={item.id} href={item.href || "/dashboard"}>
              <button
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                  activeTab === item.id
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span
                  className={`whitespace-nowrap transition-all duration-200 ${
                    shouldShowText ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                  }`}
                >
                  {item.label}
                </span>
                {item.badge && (
                  <Badge
                    className={`ml-auto bg-red-500 text-white text-xs transition-all duration-200 ${
                      shouldShowText ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
                    }`}
                  >
                    {item.badge}
                  </Badge>
                )}
              </button>
            </Link>
          ))}
        </nav>
      </div>

      {/* Profile */}
      <div className="p-4 border-t border-gray-200">
        <Link href="/profile">
          <button
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900`}
          >
            <div className="flex justify-center w-5">
              <Avatar className="h-6 w-6">
                <AvatarImage src="/placeholder.svg?height=24&width=24" />
                <AvatarFallback className="text-xs">JD</AvatarFallback>
              </Avatar>
            </div>
            <span
              className={`whitespace-nowrap transition-all duration-200 ${
                shouldShowText ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
              }`}
            >
              Jean Dupont
            </span>
          </button>
        </Link>
      </div>
    </div>
  )
}

function MobileHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const menuItems = [
    { id: "feed", label: "Feed", icon: Home, href: "/dashboard" },
    { id: "notifications", label: "Notifications", icon: Bell, badge: 3, href: "/dashboard" },
    { id: "tree", label: "Mon arbre", icon: TreePine, href: "/dashboard" },
    { id: "ai", label: "Suggestions IA", icon: Sparkles, href: "/dashboard" },
    { id: "search", label: "Recherche", icon: Search, href: "/dashboard" },
    { id: "connections", label: "Connexions", icon: Users, href: "/connections" },
    { id: "messages", label: "Messages", icon: MessageCircle, href: "/dashboard" },
  ]

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <Link href="/dashboard" className="flex items-center space-x-3">
          <TreePine className="h-8 w-8 text-blue-600" />
          <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            GeneAIlogy
          </span>
        </Link>
        <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 shadow-lg">
          <nav className="py-2">
            {menuItems.map((item) => (
              <Link key={item.id} href={item.href || "/dashboard"}>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full flex items-center space-x-3 px-4 py-3 transition-colors text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                  {item.badge && <Badge className="ml-auto bg-red-500 text-white text-xs">{item.badge}</Badge>}
                </button>
              </Link>
            ))}
            <Link href="/profile">
              <button
                onClick={() => setIsMenuOpen(false)}
                className="w-full flex items-center space-x-3 px-4 py-3 transition-colors text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              >
                <User className="h-5 w-5" />
                <span>Profil</span>
              </button>
            </Link>
          </nav>
        </div>
      )}
    </>
  )
}

export default function ConnectionsPage() {
  const [activeTab, setActiveTab] = useState("connections")
  const [isExpanded, setIsExpanded] = useState(false)
  const [isPinned, setIsPinned] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [connections, setConnections] = useState(mockConnections)
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null)

  // Calculer la marge gauche dynamiquement
  const getLeftMargin = () => {
    if (isExpanded || isPinned) {
      return "md:ml-64"
    }
    return "md:ml-16"
  }

  // Filtrer les connexions
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-green-50">
      {/* Desktop Sidebar */}
      <DesktopSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
        isPinned={isPinned}
        setIsPinned={setIsPinned}
      />

      {/* Mobile Header */}
      <MobileHeader />

      {/* Main Content */}
      <div className={`transition-all duration-300 ease-in-out ${getLeftMargin()}`}>
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

      {/* Connection Detail Modal */}
      {selectedConnection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={selectedConnection.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="text-xl">{selectedConnection.initials}</AvatarFallback>
                    </Avatar>
                    {selectedConnection.isOnline && (
                      <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-2xl">{selectedConnection.name}</CardTitle>
                    <CardDescription className="text-lg">{selectedConnection.relationship}</CardDescription>
                    <p className="text-sm text-gray-500 mt-1">{selectedConnection.lastActive}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedConnection(null)}>
                  <X className="h-6 w-6" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Contact Info */}
              <div>
                <h3 className="font-semibold mb-3">Informations de contact</h3>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <MapPin className="h-4 w-4 mr-3 text-gray-400" />
                    {selectedConnection.location}
                  </div>
                  {selectedConnection.email && (
                    <div className="flex items-center text-sm">
                      <Mail className="h-4 w-4 mr-3 text-gray-400" />
                      {selectedConnection.email}
                    </div>
                  )}
                  {selectedConnection.phone && (
                    <div className="flex items-center text-sm">
                      <Phone className="h-4 w-4 mr-3 text-gray-400" />
                      {selectedConnection.phone}
                    </div>
                  )}
                  {selectedConnection.website && (
                    <div className="flex items-center text-sm">
                      <Globe className="h-4 w-4 mr-3 text-gray-400" />
                      <a href={selectedConnection.website} className="text-blue-600 hover:underline">
                        {selectedConnection.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Bio */}
              <div>
                <h3 className="font-semibold mb-3">À propos</h3>
                <p className="text-gray-700">{selectedConnection.bio}</p>
              </div>

              {/* Shared Ancestors */}
              {selectedConnection.sharedAncestors.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Ancêtres communs</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedConnection.sharedAncestors.map((ancestor, i) => (
                      <Badge key={i} variant="secondary">
                        {ancestor}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats */}
              <div>
                <h3 className="font-semibold mb-3">Statistiques</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{selectedConnection.mutualConnections}</div>
                    <div className="text-sm text-gray-600">Connexions communes</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {Math.floor(
                        (Date.now() - new Date(selectedConnection.joinDate).getTime()) / (1000 * 60 * 60 * 24),
                      )}
                    </div>
                    <div className="text-sm text-gray-600">Jours sur la plateforme</div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center space-x-2">
                  {getStatusBadge(selectedConnection.status)}
                  <Badge variant="outline">{getConnectionTypeLabel(selectedConnection.connectionType)}</Badge>
                </div>
                <div className="flex items-center space-x-2">
                  {selectedConnection.status === "connected" && (
                    <>
                      <Button variant="outline" size="sm">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Message
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleRemoveConnection(selectedConnection.id)}>
                        <UserMinus className="h-4 w-4 mr-2" />
                        Supprimer
                      </Button>
                    </>
                  )}
                  {selectedConnection.status === "pending" && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => handleRejectConnection(selectedConnection.id)}>
                        Refuser
                      </Button>
                      <Button size="sm" onClick={() => handleAcceptConnection(selectedConnection.id)}>
                        Accepter
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
