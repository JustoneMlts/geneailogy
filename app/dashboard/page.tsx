"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  TreePine,
  MessageCircle,
  Search,
  Sparkles,
  Bell,
  Home,
  User,
  PinIcon,
  PinOffIcon,
  Menu,
  X,
  Users,
  LogOutIcon,
} from "lucide-react"
import Link from "next/link"
import { Feed } from "@/components/feed"
import { Notifications } from "@/components/notifications"
import { Tree } from "@/components/tree"
import { Ai } from "@/components/ai"
import { SearchPage } from "@/components/search"
import { DirectMessages } from "@/components/directMessages"
import { Connections } from "@/components/connections"
import { selectUser, setCurrentUser } from "@/lib/redux/slices/currentUserSlice"
import { useDispatch, useSelector } from "react-redux"
import { logOut } from "@/lib/firebase/firebase-authentication"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"

function DesktopSidebar({
  activeTab,
  setActiveTab,
  isExpanded,
  setIsExpanded,
  isPinned,
  setIsPinned,
}: {
  activeTab: string
  setActiveTab: (tab: string) => void
  isExpanded: boolean
  setIsExpanded: (expanded: boolean) => void
  isPinned: boolean
  setIsPinned: (pinned: boolean) => void
}) {
  const [showText, setShowText] = useState(isPinned)
  const currentUser = useSelector(selectUser)
  const dispatch = useDispatch();
  const route = useRouter();

  const menuItems = [
    { id: "feed", label: "Feed", icon: Home },
    { id: "notifications", label: "Notifications", icon: Bell, badge: 3 },
    { id: "tree", label: "Mon arbre", icon: TreePine },
    { id: "ai", label: "Suggestions IA", icon: Sparkles },
    { id: "search", label: "Recherche", icon: Search },
    { id: "connections", label: "Connexions", icon: Users },
    { id: "messages", label: "Messages", icon: MessageCircle },
  ]

  const handleMouseEnter = () => {
    if (!isPinned) {
      setIsExpanded(true)
      // Délai pour que la sidebar se déploie avant l'apparition du texte
      setTimeout(() => setShowText(true), 200)
    }
  }

  const handleMouseLeave = () => {
    if (!isPinned) {
      // Les textes disparaissent immédiatement
      setShowText(false)
      // La sidebar se replie après un court délai
      setTimeout(() => setIsExpanded(false), 150)
    }
  }

  const handlePinToggle = () => {
    const newPinnedState = !isPinned
    setIsPinned(newPinnedState)

    if (newPinnedState) {
      // Pin: déployer immédiatement
      setIsExpanded(true)
      setTimeout(() => setShowText(true), 200)
    } else {
      // Unpin: replier avec animation
      setShowText(false)
      setTimeout(() => setIsExpanded(false), 150)
    }
  }

  // Synchroniser showText avec isPinned au montage
  useEffect(() => {
    if (isPinned) {
      setIsExpanded(true)
      setShowText(true)
    } else {
      setShowText(false)
      setIsExpanded(false)
    }
  }, [isPinned])

  const handleLogout = () => {
    dispatch(setCurrentUser(null));
    logOut();
    route.push("/login");
  }

  // Condition pour afficher le texte : sidebar dépliée ET (épinglée OU texte activé)
  const shouldShowText = isExpanded && (isPinned || showText)

  return (
    <div
      className={`hidden md:flex flex-col h-screen bg-white border-r border-gray-200 transition-all duration-300 ease-in-out ${isExpanded ? "w-64" : "w-16"
        } fixed left-0 top-0 z-40 shadow-lg`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 min-h-[73px] flex items-center">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-3">
            <TreePine className="h-8 w-8 text-blue-600 flex-shrink-0" />
            <span
              className={`text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent whitespace-nowrap transition-all duration-200 ${shouldShowText ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                }`}
            >
              GeneAIlogy
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePinToggle}
            className={`h-6 w-6 flex-shrink-0 transition-all duration-200 ${shouldShowText ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
              }`}
          >
            {isPinned ? <PinOffIcon className="h-4 w-4" /> : <PinIcon className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Menu Items */}
      <div className="flex-1 py-4">
        <nav className="space-y-2 px-2">
          {menuItems.map((item) => (
            <Link key={item.id} href={item.id === "family-settings" ? "/family-settings" : "/dashboard"}>
              <button
                onClick={() => {
                  if (item.id !== "family-settings") {
                    setActiveTab(item.id)
                  }
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 ${activeTab === item.id
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span
                  className={`whitespace-nowrap transition-all duration-200 ${shouldShowText ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                    }`}
                >
                  {item.label}
                </span>
                {item.badge && (
                  <Badge
                    className={`ml-auto bg-red-500 text-white text-xs transition-all duration-200 ${shouldShowText ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
                      }`}
                  >
                    {item.badge}
                  </Badge>
                )}
              </button>
            </Link>
          ))}
        </nav>
      </div>
      <div>
        <button className="w-full flex items-center space-x-3 px-5 py-2 rounded-lg transition-all duration-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900" onClick={() => { handleLogout() }}>
          <LogOutIcon className="h-5 w-5 flex-shrink-0" />
          <span
            className={`whitespace-nowrap transition-all duration-200 ${shouldShowText ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
              }`}
          >
            Déconnexion
          </span>
        </button>
      </div>

      {/* Profile */}
      <div className="p-4 border-t border-gray-200">
        <Link href="/profile">
          <button
            className={`w-full flex items-center space-x-3 px-1 py-2 rounded-lg transition-all duration-200 ${activeTab === "profile"
              ? "bg-blue-100 text-blue-700"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
          >
            <div className="flex justify-center w-5">
              <Avatar className="h-6 w-6">
                <AvatarImage src="/placeholder.svg?height=24&width=24" />
                <AvatarFallback className="text-xs">JD</AvatarFallback>
              </Avatar>
            </div>
            <span
              className={`whitespace-nowrap transition-all duration-200 ${shouldShowText ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                }`}
            >
              Jean Dupont
            </span>
          </button>
        </Link>
      </div>
    </div>
  )
}

function MobileHeader({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (tab: string) => void }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const menuItems = [
    { id: "feed", label: "Feed", icon: Home },
    { id: "notifications", label: "Notifications", icon: Bell, badge: 3 },
    { id: "tree", label: "Mon arbre", icon: TreePine },
    { id: "ai", label: "Suggestions IA", icon: Sparkles },
    { id: "search", label: "Recherche", icon: Search },
    { id: "connections", label: "Connexions", icon: Users },
    { id: "messages", label: "Messages", icon: MessageCircle },
  ]

  const handleMenuItemClick = (tabId: string) => {
    setActiveTab(tabId)
    setIsMenuOpen(false)
  }

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <TreePine className="h-8 w-8 text-blue-600" />
          <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            GeneAIlogy
          </span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 shadow-lg">
          <nav className="py-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleMenuItemClick(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 transition-colors ${activeTab === item.id
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
                {item.badge && <Badge className="ml-auto bg-red-500 text-white text-xs">{item.badge}</Badge>}
              </button>
            ))}
            <Link href="/profile">
              <button className="w-full flex items-center space-x-3 px-4 py-3 transition-colors text-gray-600 hover:bg-gray-100 hover:text-gray-900">
                <User className="h-5 w-5" />
                <span>Profil</span>
              </button>
            </Link>
          </nav>
        </div>
      )}
    </>
  )
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("feed")
  const [isExpanded, setIsExpanded] = useState(false)
  const [isPinned, setIsPinned] = useState(false)

  // Calculer la marge gauche dynamiquement
  const getLeftMargin = () => {
    if (isExpanded || isPinned) {
      return "md:ml-64" // 256px
    }
    return "md:ml-16" // 64px
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-green-50">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
        isPinned={isPinned}
        setIsPinned={setIsPinned}
      />

      {/* Main Content */}
      <div className={`min-h-screen p-6 w-full transition-all duration-300 ease-in-out ${getLeftMargin()}`}>
        <div className="p-6">
          {activeTab === "feed" && (
            <Feed setActiveTab={setActiveTab} />
          )}

          {activeTab === "tree" && (
            <Tree />
          )}

          {activeTab === "ai" && (
            <Ai setActiveTab={setActiveTab} />
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
