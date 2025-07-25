import { MessageCircle, Sparkles, TreePine, User } from "lucide-react"
import { Card, CardContent } from "./ui/card"

export const Notifications = () => {
    return (
        <div className="animate-fade-in">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Notifications</h1>
                <p className="text-gray-600">Restez informé des dernières activités sur votre arbre généalogique</p>
            </div>

            <div className="space-y-4">
                {[
                    {
                        type: "suggestion",
                        title: "Nouvelle suggestion IA",
                        message: "3 nouveaux liens familiaux potentiels ont été trouvés",
                        time: "Il y a 2 heures",
                        unread: true,
                    },
                    {
                        type: "message",
                        title: "Nouveau message",
                        message: "Marie Dubois vous a envoyé un message",
                        time: "Il y a 4 heures",
                        unread: true,
                    },
                    {
                        type: "connection",
                        title: "Nouvelle connexion",
                        message: "Pierre Martin a accepté votre demande de connexion",
                        time: "Hier",
                        unread: false,
                    },
                    {
                        type: "update",
                        title: "Mise à jour d'arbre",
                        message: "Sophie Dupont a ajouté de nouvelles informations",
                        time: "Il y a 2 jours",
                        unread: false,
                    },
                ].map((notification, index) => (
                    <Card key={index} className={`${notification.unread ? "border-blue-200 bg-blue-50" : ""}`}>
                        <CardContent className="p-4">
                            <div className="flex items-start space-x-4">
                                <div className="flex-shrink-0">
                                    {notification.type === "suggestion" && <Sparkles className="h-5 w-5 text-purple-600" />}
                                    {notification.type === "message" && <MessageCircle className="h-5 w-5 text-blue-600" />}
                                    {notification.type === "connection" && <User className="h-5 w-5 text-green-600" />}
                                    {notification.type === "update" && <TreePine className="h-5 w-5 text-orange-600" />}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold mb-1">{notification.title}</h3>
                                    <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                                    <p className="text-xs text-gray-500">{notification.time}</p>
                                </div>
                                {notification.unread && <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}