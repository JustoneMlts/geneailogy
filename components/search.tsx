import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Input } from "./ui/input";
import {
  Search,
} from "lucide-react"
import { JSX, useEffect, useState } from "react";
import { getUserById, getUsers, updateConnectionStatus } from "@/app/controllers/usersController";
import { ConnexionType, LinkStatus, UserLink, UserType } from "@/lib/firebase/models";
import { useDispatch, useSelector } from "react-redux";
import { selectUser, setCurrentUser } from "@/lib/redux/slices/currentUserSlice"; // ✅ Ajout de setUser
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
    const fetchUsers = async (): Promise<void> => {
      try {
        const data: UserType[] = await getUsers();
        setUsers(data);
      } catch (error) {
        console.error("Erreur lors de la récupération des utilisateurs:", error);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchConnexionsIds = async (): Promise<void> => {
      if (currentUser?.id) {
        try {
          const data: UserLink[] = await getConnexionsByUserId(currentUser.id);
          setConnectionRequests(data)
        } catch (error) {
          console.error("Erreur lors de la récupération des connexions:", error);
        }
      }
    }
    fetchConnexionsIds();
  }, [currentUser])

  // ✅ Fonction de demande de connexion corrigée
  const handleConnectionRequest = async (userId: string): Promise<void> => {
    if (!currentUser?.id || !userId) {
      console.warn("CurrentUser ID ou userId manquant");
      return;
    }

    try {
      const newRequest = await sendConnectionRequest(
        currentUser.id,
        userId,
        currentUser.firstName,
        currentUser.lastName,
        currentUser.avatarUrl
      );

      // Mise à jour optimiste de l'état local
      const updatedRequest: UserLink = {
        userId: userId,
        status: "pending" as LinkStatus,
        senderId: currentUser.id
      };

      setConnectionRequests((prev: UserLink[]): UserLink[] => {
        const filtered = prev.filter((c: UserLink) => c.userId !== userId);
        return [...filtered, updatedRequest];
      });

      // 🔹 Dispatcher l'utilisateur courant mis à jour
      const newLink: UserLink = {
        userId: userId,
        status: "pending" as LinkStatus,
        senderId: currentUser.id
      };

      const updatedLinks: UserLink[] = [
        ...((Array.isArray(currentUser.links) ? currentUser.links : []).filter(
          (link: UserLink) => link.userId !== userId
        )),
        newLink,
      ];

      const updatedCurrentUser: UserType = {
        ...currentUser,
        links: updatedLinks
      };

      // ✅ Dispatch du currentUser mis à jour
      dispatch(setCurrentUser(updatedCurrentUser));

      // 🔹 Mettre à jour l'utilisateur cible dans la liste locale
      setUsers((prevUsers: UserType[]): UserType[] => {
        return prevUsers.map((user: UserType): UserType => {
          if (user.id === userId && currentUser.id) {
            const newTargetLink: UserLink = {
              userId: currentUser.id,
              status: "pending" as LinkStatus,
              senderId: currentUser.id
            };

            const updatedTargetLinks: UserLink[] = [
              ...((Array.isArray(user.links) ? user.links : []).filter(
                (link: UserLink) => link.userId !== currentUser.id
              )),
              newTargetLink,
            ];
            return {
              ...user,
              links: updatedTargetLinks
            };
          }
          return user;
        });
      });

    } catch (error) {
      console.error("Erreur lors de l'envoi de la demande :", error);
      // Restaurer l'état en cas d'erreur
      if (currentUser?.id) {
        try {
          const data: UserLink[] = await getConnexionsByUserId(currentUser.id);
          setConnectionRequests(data);
        } catch (restoreError) {
          console.error("Erreur lors de la restauration:", restoreError);
        }
      }
    }
  };

  // ✅ Fonction d'acceptation corrigée (suppression du doublon)
  const handleAcceptRequest = async (userId: string): Promise<void> => {
    if (!currentUser?.id || !userId) {
      console.warn("CurrentUser ID ou userId manquant");
      return;
    }

    try {
      if (currentUser.avatarUrl) {
        await updateConnectionStatus(currentUser.id, userId, currentUser.firstName, currentUser.lastName, currentUser.avatarUrl);
      }
      else {
        await updateConnectionStatus(currentUser.id, userId, currentUser.firstName, currentUser.lastName, "");
      }
      // Mise à jour optimiste locale
      setConnectionRequests((prev: UserLink[]): UserLink[] =>
        prev.map((c: UserLink): UserLink =>
          c.userId === userId
            ? { ...c, status: "accepted" as LinkStatus }
            : c
        )
      );

      // 🔹 Dispatcher l'utilisateur courant mis à jour
      const acceptedLink: UserLink = {
        userId: userId,
        status: "accepted" as LinkStatus,
        senderId: userId // Le sender reste celui qui a envoyé la demande
      };
      const updatedCurrentUserLinks: UserLink[] = [
        ...((Array.isArray(currentUser.links) ? currentUser.links : []).filter(
          (link: UserLink) => link.userId !== userId
        )),
        acceptedLink,
      ];
      const updatedCurrentUser: UserType = {
        ...currentUser,
        links: updatedCurrentUserLinks
      };

      // ✅ Dispatch du currentUser mis à jour
      dispatch(setCurrentUser(updatedCurrentUser));

      // 🔹 Mettre à jour l'utilisateur cible dans la liste locale
      setUsers((prevUsers: UserType[]): UserType[] => {
        return prevUsers.map((user: UserType): UserType => {
          if (user.id === userId && currentUser.id) {
            const acceptedTargetLink: UserLink = {
              userId: currentUser.id,
              status: "accepted" as LinkStatus,
              senderId: userId
            };

            const updatedTargetLinks: UserLink[] = [
              ...(user.links || []).filter((link: UserLink) => link.userId !== currentUser.id),
              acceptedTargetLink
            ];

            return {
              ...user,
              links: updatedTargetLinks
            };
          }
          return user;
        });
      });

    } catch (error) {
      console.error("Erreur lors de l'acceptation :", error);
      // Restaurer l'état en cas d'erreur
      if (currentUser?.id) {
        try {
          const data: UserLink[] = await getConnexionsByUserId(currentUser.id);
          setConnectionRequests(data);
        } catch (restoreError) {
          console.error("Erreur lors de la restauration:", restoreError);
        }
      }
    }
  };

  // Fonction helper pour obtenir le statut de connexion
  const getConnectionStatus = (userId: string): { status: LinkStatus | "none", isSender: boolean } => {
    const connection = connectionRequests.find((c: UserLink) => c.userId === userId);
    if (!connection) return { status: "none", isSender: false };

    return {
      status: connection.status,
      isSender: connection.senderId === currentUser?.id,
    };
  };

  // Fonction pour rendre le bouton de connexion
  const renderConnectionButton = (user: UserType): JSX.Element | null => {
    if (!user.id) return null;

    const { status, isSender } = getConnectionStatus(user.id);

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
        {users.map((user: UserType) =>
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