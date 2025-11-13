"use client"

import { useState, useEffect } from "react"
import { Feed } from "@/components/feed"
import { Notifications } from "@/components/notifications"
import { Tree } from "@/components/tree"
import { Ai } from "@/components/ai"
import { DirectMessages } from "@/components/directMessages"
import { Connections } from "@/components/connections"
import { selectUser, setCurrentUser } from "@/lib/redux/slices/currentUserSlice"
import { useDispatch, useSelector } from "react-redux"
import { Sidebar } from "@/components/sidebar"
import Wall from "@/components/wall"
import { getMyNotifications } from "../controllers/notificationsController"
import { setNotifications } from "@/lib/redux/slices/notificationSlice"
import { selectActiveTab } from "@/lib/redux/slices/uiSlice"
import { getUsersByFriendsIds } from "../controllers/usersController"

interface SimpleContact {
  id: string
  firstName: string
  lastName: string
  avatarUrl?: string
}

export default function Dashboard() {
  const activeTab = useSelector(selectActiveTab)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isPinned, setIsPinned] = useState(false)
  const dispatch = useDispatch()
  const currentUser = useSelector(selectUser)
  const [isLoadingFriends, setIsLoadingFriends] = useState<boolean>(false)
  const [friends, setFriends] = useState<SimpleContact[]>([])

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        if (currentUser?.id) {
          const notifs = await getMyNotifications(currentUser?.id)
          dispatch(setNotifications(notifs))
        }
      } catch {
        console.error("Une erreur est survenue lors de la récupération des notifications.")
      }
    }

    fetchNotifications();

  }, [currentUser])

  useEffect(() => {
  if (!currentUser?.id) return

 const fetchFriends = async () => {
       console.log("Current user's friends:", currentUser?.friends)
       if (!currentUser?.friends || currentUser.friends.length === 0) return
 
       setIsLoadingFriends(true)
       await getUsersByFriendsIds(currentUser.friends)
         .then((users) => {
           console.log("loaded friends users:", users)
           const simpleContacts: SimpleContact[] = users
             .filter((u) => u.id)
             .map((u) => ({
               id: u.id!,
               firstName: u.firstName,
               lastName: u.lastName,
               avatarUrl: u.avatarUrl,
             }))
           setFriends(simpleContacts)
         })
         .catch((err) => console.error("Erreur chargement amis:", err))
         .finally(() => setIsLoadingFriends(false))
     }
 
     fetchFriends()
}, [currentUser, dispatch])

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* Main Content */}
      <div className={`min-h-screen w-full transition-all duration-300 ease-in-out`}>
        <div>
          {activeTab === "feed" && (
            <Feed />
          )}

          {activeTab === "wall" && (
            <Wall />
          )}

          {activeTab === "tree" && (
            <Tree />
          )}

          {activeTab === "ai" && (
            <Ai />
          )}
          
          {activeTab === "connections" && (
            <Connections />
          )}

          {activeTab === "messages" && (
            <DirectMessages />
          )}

          {activeTab === "notifications" && (
            <Notifications />
          )}
        </div>
      </div>
    </div>
  )
}
