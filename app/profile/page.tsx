"use client"

import { useState, useEffect, ChangeEvent, useRef } from "react"
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
  TreePine, User, Settings, Shield, Camera, Save, Users,
  MessageCircle, Heart, Calendar, Trophy, Star, PinIcon, PinOffIcon,
  Menu, X, Bell, Home, Search, Sparkles
} from "lucide-react"
import Link from "next/link"
import { useDispatch, useSelector } from "react-redux"
import { selectUser, setCurrentUser } from "@/lib/redux/slices/currentUserSlice"
import { updateUser, updateUserAvatar } from "../controllers/usersController"
import { Sidebar } from "@/components/sidebar"
import { MemberType, UserLink, UserType } from "@/lib/firebase/models"
import { getMemberById, updateMember } from "../controllers/membersController"

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("profile")
  const currentUser = useSelector(selectUser);
  const [openAlert, setOpenAlert] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const dispatch = useDispatch();

  const [vertical, setVertical] = useState<"top" | "bottom">("bottom")
  const [horizontal, setHorizontal] = useState<"left" | "center" | "right">("center")
  const [member, setMember] = useState<MemberType | null>()

  // ✅ Chargement du member - une seule fois par utilisateur
  useEffect(() => {
    if (!currentUser?.id) return

    let isMounted = true

    const fetchMember = async () => {
      try {
        if (currentUser && currentUser.id) {
          const data = await getMemberById(currentUser.id)
          if (isMounted) {
            setMember(data ?? null)
          }
        }
      } catch (err) {
        console.error("Erreur lors du chargement du member :", err)
      }
    }

    fetchMember()

    return () => {
      isMounted = false
    }
  }, [currentUser?.id])

  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    suggestions: true,
    messages: true,
  })

  function removeUndefined<T extends object>(obj: T): Partial<T> {
    return Object.fromEntries(
      Object.entries(obj).filter(([_, v]) => v !== undefined)
    ) as Partial<T>
  }

  interface FormData {
    firstName: string
    lastName: string
    email: string
    birthDate: string
    bio?: string
    phoneNumber?: string
    localisation?: string
    links: UserLink[]
    familyOrigin?: string
    oldestAncestor?: string
    researchInterests?: string
  }

  // ✅ État initial vide pour éviter les problèmes de synchronisation
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    birthDate: "",
    bio: "",
    phoneNumber: "",
    localisation: "",
    links: [],
    familyOrigin: "",
    oldestAncestor: "",
    researchInterests: "",
  });

  // ✅ Synchronise formData avec currentUser - se déclenche uniquement quand l'ID change
  useEffect(() => {
    if (currentUser?.id) {
      setFormData({
        firstName: currentUser.firstName ?? "",
        lastName: currentUser.lastName ?? "",
        email: currentUser.email ?? "",
        birthDate: currentUser.birthDate
          ? new Date(currentUser.birthDate).toISOString().split("T")[0]
          : "",
        bio: currentUser.bio ?? "",
        phoneNumber: currentUser.phoneNumber ?? "",
        localisation: currentUser.localisation ?? "",
        links: currentUser.links ?? [],
        familyOrigin: currentUser.familyOrigin ?? "",
        oldestAncestor: currentUser.oldestAncestor ?? "",
        researchInterests: currentUser.researchInterests ?? "",
      })
    }
  }, [currentUser?.id])

  const handleSubmit = async () => {
    if (!currentUser?.id) {
      console.error("User non identifié")
      return
    }

    // ✅ Empêche les doubles soumissions
    if (isSaving) return

    setIsSaving(true)

    try {
      // Mise à jour du User
      const updatedUser: UserType = {
        id: currentUser.id,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        lastNameLower: formData.lastName.trim().toLowerCase(),
        firstNameLower: formData.firstName.trim().toLowerCase(),
        email: formData.email.trim(),
        bio: formData.bio || undefined,
        phoneNumber: formData.phoneNumber || undefined,
        localisation: formData.localisation || undefined,
        familyOrigin: formData.familyOrigin || undefined,
        oldestAncestor: formData.oldestAncestor || undefined,
        researchInterests: formData.researchInterests || undefined,
        links: formData.links ?? [],
        birthDate: formData.birthDate ? new Date(formData.birthDate).getTime() : undefined,
        avatarUrl: currentUser.avatarUrl,
        nationality: currentUser.nationality,
        createdDate: currentUser.createdDate,
        isActive: currentUser.isActive ?? true,
        treesIds: currentUser.treesIds ?? [],
        updatedDate: Date.now(),
      }

      await updateUser(updatedUser)
      dispatch(setCurrentUser(updatedUser))

      // Récupérer le member correspondant
      const member = await getMemberById(currentUser.id)

      if (member?.id) {
        const updatedMember: Partial<MemberType> = removeUndefined({
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          birthDate: updatedUser.birthDate,
          bio: updatedUser.bio,
          nationality: updatedUser.nationality,
          avatar: updatedUser.avatarUrl,
          updatedDate: Date.now(),
        })
        await updateMember(member.id, updatedMember)
      }

      setIsError(false)
      setOpenAlert(true)
    } catch (error) {
      console.error("Erreur lors de la mise à jour :", error)
      setIsError(true)
      setOpenAlert(true)
    } finally {
      setIsSaving(false)
    }
  }

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleButtonClick = () => fileInputRef.current?.click()

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && currentUser?.id) {
      try {
        const newAvatarUrl = await updateUserAvatar(file, currentUser.id);
        const updatedUser: UserType = {
          ...currentUser,
          avatarUrl: newAvatarUrl ?? undefined
        };
        dispatch(setCurrentUser(updatedUser));
      } catch (err) {
        console.error("Erreur lors de l'upload de l'avatar :", err);
      }
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }))
  }

  const handleClose = (_: React.SyntheticEvent<any> | Event, reason: string) => {
    if (reason === 'clickaway') return
    setOpenAlert(false)
  }

  const handleAlertClose = () => setOpenAlert(false)

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
      <div className={`min-h-screen transition-all duration-300 ease-in-out`}>
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            {/* Profile Header */}
            <Card className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
                  <div className="relative">
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={currentUser?.avatarUrl} />
                      <AvatarFallback className="text-4xl">
                        {currentUser && currentUser?.firstName[0] + currentUser?.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <>
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileChange}
                      />
                      <Button
                        size="icon"
                        onClick={handleButtonClick}
                        className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 bg-blue-600 hover:bg-blue-700"
                      >
                        <Camera className="w-4 h-4 text-white" />
                      </Button>
                    </>
                  </div>

                  <div className="text-center md:text-left flex-1">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                      {currentUser && currentUser?.firstName + " " + currentUser?.lastName}
                    </h1>
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
                        <Label htmlFor="localisation">Lieu de résidence</Label>
                        <Input
                          id="localisation"
                          name="localisation"
                          value={formData.localisation}
                          onChange={handleChange}
                          placeholder="Ex: Paris, France"
                        />
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
                        id="researchInterests"
                        name="researchInterests"
                        value={formData.researchInterests}
                        onChange={handleChange}
                      />
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
              <Button
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                onClick={handleSubmit}
                disabled={isSaving}
              >
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? "Enregistrement..." : "Enregistrer les modifications"}
              </Button>
            </div>

            <Snackbar
              open={openAlert}
              autoHideDuration={3000}
              onClose={handleClose}
              anchorOrigin={{ vertical, horizontal }}
              key={vertical + horizontal}
            >
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