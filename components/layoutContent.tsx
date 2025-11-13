"use client"
import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { Header } from "@/components/header"
import { selectUser } from "@/lib/redux/slices/currentUserSlice"
import { selectActiveTab } from "@/lib/redux/slices/uiSlice"
import { usePathname } from "next/navigation"
import FloatingAiAssistant from "./floatingAssistant/floatingAssistant"
import { LinksProvider } from "./LinksProvider"

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

  // 🔹 Détection format écran
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useEffect(() => {
    if (currentUser) setIsLoading(false)
  }, [currentUser])

  // 🔹 Affichage message mobile si format non-desktop
  if (isMobile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-green-50 p-4">
        <div className="max-w-md text-center p-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm animate-fade-in rounded-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Version mobile en développement</h2>
          <p className="text-gray-600">
            Pour l'instant, l'application doit être utilisée sur desktop.
            Nous travaillons activement sur la version smartphone. 🚀
          </p>
        </div>
      </div>
    )
  }

  if (shouldHideHeader) {
    return (
      <div className="min-h-screen w-screen bg-gradient-to-br from-purple-50 via-blue-50 to-green-50">
        {children}
      </div>
    )
  }

  if (!currentUser) return null

  return (
    <LinksProvider userId={currentUser.id ?? ""}>
      <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-br from-purple-50 via-blue-50 to-green-50">
        {!shouldHideHeader && <Header currentUser={currentUser} />}

        <div className="flex-1 flex overflow-y-auto scrollbar-thin overflow-x-hidden py-6 gap-12">
          {/* Widgets gauche désactivés */}
          <main className="flex-1 min-w-0 px-6">
            {children}
          </main>
          {/* Widgets droite désactivés */}
        </div>

        <FloatingAiAssistant />
      </div>
    </LinksProvider>
  )
}
