import { Card, CardContent } from "./ui/card"
import { useDispatch, useSelector } from "react-redux"
import { selectUser } from "../lib/redux/slices/currentUserSlice"
import { selectActivePage, selectNotifications,setActivePage } from "@/lib/redux/slices/notificationSlice"
import { useEffect, useRef } from "react"
import { markAllNotificationsAsRead, markNotificationAsRead } from "@/app/controllers/notificationsController"
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar"
import { handleGetUserNameInitialsFromName } from "@/app/helpers/userHelper"
import { Button } from "./ui/button"
import { Check } from "lucide-react"
import { setActiveTab } from "@/lib/redux/slices/uiSlice"

export const Notifications = () => {
  const notifications = useSelector(selectNotifications)
  const user = useSelector(selectUser)
  const notifRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const dispatch = useDispatch()

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

  useEffect(() => {
    dispatch(setActivePage("connections"))
    return () => {
      dispatch(setActivePage("")) // quand on quitte la page
    }
  }, [dispatch])

  // ✅ Desktop hover
  const handleHover = (notifId: string) => {
    const notif = notifications.find((n) => n.id === notifId)
    if (notif?.unread) {
      markNotificationAsRead(notifId)
    }
  }

  const handleNavigation = (notifType: string) => {
    switch (notifType) {
      case "connection":
        dispatch(setActiveTab("connections"))
        break;
      case "message":
        dispatch(setActiveTab("directMessages"))
        break;
      case "comment":
        dispatch(setActiveTab("feed"))
        break;
      default:
        dispatch(setActiveTab("feed"))
    }
  }

  //  type: "suggestion" | "message" | "connection" | "update" | "like" | "comment"


  return (
    <div className="animate-fade-in w-2/3 mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Notifications</h1>
        <p className="text-gray-600">Restez informé des dernières activités sur votre arbre généalogique</p>
      </div>
      <div className="flex items-center justify-start my-6">
        <Button
          variant="outline"
          size="sm"
          className="flex items-center space-x-2"
          onClick={() => markAllNotificationsAsRead(notifications)}
        >
          <Check className="h-4 w-4" />
          <span>Tout marquer comme lu</span>
        </Button>
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
            className={`relative cursor-pointer ${notification.unread ? "border-blue-200 bg-blue-50" : ""
              } hover:shadow-lg transition-shadow`}
            onClick={() => {
              handleNavigation(notification.type)
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-start space-x-4">
                <Avatar style={{ width: 40, height: 40 }}>
                  {notification.senderAvatarUrl ? (
                    <AvatarImage src={notification.senderAvatarUrl} />
                  ) : (
                    <AvatarFallback>
                      {handleGetUserNameInitialsFromName(
                        notification.senderName ?? "Utilisateur inconnu"
                      )}
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

            {/* ✅ Icône check en bas à droite si notification lue */}
            {!notification.unread && (
              <div className="absolute bottom-2 right-2 text-green-600">
                <Check className="h-4 w-4" />
              </div>
            )}
          </Card>
        ))}

      </div>
    </div>
  )
}


