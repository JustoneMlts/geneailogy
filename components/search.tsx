"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Input } from "./ui/input"
import { Search } from "lucide-react"
import { useEffect, useState } from "react"
import { getUsers, sendConnectionRequest, updateConnectionStatus } from "@/app/controllers/usersController"
import { LinkStatus, UserLink, UserType } from "@/lib/firebase/models"
import { useDispatch, useSelector } from "react-redux"
import { selectUser } from "@/lib/redux/slices/currentUserSlice"
import { selectConnections, addConnection, updateConnectionStatusInStore } from "@/lib/redux/slices/connectionsSlice"

export const SearchPage = () => {
  const currentUser = useSelector(selectUser)
  const connections = useSelector(selectConnections) // 🔥 synchro en temps réel
  const [users, setUsers] = useState<UserType[]>([])
  const dispatch = useDispatch()

  // 🔹 Récupération des utilisateurs
  useEffect(() => {
    const fetchUsers = async () => {
      const data = await getUsers()
      setUsers(data)
    }
    fetchUsers()
  }, [])

  // ✅ Envoyer une demande
  const handleConnectionRequest = async (userId: string) => {
    if (!currentUser?.id) return
    await sendConnectionRequest(
      currentUser.id,
      userId,
      currentUser.firstName,
      currentUser.lastName,
      currentUser.avatarUrl
    )
    dispatch(addConnection({ userId, senderId: currentUser.id, status: "pending" as LinkStatus }))
  }

  // ✅ Accepter une demande
  const handleAcceptRequest = async (userId: string) => {
    if (!currentUser?.id) return
    await updateConnectionStatus(
      userId, // sender
      currentUser.id, // receiver
      "accepted",
      currentUser.firstName,
      currentUser.lastName,
      currentUser.avatarUrl ?? ""
    )
    dispatch(updateConnectionStatusInStore({ userId, senderId: userId, status: "accepted" }))
  }

  // 🔹 Cherche la connexion Redux pour un utilisateur
  const getConnectionStatus = (userId: string) => {
    if (!currentUser) return { status: "none", isSender: false }
    const conn = connections.find(
      (c) =>
        (c.userId === userId && c.senderId === currentUser.id) ||
        (c.userId === currentUser.id && c.senderId === userId)
    )
    if (!conn) return { status: "none", isSender: false }
    const isSender = conn.senderId === currentUser.id
    return { status: conn.status, isSender }
  }

  const renderConnectionButton = (user: UserType) => {
    const { status, isSender } = getConnectionStatus(user.id!)
    switch (status) {
      case "none":
        return (
          <Button size="sm" onClick={() => handleConnectionRequest(user.id!)}>
            Envoyer une demande
          </Button>
        )
      case "pending":
        return isSender ? (
          <Button size="sm" disabled>Demande envoyée</Button>
        ) : (
          <Button size="sm" onClick={() => handleAcceptRequest(user.id!)}>
            Accepter
          </Button>
        )
      case "accepted":
        return <Button size="sm" disabled>Amis</Button>
    }
  }

  return (
    <div className="animate-fade-in max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Recherche de familles</h1>
        <p className="text-gray-600">Trouvez d'autres familles</p>
      </div>
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Input placeholder="Nom" />
            <Input placeholder="Lieu" />
            <Button><Search className="mr-2 h-4 w-4" />Rechercher</Button>
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
        {users
          .filter((u) => u.id !== currentUser?.id)
          .map((user) => (
            <Card key={user.id}>
              <div className="flex justify-start items-center mb-4">
                <div className="p-6 space-x-2">
                  <Avatar>
                    <AvatarImage src={user?.avatarUrl} />
                    <AvatarFallback>
                      {user ? user.firstName[0] + user.lastName[0] : "U"}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div>
                  <h3 className="font-bold text-lg">
                    {user ? `${user.firstName} ${user.lastName}` : "Utilisateur"}
                  </h3>
                  <span> {user.localisation} </span>
                </div>
              </div>
              <CardContent className="flex justify-between items-center">
                <Badge variant="outline">Public</Badge>
                {renderConnectionButton(user)}
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  )
}
