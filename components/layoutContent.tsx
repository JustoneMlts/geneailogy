"use client"
import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { Header } from "@/components/header"
import { selectUser } from "@/lib/redux/slices/currentUserSlice"
import { selectActiveTab } from "@/lib/redux/slices/uiSlice"
import { usePathname } from "next/navigation"
import WidgetTreeStats from "@/components/widgets/widgetTreeStats"
import WidgetAISuggestions from "@/components/widgets/widgetAiSuggestions"
import WidgetRecentActivity from "@/components/widgets/widgetRecentActivity"
import WidgetNotifications from "@/components/widgets/widgetNotifications"
import WidgetFamilyDiversity from "./widgets/widgetFamilyDiversity"
import WidgetUpcomingEvents from "./widgets/widgetUpcomingEvents"
import FloatingAiAssistant from "./floatingAssistant/floatingAssistant"

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const activeTab = useSelector(selectActiveTab)
  const [isLoading, setIsLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const currentUser = useSelector(selectUser)
  const pathname = usePathname()

  const hideHeaderRoutes = ["/", "/login", "/signup"]
  const shouldHideHeader = hideHeaderRoutes.includes(pathname)
  const hideWidgets = ["tree", "messages", "connections", "ai", "notifications"]
  const isOnWallRoute = !!pathname && (pathname === "/wall" || pathname.startsWith("/wall/"))
  const shouldHideWidgets = hideWidgets.includes(activeTab) && !isOnWallRoute || pathname.startsWith("/tree/")

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useEffect(() => {
    if (currentUser) setIsLoading(false)
  }, [currentUser])

  if (shouldHideHeader) {
    return (
      <div className="min-h-screen w-screen bg-gradient-to-br from-purple-50 via-blue-50 to-green-50">
        {children}
      </div>
    )
  }

  if (!currentUser) return null

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-br from-purple-50 via-blue-50 to-green-50">
      {!shouldHideHeader && currentUser && <Header currentUser={currentUser} />}

      <div className="flex-1 flex overflow-y-auto scrollbar-thin overflow-x-hidden py-6 gap-12">
        
        {/* --- Widgets gauche (désactivés) --- */}
        {/*
        {!isMobile && !shouldHideWidgets && (
          <aside className="hidden lg:flex flex-col w-1/4 space-y-6 mt-6 py-2 pl-10">
            <h2 className="text-gray-800 font-semibold text-sm uppercase tracking-wide pl-1 mb-1">
              Centre d'analyse
            </h2>
            <WidgetAISuggestions />
            <WidgetTreeStats />
            <WidgetFamilyDiversity /> 
          </aside>
        )}
        */}

        {/* Contenu principal */}
        <main className="flex-1 min-w-0 px-6">
          {children}
        </main>

        {/* --- Widgets droite (désactivés) --- */}
        {/*
        {!isMobile && !shouldHideWidgets && (
          <aside className="hidden lg:flex flex-col w-1/4 space-y-6 mt-6 py-2 pr-10">
            <h2 className="text-gray-800 font-semibold text-sm uppercase tracking-wide pl-1 mb-1">
              Centre de notifications
            </h2>
            <WidgetNotifications />
            <WidgetRecentActivity />
            <WidgetUpcomingEvents />
          </aside>
        )}
        */}
      </div>

      <FloatingAiAssistant />
    </div>
  )
}
