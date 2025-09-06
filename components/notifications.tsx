import { Card, CardContent } from "./ui/card"
import { useSelector } from "react-redux"
import { selectUser } from "../lib/redux/slices/currentUserSlice"
import { selectNotifications } from "@/lib/redux/slices/notificationSlice"
import { useEffect, useRef } from "react"
import { markNotificationAsRead } from "@/app/controllers/notificationsController"
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar"
import { handleGetUserNameInitialsFromName } from "@/app/helpers/userHelper"

export const Notifications = () => {
  const notifications = useSelector(selectNotifications)  
  const user = useSelector(selectUser)
  const notifRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // ✅ Observer uniquement en mobile
  useEffect(() => {
    const isMobile = window.matchMedia("(max-width: 768px)").matches
    if (!isMobile) return // 🔹 sur desktop on ne met pas l’observer

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const notifId = entry.target.getAttribute("data-id")
            if (notifId) {
              const notif = notifications.find((n) => n.id === notifId)
              if (notif?.unread) {
                markNotificationAsRead(notifId)
              }
            }
          }
        })
      },
      { threshold: 0.8 }
    )

    Object.values(notifRefs.current).forEach((el) => {
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [notifications])

  // ✅ Desktop hover
  const handleHover = (notifId: string) => {
    const notif = notifications.find((n) => n.id === notifId)
    if (notif?.unread) {
      markNotificationAsRead(notifId)
    }
  }

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
            ref={(el) => {
              if (notification?.id) notifRefs.current[notification.id] = el
            }}
            data-id={notification.id}
            onMouseEnter={() => {
              if (notification?.id) handleHover(notification.id)
            }}
            className={`${notification.unread ? "border-blue-200 bg-blue-50" : ""}`}
          >
            <CardContent className="p-4">
              <div className="flex items-start space-x-4">
                <Avatar style={{ width: 40, height: 40 }}>
                  {notification.senderAvatarUrl ? (
                    <AvatarImage src={notification.senderAvatarUrl} />
                  ) : (
                    <AvatarFallback>
                      {handleGetUserNameInitialsFromName(notification.senderName ?? "Utilisateur inconnu")}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{notification.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(notification.timestamp).toLocaleString()}
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
