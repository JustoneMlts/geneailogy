import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Button } from "./ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Label } from "./ui/label"
import { Badge } from "./ui/badge"
import {
    MapPin,
    Calendar,
    Crown,
} from "lucide-react"
import { useState } from "react"
import { useDispatch } from "react-redux"
import { setActiveTab } from "@/lib/redux/slices/uiSlice"

export const Ai = () => {
    const dispatch = useDispatch()
    const [conversations, setConversations] = useState([
        {
            id: 1,
            name: "Marie Dubois",
            avatar: "/placeholder.svg?height=40&width=40",
            initials: "MD",
            lastMessage: "Merci pour les informations sur...",
            unreadCount: 2,
            isOnline: true,
            messages: [
                {
                    id: 1,
                    text: "Bonjour ! J'ai vu que nous avons des ancêtres communs à Lyon.",
                    sender: "other",
                    timestamp: "10:30",
                },
                {
                    id: 2,
                    text: "Oui, c'est fascinant ! Pouvez-vous me dire plus sur la famille Dupont ?",
                    sender: "me",
                    timestamp: "10:35",
                },
            ],
        },
    ])

    const [suggestions, setSuggestions] = useState([
        {
            id: 1,
            name: "Pierre Dupont",
            avatar: "/placeholder.svg?height=40&width=40",
            initials: "PD",
            relationship: "Possible cousin",
            match: 85,
            badges: ["Même nom de famille", "Région similaire"],
            isRemoving: false,
        },
        {
            id: 2,
            name: "Marie Dubois",
            avatar: "/placeholder.svg?height=40&width=40",
            initials: "MD",
            relationship: "Possible tante",
            match: 78,
            badges: ["Même région", "Période similaire"],
            isRemoving: false,
        },
        {
            id: 3,
            name: "Jean Martin",
            avatar: "/placeholder.svg?height=40&width=40",
            initials: "JM",
            relationship: "Possible grand-oncle",
            match: 72,
            badges: ["Même ville", "Métier similaire"],
            isRemoving: false,
        },
    ])

    const [selectedConversation, setSelectedConversation] = useState(conversations[0])


    // Ajouter après les autres fonctions helper
    const handleIgnoreSuggestion = (suggestionId: number) => {
        // Marquer la suggestion comme en cours de suppression pour déclencher l'animation
        setSuggestions((prev) =>
            prev.map((suggestion) => (suggestion.id === suggestionId ? { ...suggestion, isRemoving: true } : suggestion)),
        )

        // Supprimer définitivement après l'animation
        setTimeout(() => {
            setSuggestions((prev) => prev.filter((suggestion) => suggestion.id !== suggestionId))
        }, 300)
    }

    const handleContactSuggestion = (suggestion: any) => {
        // Vérifier si une conversation existe déjà
        const existingConversation = conversations.find((conv) => conv.name === suggestion.name)

        if (existingConversation) {
            // Si la conversation existe, la sélectionner et aller aux messages
            setSelectedConversation(existingConversation)
            dispatch(setActiveTab("messages"))
        } else {
            // Créer une nouvelle conversation
            const newConversation = {
                id: Date.now(),
                name: suggestion.name,
                avatar: suggestion.avatar,
                initials: suggestion.initials,
                lastMessage: "Nouvelle conversation",
                unreadCount: 0,
                isOnline: false,
                messages: [
                    {
                        id: 1,
                        text: `Bonjour ${suggestion.name} ! J'ai vu votre profil dans les suggestions IA. Nous semblons avoir des liens familiaux potentiels (${suggestion.relationship.toLowerCase()}, ${suggestion.match}% de correspondance). J'aimerais en savoir plus sur votre famille.`,
                        sender: "me",
                        timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
                    },
                ],
            }

            // Ajouter la nouvelle conversation
            setConversations((prev) => [newConversation, ...prev])
            setSelectedConversation(newConversation)

            // Supprimer la suggestion de la liste
            setSuggestions((prev) => prev.filter((s) => s.id !== suggestion.id))

            // Aller à l'onglet messages
            setActiveTab("messages")
        }
    }

    return (
        <div className="animate-fade-in max-w-7xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6 animate-slide-up">Suggestions IA</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="shadow-md border-0 animate-slide-up animate-stagger-1 card-hover">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">Connexions potentielles</CardTitle>
                                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">IA</Badge>
                            </div>
                            <CardDescription>
                                Personnes qui pourraient être liées à votre arbre généalogique, basées sur l'analyse IA
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {suggestions.map((suggestion, index) => (
                                    <div
                                        key={suggestion.id}
                                        className={`bg-white border border-gray-100 rounded-lg p-4 transition-all duration-300 animate-slide-up ${suggestion.isRemoving ? "opacity-0 transform translate-x-full" : ""
                                            }`}
                                        style={{ animationDelay: `${index * 0.1}s` }}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <Avatar className="animate-scale-in">
                                                    <AvatarImage src={suggestion.avatar || "/placeholder.svg"} />
                                                    <AvatarFallback>{suggestion.initials}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="font-semibold">{suggestion.name}</div>
                                                    <div className="text-xs text-gray-500 flex items-center">
                                                        <span>{suggestion.relationship}</span>
                                                        <span className="mx-2">•</span>
                                                        <span className="text-blue-600 font-medium">
                                                            {suggestion.match}% de correspondance
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-gray-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors duration-200 bg-transparent"
                                                    onClick={() => handleIgnoreSuggestion(suggestion.id)}
                                                >
                                                    Ignorer
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transition-colors duration-200"
                                                    onClick={() => handleContactSuggestion(suggestion)}
                                                >
                                                    Contacter
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {suggestion.badges.map((badge, i) => (
                                                <Badge
                                                    key={i}
                                                    variant="secondary"
                                                    className="text-xs bg-gray-100 text-gray-700 animate-scale-in"
                                                >
                                                    {badge}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-md border-0 animate-slide-up animate-stagger-2 card-hover">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">Informations manquantes</CardTitle>
                                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">IA</Badge>
                            </div>
                            <CardDescription>
                                L'IA a identifié des informations qui pourraient compléter votre arbre généalogique
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="bg-white border border-gray-100 rounded-lg p-4 animate-slide-up animate-stagger-1">
                                    <div className="flex items-start space-x-3">
                                        <div className="bg-amber-100 p-2 rounded-full">
                                            <Calendar className="h-5 w-5 text-amber-600" />
                                        </div>
                                        <div>
                                            <div className="font-semibold">Date de naissance manquante</div>
                                            <div className="text-sm text-gray-600 mt-1">
                                                La date de naissance de <span className="font-medium">Sophie Dupont</span> est
                                                manquante. Basé sur d'autres informations, elle est probablement née entre 1975 et 1980.
                                            </div>
                                            <div className="mt-3">
                                                <Button size="sm" className="transition-colors duration-200">
                                                    Ajouter cette information
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white border border-gray-100 rounded-lg p-4 animate-slide-up animate-stagger-2">
                                    <div className="flex items-start space-x-3">
                                        <div className="bg-blue-100 p-2 rounded-full">
                                            <MapPin className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <div className="font-semibold">Lieu de naissance manquant</div>
                                            <div className="text-sm text-gray-600 mt-1">
                                                Le lieu de naissance de <span className="font-medium">Lucas Dupont</span> est manquante.
                                                Basé sur les résidences familiales, il est probablement né à Paris ou Marseille.
                                            </div>
                                            <div className="mt-3">
                                                <Button size="sm" className="transition-colors duration-200">
                                                    Ajouter cette information
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="shadow-md border-0 animate-slide-up animate-stagger-1 card-hover">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Statistiques IA</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between animate-slide-up animate-stagger-1">
                                    <div className="text-sm text-gray-600">Suggestions totales</div>
                                    <div className="font-semibold">24</div>
                                </div>
                                <div className="flex items-center justify-between animate-slide-up animate-stagger-2">
                                    <div className="text-sm text-gray-600">Suggestions acceptées</div>
                                    <div className="font-semibold">16</div>
                                </div>
                                <div className="flex items-center justify-between animate-slide-up animate-stagger-3">
                                    <div className="text-sm text-gray-600">Précision</div>
                                    <div className="font-semibold">87%</div>
                                </div>
                                <div className="flex items-center justify-between animate-slide-up animate-stagger-4">
                                    <div className="text-sm text-gray-600">Nouvelles suggestions</div>
                                    <div className="font-semibold text-blue-600">3</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-md border-0 animate-slide-up animate-stagger-2 card-hover">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Paramètres IA</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="space-y-2 animate-slide-up animate-stagger-1">
                                    <Label htmlFor="match-threshold">Seuil de correspondance minimum</Label>
                                    <Select defaultValue="70">
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sélectionner un seuil" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="50">50% (Plus de suggestions)</SelectItem>
                                            <SelectItem value="70">70% (Équilibré)</SelectItem>
                                            <SelectItem value="90">90% (Haute précision)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2 animate-slide-up animate-stagger-2">
                                    <Label htmlFor="suggestion-types">Types de suggestions</Label>
                                    <Select defaultValue="all">
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sélectionner les types" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Toutes les suggestions</SelectItem>
                                            <SelectItem value="connections">Connexions familiales uniquement</SelectItem>
                                            <SelectItem value="missing">Informations manquantes uniquement</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="pt-2 animate-slide-up animate-stagger-3">
                                    <Button className="w-full transition-colors duration-200">Appliquer les paramètres</Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-md border-0 animate-slide-up animate-stagger-3 card-hover">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Abonnement Premium</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center space-y-4">
                                <div className="mx-auto w-12 h-12 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center animate-scale-in">
                                    <Crown className="h-6 w-6 text-white" />
                                </div>
                                <div className="animate-slide-up animate-stagger-1">
                                    <h3 className="font-semibold">Débloquez toutes les fonctionnalités IA</h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Accédez à des suggestions illimitées et à des analyses avancées
                                    </p>
                                </div>
                                <Button className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-white transition-colors duration-200 animate-slide-up animate-stagger-2">
                                    Passer à Premium
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}