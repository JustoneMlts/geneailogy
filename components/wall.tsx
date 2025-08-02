"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  TreePine,
  User,
  PinIcon,
  PinOffIcon,
  Menu,
  X,
  Bell,
  Home,
  Search,
  Sparkles,
  MessageCircle,
  Heart,
  Share2,
  MoreHorizontal,
  ImageIcon,
  Video,
  Smile,
  Send,
  Users,
  MapPin,
  Globe,
  Lock,
  Eye,
} from "lucide-react"
import Link from "next/link"
import { handleGetUserNameInitials } from "@/app/helpers/userHelper"
import { selectUser } from "@/lib/redux/slices/currentUserSlice"
import { useSelector } from "react-redux"
import { UserType } from "@/lib/firebase/models"

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

  const menuItems = [
    { id: "feed", label: "Feed", icon: Home, href: "/dashboard" },
    { id: "notifications", label: "Notifications", icon: Bell, badge: 3, href: "/dashboard" },
    { id: "tree", label: "Mon arbre", icon: TreePine, href: "/tree" },
    { id: "wall", label: "Mon Mur", icon: User, href: "/wall" },
    { id: "ai", label: "Suggestions IA", icon: Sparkles, href: "/dashboard" },
    { id: "search", label: "Recherche", icon: Search, href: "/dashboard" },
    { id: "connections", label: "Connexions", icon: Users, href: "/connections" },
    { id: "messages", label: "Messages", icon: MessageCircle, href: "/dashboard" },
  ]

  const handleMouseEnter = () => {
    if (!isPinned) {
      setIsExpanded(true)
      setTimeout(() => setShowText(true), 200)
    }
  }

  const handleMouseLeave = () => {
    if (!isPinned) {
      setShowText(false)
      setTimeout(() => setIsExpanded(false), 150)
    }
  }

  const handlePinToggle = () => {
    const newPinnedState = !isPinned
    setIsPinned(newPinnedState)

    if (newPinnedState) {
      setIsExpanded(true)
      setTimeout(() => setShowText(true), 200)
    } else {
      setShowText(false)
      setTimeout(() => setIsExpanded(false), 150)
    }
  }

  useEffect(() => {
    if (isPinned) {
      setIsExpanded(true)
      setShowText(true)
    } else {
      setShowText(false)
      setIsExpanded(false)
    }
  }, [isPinned])

  const shouldShowText = isExpanded && (isPinned || showText)

  return (
    <div
      className={`hidden lg:flex flex-col h-screen bg-white border-r border-gray-200 transition-all duration-300 ease-in-out ${
        isExpanded ? "w-64" : "w-16"
      } fixed left-0 top-0 z-40 shadow-lg`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Header */}
      <div className="p-3 xl:p-4 border-b border-gray-200 min-h-[65px] xl:min-h-[73px] flex items-center">
        <div className="flex items-center justify-between w-full">
          <Link href="/dashboard" className="flex items-center space-x-2 xl:space-x-3">
            <TreePine className="h-6 w-6 xl:h-8 xl:w-8 text-blue-600 flex-shrink-0" />
            <span
              className={`text-lg xl:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent whitespace-nowrap transition-all duration-200 ${
                shouldShowText ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
              }`}
            >
              GeneAIlogy
            </span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePinToggle}
            className={`h-5 w-5 xl:h-6 xl:w-6 flex-shrink-0 transition-all duration-200 ${
              shouldShowText ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
            }`}
          >
            {isPinned ? (
              <PinOffIcon className="h-3 w-3 xl:h-4 xl:w-4" />
            ) : (
              <PinIcon className="h-3 w-3 xl:h-4 xl:w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Menu Items */}
      <div className="flex-1 py-3 xl:py-4">
        <nav className="space-y-1 xl:space-y-2 px-2">
          {menuItems.map((item) => (
            <Link key={item.id} href={item.href || "/dashboard"}>
              <button
                className={`w-full flex items-center space-x-2 xl:space-x-3 px-2 xl:px-3 py-2 rounded-lg transition-colors duration-200 ${
                  activeTab === item.id
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <item.icon className="h-4 w-4 xl:h-5 xl:w-5 flex-shrink-0" />
                <span
                  className={`whitespace-nowrap text-sm xl:text-base transition-all duration-200 ${
                    shouldShowText ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                  }`}
                >
                  {item.label}
                </span>
                {item.badge && (
                  <Badge
                    className={`ml-auto bg-red-500 text-white text-xs transition-all duration-200 ${
                      shouldShowText ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
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

      {/* Profile */}
      <div className="p-3 xl:p-4 border-t border-gray-200">
        <Link href="/profile">
          <button
            className={`w-full flex items-center space-x-2 xl:space-x-3 px-2 xl:px-3 py-2 rounded-lg transition-colors duration-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900`}
          >
            <div className="flex justify-center w-4 xl:w-5">
              <Avatar className="h-5 w-5 xl:h-6 xl:w-6">
                <AvatarImage src="/placeholder.svg?height=24&width=24" />
                <AvatarFallback className="text-xs">JD</AvatarFallback>
              </Avatar>
            </div>
            <span
              className={`whitespace-nowrap text-sm xl:text-base transition-all duration-200 ${
                shouldShowText ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
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

function MobileHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const menuItems = [
    { id: "feed", label: "Feed", icon: Home, href: "/dashboard" },
    { id: "notifications", label: "Notifications", icon: Bell, badge: 3, href: "/dashboard" },
    { id: "tree", label: "Mon arbre", icon: TreePine, href: "/tree" },
    { id: "wall", label: "Mon Mur", icon: User, href: "/wall" },
    { id: "ai", label: "Suggestions IA", icon: Sparkles, href: "/dashboard" },
    { id: "search", label: "Recherche", icon: Search, href: "/dashboard" },
    { id: "connections", label: "Connexions", icon: Users, href: "/connections" },
    { id: "messages", label: "Messages", icon: MessageCircle, href: "/dashboard" },
  ]

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-gray-200 px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between sticky top-0 z-50">
        <Link href="/dashboard" className="flex items-center space-x-2 sm:space-x-3">
          <TreePine className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
          <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            GeneAIlogy
          </span>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="h-8 w-8 sm:h-10 sm:w-10"
        >
          {isMenuOpen ? <X className="h-5 w-5 sm:h-6 sm:w-6" /> : <Menu className="h-5 w-5 sm:h-6 sm:w-6" />}
        </Button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="lg:hidden bg-white border-b border-gray-200 shadow-lg">
          <nav className="py-2">
            {menuItems.map((item) => (
              <Link key={item.id} href={item.href || "/dashboard"}>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full flex items-center space-x-3 px-4 py-3 transition-colors text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                >
                  <item.icon className="h-5 w-5" />
                  <span className="text-sm sm:text-base">{item.label}</span>
                  {item.badge && <Badge className="ml-auto bg-red-500 text-white text-xs">{item.badge}</Badge>}
                </button>
              </Link>
            ))}
            <Link href="/profile">
              <button
                onClick={() => setIsMenuOpen(false)}
                className="w-full flex items-center space-x-3 px-4 py-3 transition-colors text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              >
                <User className="h-5 w-5" />
                <span className="text-sm sm:text-base">Profil</span>
              </button>
            </Link>
          </nav>
        </div>
      )}
    </>
  )
}

function CreatePostCard({user} : {user: UserType}) {
  const [postContent, setPostContent] = useState("")
  const [privacy, setPrivacy] = useState("public")

  return (
    <Card className="mb-4 sm:mb-6">
      <CardContent className="p-3 sm:p-4 lg:p-6">
        <div className="flex space-x-2 sm:space-x-3 lg:space-x-4">
          <Avatar className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 flex-shrink-0">
            <AvatarImage src={user?.avatarUrl} />
                  <AvatarFallback className="text-lg sm:text-xl">{user && handleGetUserNameInitials(user)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <Textarea
              placeholder="Que voulez-vous partager sur votre mur ?"
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              className="min-h-[80px] sm:min-h-[100px] resize-none border-none shadow-none focus-visible:ring-0 text-sm sm:text-base lg:text-lg placeholder:text-gray-500"
            />

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100 space-y-3 sm:space-y-0">
              <div className="flex flex-wrap gap-2 sm:gap-3 lg:gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-blue-600 text-xs sm:text-sm p-1 sm:p-2"
                >
                  <ImageIcon className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Photo</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-green-600 text-xs sm:text-sm p-1 sm:p-2"
                >
                  <Video className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Vidéo</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-yellow-600 text-xs sm:text-sm p-1 sm:p-2"
                >
                  <Smile className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Humeur</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-red-600 text-xs sm:text-sm p-1 sm:p-2"
                >
                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Lieu</span>
                </Button>
              </div>

              <div className="flex items-center space-x-2 sm:space-x-3">
                <select
                  value={privacy}
                  onChange={(e) => setPrivacy(e.target.value)}
                  className="text-xs sm:text-sm border rounded-md px-2 py-1 bg-gray-50 min-w-0"
                >
                  <option value="public">🌍 Public</option>
                  <option value="connections">👥 Connexions</option>
                  <option value="private">🔒 Privé</option>
                </select>

                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm px-2 sm:px-4"
                  disabled={!postContent.trim()}
                  size="sm"
                >
                  <Send className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Publier
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function PostCard({ post }: { post: any }) {
  const [liked, setLiked] = useState(post.isLiked)
  const [likeCount, setLikeCount] = useState(post.likes)
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState("")

  const handleLike = () => {
    setLiked(!liked)
    setLikeCount(liked ? likeCount - 1 : likeCount + 1)
  }

  const handleComment = () => {
    if (newComment.trim()) {
      // Ajouter le commentaire
      setNewComment("")
    }
  }

  return (
    <Card className="mb-4 sm:mb-6 transition-shadow hover:shadow-lg">
      <CardContent className="p-0">
        {/* Header du post */}
        <div className="p-3 sm:p-4 lg:p-6 pb-2 sm:pb-3 lg:pb-4">
          <div className="flex items-start justify-between">
            <div className="flex space-x-2 sm:space-x-3 min-w-0 flex-1">
              <Avatar className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 flex-shrink-0">
                <AvatarImage src={post.author.avatar || "/placeholder.svg"} />
                <AvatarFallback className="text-xs sm:text-sm">{post.author.initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2 flex-wrap">
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{post.author.name}</h3>
                  {post.author.verified && (
                    <Badge className="bg-blue-100 text-blue-800 text-xs flex-shrink-0">Vérifié</Badge>
                  )}
                  {post.isOnWall && (
                    <span className="text-gray-500 text-xs sm:text-sm flex-shrink-0">→ sur votre mur</span>
                  )}
                </div>
                <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-500 mt-1">
                  <span>{post.timeAgo}</span>
                  <span>•</span>
                  {post.privacy === "public" && <Globe className="w-3 h-3 sm:w-4 sm:h-4" />}
                  {post.privacy === "connections" && <Users className="w-3 h-3 sm:w-4 sm:h-4" />}
                  {post.privacy === "private" && <Lock className="w-3 h-3 sm:w-4 sm:h-4" />}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-gray-600 h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0"
            >
              <MoreHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>
        </div>

        {/* Contenu du post */}
        <div className="px-3 sm:px-4 lg:px-6 pb-2 sm:pb-3 lg:pb-4">
          <p className="text-gray-800 leading-relaxed text-sm sm:text-base">{post.content}</p>
          {post.image && (
            <div className="mt-3 sm:mt-4 rounded-lg overflow-hidden">
              <img
                src={post.image || "/placeholder.svg"}
                alt="Post image"
                className="w-full h-auto max-h-64 sm:max-h-80 lg:max-h-96 object-cover"
              />
            </div>
          )}
          {post.location && (
            <div className="flex items-center space-x-2 mt-2 sm:mt-3 text-gray-600">
              <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="text-xs sm:text-sm truncate">{post.location}</span>
            </div>
          )}
        </div>

        {/* Stats */}
        {(likeCount > 0 || post.comments.length > 0) && (
          <div className="px-3 sm:px-4 lg:px-6 pb-2 sm:pb-3">
            <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500">
              {likeCount > 0 && (
                <div className="flex items-center space-x-1">
                  <div className="flex -space-x-1">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <Heart className="w-2 h-2 sm:w-3 sm:h-3 text-white fill-current" />
                    </div>
                  </div>
                  <span>{likeCount} j'aime</span>
                </div>
              )}
              {post.comments.length > 0 && (
                <button onClick={() => setShowComments(!showComments)} className="hover:underline">
                  {post.comments.length} commentaire{post.comments.length > 1 ? "s" : ""}
                </button>
              )}
            </div>
          </div>
        )}

        <Separator />

        {/* Actions */}
        <div className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3">
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={`flex-1 text-xs sm:text-sm ${liked ? "text-blue-600 hover:text-blue-700" : "text-gray-600 hover:text-blue-600"}`}
            >
              <Heart className={`w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 mr-1 sm:mr-2 ${liked ? "fill-current" : ""}`} />
              J'aime
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className="flex-1 text-gray-600 hover:text-green-600 text-xs sm:text-sm"
            >
              <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 mr-1 sm:mr-2" />
              Commenter
            </Button>
            <Button variant="ghost" size="sm" className="flex-1 text-gray-600 hover:text-purple-600 text-xs sm:text-sm">
              <Share2 className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 mr-1 sm:mr-2" />
              Partager
            </Button>
          </div>
        </div>

        {/* Commentaires */}
        {showComments && (
          <>
            <Separator />
            <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 space-y-3 sm:space-y-4">
              {/* Nouveau commentaire */}
              <div className="flex space-x-2 sm:space-x-3">
                <Avatar className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0">
                  <AvatarImage src="/placeholder.svg?height=32&width=32" />
                  <AvatarFallback className="text-xs">JD</AvatarFallback>
                </Avatar>
                <div className="flex-1 flex space-x-2 min-w-0">
                  <Input
                    placeholder="Écrivez un commentaire..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="flex-1 text-xs sm:text-sm"
                    onKeyPress={(e) => e.key === "Enter" && handleComment()}
                  />
                  <Button size="sm" onClick={handleComment} disabled={!newComment.trim()} className="flex-shrink-0">
                    <Send className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </div>
              </div>

              {/* Liste des commentaires */}
              {post.comments.map((comment: any, index: number) => (
                <div key={index} className="flex space-x-2 sm:space-x-3">
                  <Avatar className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0">
                    <AvatarImage src={comment.author.avatar || "/placeholder.svg"} />
                    <AvatarFallback className="text-xs">{comment.author.initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="bg-gray-100 rounded-lg px-2 sm:px-3 py-1 sm:py-2">
                      <div className="font-semibold text-xs sm:text-sm text-gray-900">{comment.author.name}</div>
                      <p className="text-gray-800 text-xs sm:text-sm break-words">{comment.content}</p>
                    </div>
                    <div className="flex items-center space-x-3 sm:space-x-4 mt-1 text-xs text-gray-500">
                      <span>{comment.timeAgo}</span>
                      <button className="hover:underline">J'aime</button>
                      <button className="hover:underline">Répondre</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default function WallPage() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isPinned, setIsPinned] = useState(false)

  // Calculer la marge gauche dynamiquement
  const getLeftMargin = () => {
    if (isExpanded || isPinned) {
      return "lg:ml-64" // 256px
    }
    return "lg:ml-16" // 64px
  }

  // Posts du mur (posts de l'utilisateur + posts des autres sur son mur)
  const wallPosts = [
    {
      id: 1,
      author: {
        name: "Jean Dupont",
        initials: "JD",
        avatar: "/placeholder.svg?height=48&width=48",
        verified: true,
      },
      content:
        "Vient de découvrir une nouvelle branche de ma famille grâce aux suggestions IA ! Mon arrière-grand-père avait un frère dont je ne connaissais pas l'existence. L'histoire de famille continue de s'écrire... 🌳",
      timeAgo: "Il y a 2 heures",
      privacy: "public",
      likes: 12,
      isLiked: true,
      isOnWall: false,
      image: "/placeholder.svg?height=300&width=500",
      location: "Paris, France",
      comments: [
        {
          author: { name: "Marie Martin", initials: "MM", avatar: "/placeholder.svg?height=32&width=32" },
          content: "C'est incroyable ! L'IA est vraiment utile pour ces découvertes.",
          timeAgo: "Il y a 1 heure",
        },
      ],
    },
    {
      id: 2,
      author: {
        name: "Sophie Dubois",
        initials: "SD",
        avatar: "/placeholder.svg?height=48&width=48",
        verified: false,
      },
      content:
        "Salut Jean ! J'ai trouvé des documents qui pourraient t'intéresser concernant la famille Dupont de Normandie. Je pense qu'on pourrait avoir des ancêtres communs ! 📜",
      timeAgo: "Il y a 5 heures",
      privacy: "public",
      likes: 8,
      isLiked: false,
      isOnWall: true,
      comments: [
        {
          author: { name: "Jean Dupont", initials: "JD", avatar: "/placeholder.svg?height=32&width=32" },
          content: "Merci Sophie ! Ça m'intéresse beaucoup, on peut en discuter en privé ?",
          timeAgo: "Il y a 4 heures",
        },
      ],
    },
    {
      id: 3,
      author: {
        name: "Jean Dupont",
        initials: "JD",
        avatar: "/placeholder.svg?height=48&width=48",
        verified: true,
      },
      content:
        "Petite réflexion du jour : chaque nom dans notre arbre généalogique représente une vie entière, avec ses joies, ses peines, ses rêves... Nous sommes le résultat de milliers d'histoires. ✨",
      timeAgo: "Hier",
      privacy: "public",
      likes: 24,
      isLiked: true,
      isOnWall: false,
      comments: [
        {
          author: { name: "Pierre Moreau", initials: "PM", avatar: "/placeholder.svg?height=32&width=32" },
          content: "Très beau message Jean, ça me donne envie de creuser davantage mon histoire familiale !",
          timeAgo: "Hier",
        },
        {
          author: { name: "Claire Rousseau", initials: "CR", avatar: "/placeholder.svg?height=32&width=32" },
          content: "Exactement ! Chaque ancêtre a sa propre histoire fascinante.",
          timeAgo: "Hier",
        },
      ],
    },
    {
      id: 4,
      author: {
        name: "Michel Leroy",
        initials: "ML",
        avatar: "/placeholder.svg?height=48&width=48",
        verified: true,
      },
      content:
        "Félicitations pour ton travail de recherche Jean ! Ton arbre généalogique est impressionnant. Si tu as besoin d'aide pour les archives de Bretagne, n'hésite pas ! 🏰",
      timeAgo: "Il y a 2 jours",
      privacy: "public",
      likes: 15,
      isLiked: false,
      isOnWall: true,
      comments: [],
    },
  ]
  const currentUser = useSelector(selectUser);
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-green-50">
      {/* Main Content */}
      <div className={`min-h-screen transition-all duration-300 ease-in-out ${getLeftMargin()}`}>
        <div className="p-3 sm:p-4 lg:p-6">
          <div className="max-w-full sm:max-w-2xl lg:max-w-3xl xl:max-w-4xl 2xl:max-w-5xl mx-auto">
            {/* Page Header */}
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center space-x-3 sm:space-x-4 mb-3 sm:mb-4">
                <Avatar className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16">
                  <AvatarImage src={currentUser?.avatarUrl} />
                  <AvatarFallback className="text-lg sm:text-xl">{currentUser && handleGetUserNameInitials(currentUser)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 truncate">Mon Journal</h1>
                  <p className="text-gray-600 text-sm sm:text-base">Vos publications et celles de vos connexions</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 sm:gap-4 lg:gap-6 text-xs sm:text-sm text-gray-600">
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>156 vues cette semaine</span>
                </div>
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <Heart className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>89 j'aime au total</span>
                </div>
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>23 commentaires</span>
                </div>
              </div>
            </div>

            {/* Create Post */}
            {currentUser &&
              <CreatePostCard user={currentUser} />
            }
            {/* Posts Feed */}
            <div className="space-y-4 sm:space-y-6">
              {wallPosts.map((post) => (
                <div key={post.id} className="animate-slide-up">
                  <PostCard post={post} />
                </div>
              ))}
            </div>

            {/* Load More */}
            <div className="text-center mt-6 sm:mt-8">
              <Button variant="outline" className="bg-white text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3">
                Voir plus de publications
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
