import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Input } from "./ui/input";
import {
  Search,
} from "lucide-react"
import { use, useEffect, useState } from "react";
import { getUserById, getUsers } from "@/app/controllers/usersController";
import { ConnexionType, LinkStatus, UserLink, UserType } from "@/lib/firebase/models";
import { useDispatch, useSelector } from "react-redux";
import { selectUser } from "@/lib/redux/slices/currentUserSlice";
import { handleGetUserNameInitials } from "@/app/helpers/userHelper";
import { useRouter } from "next/navigation"
import { getConnexionsByUserId, sendConnectionRequest } from "@/app/controllers/usersController";

export const SearchPage = () => {
  const currentUser = useSelector(selectUser)
  const [users, setUsers] = useState<UserType[]>([])
  const [connectionRequests, setConnectionRequests] = useState<UserLink[]>([])
  const dispatch = useDispatch()
  const router = useRouter()

  useEffect(() => {
    const fetchUsers = async () => {
      const data = await getUsers();
      setUsers(data);
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchConnexionsIds = async () => {
      if (currentUser?.id) {
        const data = await getConnexionsByUserId(currentUser.id);
        setConnectionRequests(data)
      }
    }
    fetchConnexionsIds();
  }, [currentUser])

  const handleConnectionRequest = async (userId: string) => {
    if (!currentUser?.id) return;
    
    try {
      const newRequest = await sendConnectionRequest(currentUser.id, userId);
      
      // Mise à jour optimiste de l'état local
      const updatedRequest: UserLink = {
        userId: userId, // Utiliser l'userId passé en paramètre
        status: "pending", // Status par défaut pour une nouvelle demande
        senderId: currentUser.id
      };
      
      setConnectionRequests((prev) => {
        // Filtrer les anciennes connexions avec cet utilisateur
        const filtered = prev.filter((c) => c.userId !== userId);
        // Ajouter la nouvelle connexion
        return [...filtered, updatedRequest];
      });
      
    } catch (error) {
      console.error("Erreur lors de l'envoi de la demande :", error);
      // En cas d'erreur, on pourrait recharger les données
      if (currentUser?.id) {
        const data = await getConnexionsByUserId(currentUser.id);
        setConnectionRequests(data);
      }
    }
  };

  const handleAcceptRequest = async (userId: string) => {
    if (!currentUser?.id) return;
    
    try {
      // Appeler votre fonction d'acceptation (à créer si elle n'existe pas)
      // await acceptConnectionRequest(currentUser.id, userId);
      
      // Mise à jour optimiste
      setConnectionRequests((prev) => 
        prev.map((c) => 
          c.userId === userId 
            ? { ...c, status: "accepted" }
            : c
        )
      );
      
    } catch (error) {
      console.error("Erreur lors de l'acceptation :", error);
    }
  };

  // Fonction helper pour obtenir le statut de connexion
  const getConnectionStatus = (userId: string) => {
    const connection = connectionRequests.find((c) => c.userId === userId);
    if (!connection) return { status: "none", isSender: false };

    return {
      status: connection.status,
      isSender: connection.senderId === currentUser?.id,
    };
  };

  // Fonction pour rendre le bouton de connexion
  const renderConnectionButton = (user: UserType) => {
    const { status, isSender } = getConnectionStatus(user.id!);

    switch (status) {
      case "none":
        return (
          <Button
            size="sm"
            className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => handleConnectionRequest(user.id!)}
          >
            Envoyer une demande de connexion
          </Button>
        );

      case "pending":
        if (isSender) {
          return (
            <Button
              size="sm"
              disabled
              className="flex-1 sm:flex-none bg-gray-400 text-white cursor-not-allowed"
            >
              Demande envoyée
            </Button>
          );
        } else {
          return (
            <Button
              size="sm"
              className="flex-1 sm:flex-none bg-yellow-500 hover:bg-yellow-600 text-white"
              onClick={() => handleAcceptRequest(user.id!)}
            >
              Accepter la demande
            </Button>
          );
        }

      case "accepted":
        return (
          <Button
            size="sm"
            disabled
            className="flex-1 sm:flex-none bg-green-600 text-white cursor-not-allowed"
          >
            Amis
          </Button>
        );

      default:
        return null;
    }
  };

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
        {users.map((user) =>
          user.id && user.id !== currentUser?.id ? (
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
          ) : null
        )}
      </div>
    </div>
  )
}