import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Input } from "./ui/input"
import { Search } from "lucide-react"
import { JSX, useEffect, useState } from "react"
import {
  getUsers,
  sendConnectionRequest,
  updateConnectionStatus,
} from "@/app/controllers/usersController"
import { LinkStatus, UserLink, UserType } from "@/lib/firebase/models"
import { useDispatch, useSelector } from "react-redux"
import { selectUser } from "@/lib/redux/slices/currentUserSlice"
import { handleGetUserNameInitials } from "@/app/helpers/userHelper"
import { useRouter } from "next/navigation"
import { selectConnections, addConnection, updateConnectionStatusInStore } from "@/lib/redux/slices/connectionsSlice"

export const SearchPage = () => {
  const currentUser = useSelector(selectUser)
  const connections = useSelector(selectConnections) // 🔥 Connexions depuis Redux
  const [users, setUsers] = useState<UserType[]>([])
  const dispatch = useDispatch()
  const router = useRouter()

  // 🔹 Récupération des utilisateurs
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data: UserType[] = await getUsers()
        setUsers(data)
      } catch (error) {
        console.error("Erreur lors de la récupération des utilisateurs:", error)
      }
    }
    fetchUsers()
  }, [])

  // ✅ Envoyer une demande
  const handleConnectionRequest = async (userId: string) => {
    if (!currentUser?.id || !userId) return

    try {
      await sendConnectionRequest(
        currentUser.id,
        userId,
        currentUser.firstName,
        currentUser.lastName,
        currentUser.avatarUrl
      )

      // Dispatch Redux (optimiste)
      const optimisticRequest: UserLink = { 
        userId, 
        status: "pending" as LinkStatus, 
        senderId: currentUser.id 
      }
      dispatch(addConnection(optimisticRequest))
    } catch (error) {
      console.error("Erreur lors de l'envoi de la demande :", error)
    }
  }

  // ✅ Accepter une demande
  const handleAcceptRequest = async (userId: string) => {
    if (!currentUser?.id || !userId) return

    try {
      await updateConnectionStatus(
        userId, // senderId
        currentUser.id, // receiverId
        "accepted",
        currentUser.firstName,
        currentUser.lastName,
        currentUser.avatarUrl ?? ""
      )

      // Dispatch Redux (optimiste)
      dispatch(updateConnectionStatusInStore({
        userId,
        senderId: userId,
        status: "accepted" as LinkStatus
      }))
    } catch (error) {
      console.error("Erreur lors de l'acceptation :", error)
    }
  }

  // 🔹 Obtenir le statut depuis Redux
  const getConnectionStatus = (userId: string) => {
    if (!currentUser?.id) return { status: "none", isSender: false }

    const connection = connections.find(
      (c) =>
        (c.userId === currentUser.id && c.senderId === userId) ||
        (c.senderId === currentUser.id && c.userId === userId)
    )

    if (!connection) return { status: "none", isSender: false }
    const isSender = connection.senderId === currentUser.id
    return { status: connection.status, isSender }
  }

  // 🔹 Bouton en fonction du statut
  const renderConnectionButton = (user: UserType): JSX.Element | null => {
    if (!user.id) return null
    const { status, isSender } = getConnectionStatus(user.id)

    switch (status) {
      case "none":
        return (
          <Button
            size="sm"
            className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => handleConnectionRequest(user.id!)}
          >
            Envoyer une demande
          </Button>
        )

      case "pending":
        return isSender ? (
          <Button size="sm" disabled className="bg-gray-400 text-white cursor-not-allowed">
            Demande envoyée
          </Button>
        ) : (
          <Button
            size="sm"
            className="bg-yellow-500 hover:bg-yellow-600 text-white"
            onClick={() => handleAcceptRequest(user.id!)}
          >
            Accepter
          </Button>
        )

      case "accepted":
        return (
          <Button size="sm" disabled className="bg-green-600 text-white cursor-not-allowed">
            Amis
          </Button>
        )

      default:
        return null
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Recherche de familles</h1>
        <p className="text-gray-600">Trouvez d'autres familles et découvrez des connexions potentielles</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <Input placeholder="Nom de famille" />
            <Input placeholder="Prénom" />
            <Input placeholder="Lieu de naissance" />
            <Input placeholder="Période (ex: 1800-1900)" />
            <Input placeholder="Nationalité" />
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 lg:col-span-1">
              <Search className="mr-2 h-4 w-4" />
              Rechercher
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
        {users
          .filter((u) => u.id && u.id !== currentUser?.id)
          .map((user: UserType) => (
            <Card key={user.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12 flex-shrink-0">
                    <AvatarImage src={user.avatarUrl} />
                    <AvatarFallback>{handleGetUserNameInitials(user)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{user.firstName + " " + user.lastName}</CardTitle>
                    <CardDescription>Lyon, France • 15 membres</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                  Famille originaire de Lyon avec des racines remontant au 18ème siècle...
                </p>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
                  <Badge variant="outline">Public</Badge>
                  <div className="flex space-x-2 w-full sm:w-auto">
                    <Button
                      size="sm"
                      variant="outline"
                      className="transition-colors duration-200 bg-transparent"
                      onClick={() => router.push(`/wall/${user.id}`)}
                    >
                      Voir le profil
                    </Button>
                    {renderConnectionButton(user)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  )
}
