import { useEffect, useState } from "react"
import { MessageCircle, Sparkles, TreePine, User } from "lucide-react"
import { Card, CardContent } from "./ui/card"
import { db } from "../lib/firebase/firebase" // ton init Firebase
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore"
import { useSelector } from "react-redux" // si tu stockes ton user dans Redux
import { selectUser } from "../lib/redux/slices/currentUserSlice"

interface Notification {
  id: string
  type: "suggestion" | "message" | "connection" | "update"
  title: string
  message: string
  time: number
  unread: boolean
}

export const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const user = useSelector(selectUser)

  useEffect(() => {
    if (!user?.id) return

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.id),
      orderBy("time", "desc")
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Notification, "id">),
      }))
      setNotifications(notifs)
    })

    return () => unsubscribe()
  }, [user?.id])

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Notifications</h1>
        <p className="text-gray-600">Restez informé des dernières activités sur votre arbre généalogique</p>
      </div>

      <div className="space-y-4">
        {notifications.map((notification) => (
          <Card
            key={notification.id}
            className={`${notification.unread ? "border-blue-200 bg-blue-50" : ""}`}
          >
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
                  <p className="text-xs text-gray-500">
                    {new Date(notification.time).toLocaleString()}
                  </p>
                </div>
                {notification.unread && (
                  <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
