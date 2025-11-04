// components/header.tsx
"use client"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import {
  Bell,
  MessageCircle,
  User,
  Menu,
  X,
  Search,
  TreePine,
  Home,
  NotebookPen,
  Sparkles,
  Users,
  LogOut,
  Settings
} from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import UserSearchBar from "./searchBar"
import { UserType } from "@/lib/firebase/models"
import { selectActiveTab, setActiveTab } from "@/lib/redux/slices/uiSlice"
import {
  selectUnreadConnectionsCount,
  selectUnreadCount,
  selectUnreadMessagesCount
} from "@/lib/redux/slices/notificationSlice"
import { logOut } from "@/lib/firebase/firebase-authentication"
import { setCurrentUser } from "@/lib/redux/slices/currentUserSlice"

interface HeaderProps {
  currentUser: UserType
}

export const Header = ({ currentUser }: HeaderProps) => {
  const router = useRouter()
  const dispatch = useDispatch()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement>(null)
  
  const activeTab = useSelector(selectActiveTab)
  const unreadCount = useSelector(selectUnreadCount)
  const unreadMessages = useSelector(selectUnreadMessagesCount)
  const unreadConnections = useSelector(selectUnreadConnectionsCount)

  const navigationItems = [
    { id: "feed", icon: Home, label: "Feed" },
    { id: "tree", icon: TreePine, label: "Mon arbre" },
    // { id: "ai", icon: Sparkles, label: "Suggestions IA" },
    { id: "connections", icon: Users, label: "Connexions", badge: unreadConnections },
    { id: "messages", icon: MessageCircle, label: "Messages", badge: unreadMessages },
    { id: "notifications", icon: Bell, label: "Notifications", badge: unreadCount },
  ]

  const handleNavClick = (itemId: string) => {
    dispatch(setActiveTab(itemId))
    setIsMenuOpen(false)
    // Si l'utilisateur n'est pas sur /dashboard, on l'y redirige
    if (!window.location.pathname.startsWith('/dashboard')) {
      router.push('/dashboard')
    }
  }

  const handleLogout = () => {
    logOut()
    dispatch(setActiveTab("feed"))
    dispatch(setCurrentUser(null))
    router.push("/login")
  }

  // Fermer le menu profile si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false)
      }
    }

    if (isProfileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isProfileMenuOpen])

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex justify-center items-center gap-4">
          {/* Logo */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            <TreePine className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent whitespace-nowrap hidden lg:block">
              GeneAIlogy
            </span>
          </div>

          {/* SearchBar desktop */}
          <div className="flex-1 hidden md:block lg:max-w-md">
            <UserSearchBar
              onUserSelect={(u) => u && router.push(`/wall/${u.id}`)}
              onViewAllResults={(q) => router.push(`/search?q=${q}`)}
            />
          </div>

          {/* Navigation Desktop */}
          <nav className="hidden lg:flex justify-center items-center space-x-2 flex-1">
            {navigationItems.map((item) => (
              <Button
                key={item.id}
                variant="ghost"
                size="icon"
                onClick={() => handleNavClick(item.id)}
                className={`relative ${
                  activeTab === item.id
                    ? "text-blue-600 bg-blue-50"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <item.icon className="w-5 h-5" />
                {(item.badge ?? 0) > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500">
                    {item.badge}
                  </Badge>
                )}
              </Button>
            ))}
          </nav>

          {/* Avatar + Search button Desktop */}
          <div className="hidden md:flex items-center gap-2">
            {/* <Button
              variant="ghost"
              size="icon"
              onClick={() => dispatch(setActiveTab("search"))}
              className={activeTab === "search" ? "text-blue-600 bg-blue-50" : ""}
            >
              <Search className="w-5 h-5" />
            </Button> */}
            
            {/* Avatar avec menu déroulant */}
            <div className="relative" ref={profileMenuRef}>
              <Avatar
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="cursor-pointer"
              >
                <AvatarImage src={currentUser?.avatarUrl} />
                <AvatarFallback>
                  {currentUser?.firstName?.[0]}
                  {currentUser?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>

              {/* Menu déroulant */}
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false)
                      router.push(`/wall/${currentUser?.id}`)
                    }}
                    className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <User className="w-4 h-4 mr-3" />
                    Mon profil
                  </button>
                  <hr className="my-1 border-gray-200" />
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false)
                      router.push(`/profile`)
                    }}
                    className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <Settings className="w-4 h-4 mr-3" />
                    Paramètres
                  </button>
                  <hr className="my-1 border-gray-200" />
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false)
                      handleLogout()
                    }}
                    className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile icons */}
          <div className="md:hidden flex items-center gap-2 ml-auto">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <Search className="w-6 h-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="relative"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              {(unreadCount + unreadMessages + unreadConnections > 0) && !isMenuOpen && (
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
              )}
            </Button>
          </div>
        </div>

        {/* Drawer search mobile */}
        {isSearchOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 pt-3 mt-3">
            <UserSearchBar
              autoFocus
              onUserSelect={(u) => {
                setIsSearchOpen(false)
                if (u) router.push(`/wall/${u.id}`)
              }}
              onViewAllResults={(q) => {
                setIsSearchOpen(false)
                router.push(`/search?q=${q}`)
              }}
            />
          </div>
        )}

        {/* Drawer menu mobile */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 pt-3 mt-3 space-y-1">
            {navigationItems.map((item) => (
              <Button
                key={item.id}
                variant="ghost"
                className={`w-full justify-start ${
                  activeTab === item.id
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600"
                }`}
                onClick={() => handleNavClick(item.id)}
              >
                <item.icon className="w-4 h-4 mr-3" />
                <span className="flex-1 text-left">{item.label}</span>
                {(item.badge ?? 0) > 0 && (
                  <Badge className="ml-auto bg-red-500 text-white text-xs">
                    {item.badge}
                  </Badge>
                )}
              </Button>
            ))}
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-600"
              onClick={() => {
                setIsMenuOpen(false)
                router.push(`/wall/${currentUser?.id}`)
              }}
            >
              <User className="w-4 h-4 mr-3" />
              Profil
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:bg-red-50"
              onClick={() => {
                setIsMenuOpen(false)
                handleLogout()
              }}
            >
              <LogOut className="w-4 h-4 mr-3" />
              Déconnexion
            </Button>
          </div>
        )}
      </div>
    </header>
  )
}