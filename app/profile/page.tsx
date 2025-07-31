"use client"

import { useState, useEffect, ChangeEvent } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  TreePine,
  User,
  Settings,
  Shield,
  Camera,
  Save,
  Users,
  MessageCircle,
  Heart,
  Calendar,
  Trophy,
  Star,
  PinIcon,
  PinOffIcon,
  Menu,
  X,
  Bell,
  Home,
  Search,
  Sparkles,
} from "lucide-react"
import Link from "next/link"
import { useDispatch, useSelector } from "react-redux"
import { selectUser, setCurrentUser } from "@/lib/redux/slices/currentUserSlice"
import { updateUser } from "../controllers/usersController"

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
    { id: "tree", label: "Mon arbre", icon: TreePine, href: "/dashboard" },
    { id: "ai", label: "Suggestions IA", icon: Sparkles, href: "/dashboard" },
    { id: "search", label: "Recherche", icon: Search, href: "/dashboard" },
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
      className={`hidden md:flex flex-col h-screen bg-white border-r border-gray-200 transition-all duration-300 ease-in-out ${isExpanded ? "w-64" : "w-16"
        } fixed left-0 top-0 z-40 shadow-lg`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 min-h-[73px] flex items-center">
        <div className="flex items-center justify-between w-full">
          <Link href="/dashboard" className="flex items-center space-x-3">
            <TreePine className="h-8 w-8 text-blue-600 flex-shrink-0" />
            <span
              className={`text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent whitespace-nowrap transition-all duration-200 ${shouldShowText ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                }`}
            >
              GeneAIlogy
            </span>
          </Link>
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
            <Link key={item.id} href={item.href || "/dashboard"}>
              <button
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

      {/* Profile */}
      <div className="p-4 border-t border-gray-200">
        <button
          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 bg-blue-100 text-blue-700`}
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
      </div>
    </div>
  )
}

function MobileHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const menuItems = [
    { id: "feed", label: "Feed", icon: Home, href: "/dashboard" },
    { id: "notifications", label: "Notifications", icon: Bell, badge: 3, href: "/dashboard" },
    { id: "tree", label: "Mon arbre", icon: TreePine, href: "/dashboard" },
    { id: "ai", label: "Suggestions IA", icon: Sparkles, href: "/dashboard" },
    { id: "search", label: "Recherche", icon: Search, href: "/dashboard" },
    { id: "messages", label: "Messages", icon: MessageCircle, href: "/dashboard" },
  ]

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <Link href="/dashboard" className="flex items-center space-x-3">
          <TreePine className="h-8 w-8 text-blue-600" />
          <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            GeneAIlogy
          </span>
        </Link>
        <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 shadow-lg">
          <nav className="py-2">
            {menuItems.map((item) => (
              <Link key={item.id} href={item.href || "/dashboard"}>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full flex items-center space-x-3 px-4 py-3 transition-colors text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                  {item.badge && <Badge className="ml-auto bg-red-500 text-white text-xs">{item.badge}</Badge>}
                </button>
              </Link>
            ))}
            <button className="w-full flex items-center space-x-3 px-4 py-3 transition-colors bg-blue-100 text-blue-700">
              <User className="h-5 w-5" />
              <span>Profil</span>
            </button>
          </nav>
        </div>
      )}
    </>
  )
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("profile")
  const [isExpanded, setIsExpanded] = useState(false)
  const [isPinned, setIsPinned] = useState(false)
  const currentUser = useSelector(selectUser);
  const [openAlert, setOpenAlert] = useState(false);
  const [isError, setIsError] = useState(false);
  const dispatch = useDispatch();

  const [vertical, setVertical] = useState<"top" | "bottom">("bottom")
  const [horizontal, setHorizontal] = useState<"left" | "center" | "right">("center")

  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    suggestions: true,
    messages: true,
  })

  interface FormData {
    firstName: string,
    lastName: string,
    email: string,
    avatarUrl: string | undefined,
    birthDate: number | undefined,
    bio: string | undefined,
    phoneNumber: string | undefined,
    localisation: string | undefined,
    familyOrigin: string | undefined,
    oldestAncestor: string | undefined,
    researchInterests: string | undefined,
  }

  const [formData, setFormData] = useState<FormData>({
    firstName: currentUser?.firstName ?? "",
    lastName: currentUser?.lastName ?? "",
    email: currentUser?.email ?? "",
    birthDate: currentUser?.birthDate ?? undefined,
    avatarUrl: currentUser?.avatarUrl ?? undefined,
    bio: currentUser?.bio ?? undefined,
    phoneNumber: currentUser?.phoneNumber ?? undefined,
    localisation: currentUser?.localisation ?? undefined,
    familyOrigin: currentUser?.familyOrigin ?? undefined,
    oldestAncestor: currentUser?.oldestAncestor ?? undefined,
    researchInterests: currentUser?.researchInterests ?? undefined,
  });

  const handleSubmit = async () => {
    if (!currentUser?.id) {
      console.error("L'utilisateur n'est pas identifié ou n'a pas d'ID Firestore.")
      return
    }

    const updatedUser = {
      id: currentUser.id, // requis pour cibler le bon document
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim(),
      avatarUrl: formData.avatarUrl || '',
      bio: formData.bio || '',
      phoneNumber: formData.phoneNumber || '',
      localisation: formData.localisation || '',
      familyOrigin: formData.familyOrigin || "",
      oldestAncestor: formData.oldestAncestor || '',
      researchInterests: formData.researchInterests || '',
      updatedDate: Date.now(),
    }

    const success = await updateUser(updatedUser)
    dispatch(setCurrentUser(updatedUser))
    setOpenAlert(true);
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };
  const handleClose = (
    event: React.SyntheticEvent<any> | Event,
    reason: string
  ) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpenAlert(false);
  };

  const handleAlertClose = (event: React.SyntheticEvent) => {
    setOpenAlert(false);
  };

  // Calculer la marge gauche dynamiquement
  const getLeftMargin = () => {
    if (isExpanded || isPinned) {
      return "md:ml-64" // 256px
    }
    return "md:ml-16" // 64px
  }

  const stats = [
    { label: "Membres de l'arbre", value: "24", icon: Users, color: "text-blue-600" },
    { label: "Connexions", value: "12", icon: MessageCircle, color: "text-green-600" },
    { label: "Publications", value: "8", icon: Heart, color: "text-red-600" },
    { label: "Années couvertes", value: "150+", icon: Calendar, color: "text-purple-600" },
  ]

  const achievements = [
    { title: "Premier arbre", description: "Créé votre premier arbre généalogique", earned: true },
    { title: "Explorateur", description: "Ajouté 10 membres à votre arbre", earned: true },
    { title: "Connecteur", description: "Établi 5 connexions avec d'autres familles", earned: true },
    { title: "Historien", description: "Remonté sur 4 générations", earned: false },
    { title: "Archiviste", description: "Téléchargé 20 documents", earned: false },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-green-50">
      {/* Desktop Sidebar */}
      <DesktopSidebar
        activeTab="profile"
        setActiveTab={setActiveTab}
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
        isPinned={isPinned}
        setIsPinned={setIsPinned}
      />

      {/* Mobile Header */}
      <MobileHeader />

      {/* Main Content */}
      <div className={`min-h-screen transition-all duration-300 ease-in-out ${getLeftMargin()}`}>
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            {/* Profile Header */}
            <Card className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
                  <div className="relative">
                    <Avatar className="w-24 h-24">
                      <AvatarImage src="/placeholder.svg?height=96&width=96" />
                      <AvatarFallback className="text-2xl">JD</AvatarFallback>
                    </Avatar>
                    <Button
                      size="icon"
                      className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 bg-blue-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      <Camera className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="text-center md:text-left flex-1">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Jean Dupont</h1>
                    <p className="text-gray-600 mb-4">Généalogiste passionné depuis 2020</p>
                    <div className="flex flex-wrap justify-center md:justify-start gap-2">
                      <Badge className="bg-blue-100 text-blue-800">Membre Premium</Badge>
                      <Badge className="bg-green-100 text-green-800">Vérifié</Badge>
                      <Badge className="bg-purple-100 text-purple-800">Expert</Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-center">
                    {stats.slice(0, 2).map((stat, index) => (
                      <div key={index} className="bg-white/50 rounded-lg p-3">
                        <stat.icon className={`w-5 h-5 mx-auto mb-1 ${stat.color}`} />
                        <div className="text-xl font-bold text-gray-800">{stat.value}</div>
                        <div className="text-xs text-gray-600">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="grid md:grid-cols-4 gap-4 mb-8">
              {stats.map((stat, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4 text-center">
                    <stat.icon className={`w-8 h-8 mx-auto mb-2 ${stat.color}`} />
                    <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Main Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="profile" className="flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Profil
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center">
                  <Settings className="w-4 h-4 mr-2" />
                  Paramètres
                </TabsTrigger>
                <TabsTrigger value="privacy" className="flex items-center">
                  <Shield className="w-4 h-4 mr-2" />
                  Confidentialité
                </TabsTrigger>
                <TabsTrigger value="achievements" className="flex items-center">
                  <Trophy className="w-4 h-4 mr-2" />
                  Succès
                </TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Informations personnelles</CardTitle>
                    <CardDescription>Gérez vos informations de profil</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">Prénom</Label>
                        <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Nom</Label>
                        <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" name="email" value={formData.email} onChange={handleChange} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Téléphone</Label>
                      <Input id="phone" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="birthDate">Date de naissance</Label>
                        <Input id="birthDate" type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="location">Lieu de résidence</Label>
                        <Input id="location" defaultValue="Paris, France" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Biographie</Label>
                      <Textarea id="bio" name="bio" value={formData.bio} onChange={handleChange} />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Origines familiales</CardTitle>
                    <CardDescription>Informations sur vos racines</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="familyOrigin">Région d'origine principale</Label>
                        <Input id="familyOrigin" name="familyOrigin" value={formData.familyOrigin} onChange={handleChange} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="oldestAncestor">Ancêtre le plus ancien</Label>
                        <Input id="oldestAncestor" name="oldestAncestor" value={formData.oldestAncestor} onChange={handleChange} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="researchInterests">Centres d'intérêt de recherche</Label>
                      <Textarea
                        id="researchInterests" name="researchInterests" value={formData.researchInterests} onChange={handleChange} />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Notifications</CardTitle>
                    <CardDescription>Gérez vos préférences de notification</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="email-notif">Notifications par email</Label>
                        <p className="text-sm text-gray-600">Recevez des emails pour les activités importantes</p>
                      </div>
                      <Switch
                        id="email-notif"
                        checked={notifications.email}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, email: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="push-notif">Notifications push</Label>
                        <p className="text-sm text-gray-600">Notifications en temps réel sur votre appareil</p>
                      </div>
                      <Switch
                        id="push-notif"
                        checked={notifications.push}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, push: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="suggestions-notif">Suggestions IA</Label>
                        <p className="text-sm text-gray-600">Notifications pour les nouvelles suggestions de liens</p>
                      </div>
                      <Switch
                        id="suggestions-notif"
                        checked={notifications.suggestions}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, suggestions: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="messages-notif">Messages</Label>
                        <p className="text-sm text-gray-600">Notifications pour les nouveaux messages</p>
                      </div>
                      <Switch
                        id="messages-notif"
                        checked={notifications.messages}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, messages: checked })}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Préférences d'affichage</CardTitle>
                    <CardDescription>Personnalisez votre expérience</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="language">Langue</Label>
                      <select className="w-full p-2 border rounded-md">
                        <option value="fr">Français</option>
                        <option value="en">English</option>
                        <option value="es">Español</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dateFormat">Format de date</Label>
                      <select className="w-full p-2 border rounded-md">
                        <option value="dd/mm/yyyy">DD/MM/YYYY</option>
                        <option value="mm/dd/yyyy">MM/DD/YYYY</option>
                        <option value="yyyy-mm-dd">YYYY-MM-DD</option>
                      </select>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="privacy" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Visibilité du profil</CardTitle>
                    <CardDescription>Contrôlez qui peut voir vos informations</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="profileVisibility">Visibilité de votre arbre</Label>
                      <select className="w-full p-2 border rounded-md">
                        <option value="public">Public - Visible par tous</option>
                        <option value="connections">Connexions uniquement</option>
                        <option value="private">Privé - Visible par vous seul</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contactVisibility">Qui peut vous contacter</Label>
                      <select className="w-full p-2 border rounded-md">
                        <option value="everyone">Tout le monde</option>
                        <option value="verified">Utilisateurs vérifiés uniquement</option>
                        <option value="connections">Connexions uniquement</option>
                      </select>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Données et sécurité</CardTitle>
                    <CardDescription>Gérez vos données personnelles</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button variant="outline" className="w-full bg-transparent">
                      Télécharger mes données
                    </Button>
                    <Button variant="outline" className="w-full bg-transparent">
                      Changer le mot de passe
                    </Button>
                    <Button variant="destructive" className="w-full">
                      Supprimer mon compte
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="achievements" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Vos succès</CardTitle>
                    <CardDescription>Débloquez des badges en explorant votre généalogie</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      {achievements.map((achievement, index) => (
                        <div
                          key={index}
                          className={`p-4 rounded-lg border-2 ${achievement.earned ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50"
                            }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-12 h-12 rounded-full flex items-center justify-center ${achievement.earned ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
                                }`}
                            >
                              {achievement.earned ? <Star className="w-6 h-6" /> : <Trophy className="w-6 h-6" />}
                            </div>
                            <div>
                              <h3 className="font-semibold">{achievement.title}</h3>
                              <p className="text-sm text-gray-600">{achievement.description}</p>
                              {achievement.earned && (
                                <Badge className="mt-1 bg-green-100 text-green-800">Débloqué</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Save Button */}
            <div className="flex justify-end mt-8">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" onClick={handleSubmit}>
                <Save className="mr-2 h-4 w-4" />
                Enregistrer les modifications
              </Button>
            </div>
            <Snackbar open={openAlert} autoHideDuration={3000} onClose={handleClose} anchorOrigin={{ vertical, horizontal }} key={vertical + horizontal}>
              <Alert
                onClose={handleAlertClose}
                severity={!isError ? "success" : "error"}
                variant="filled"
                sx={{ width: '100%' }}
              >
                {!isError ? "Les modifications ont bien été enregistrées" : "Une erreur s'est produite, veuillez réessayer."}
              </Alert>
            </Snackbar>
          </div>
        </div>
      </div>
    </div>
  )
}
