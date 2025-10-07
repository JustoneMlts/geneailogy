"use client"

import { useState, useEffect } from "react"
import { Feed } from "@/components/feed"
import { Notifications } from "@/components/notifications"
import { Tree } from "@/components/tree"
import { Ai } from "@/components/ai"
import { SearchPage } from "@/components/search"
import { DirectMessages } from "@/components/directMessages"
import { Connections } from "@/components/connections"
import { selectUser, setCurrentUser } from "@/lib/redux/slices/currentUserSlice"
import { useDispatch, useSelector } from "react-redux"
import { Sidebar } from "@/components/sidebar"
import Wall from "@/components/wall"
import { getMyNotifications } from "../controllers/notificationsController"
import { setNotifications } from "@/lib/redux/slices/notificationSlice"
import { selectActiveTab } from "@/lib/redux/slices/uiSlice"
import { getConnexionsByUserId } from "../controllers/usersController"
import { setConnections } from "@/lib/redux/slices/connectionsSlice"

export default function Dashboard() {
  const activeTab = useSelector(selectActiveTab)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isPinned, setIsPinned] = useState(false)
  const dispatch = useDispatch()
  const currentUser = useSelector(selectUser)

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

  const fetchConnections = async () => {
    if (currentUser.id) {
      const data = await getConnexionsByUserId(currentUser.id)
      dispatch(setConnections(data))
    }  
  }

  fetchConnections()
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

          {activeTab === "search" && (
            <SearchPage />
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
