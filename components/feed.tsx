import { Calendar, Camera, Crown, FileText, Globe, Heart, Link, MapPin, MessageCircle, MessageSquare, Plus, RotateCcw, Save, Search, Settings, Share2, Sparkles, Trash2, TreePine, User, X, ZoomIn, ZoomOut } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Label } from "./ui/label"
import { Input } from "./ui/input"
import { Textarea } from "./ui/textarea"
import { useState } from "react"

export const Feed = ({
  activeTab,
  setActiveTab
}: {
  activeTab: string,
  setActiveTab: (tab: string) => void
}) => {
  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-bold mb-6 animate-slide-up">Fil d'actualité</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Create Post */}
          <Card className="shadow-md border-0 animate-slide-up animate-stagger-1 card-hover">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <Avatar className="animate-scale-in">
                  <AvatarImage src="/placeholder.svg?height=40&width=40" />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <Input
                  placeholder="Partagez une découverte ou une histoire familiale..."
                  className="bg-gray-100 border-0 focus-visible:ring-blue-500"
                />
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-blue-600 transition-colors duration-200"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Photo
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-blue-600 transition-colors duration-200"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Document
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-blue-600 transition-colors duration-200"
                >
                  <TreePine className="h-4 w-4 mr-2" />
                  Arbre
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Posts */}
          <Card className="shadow-md border-0 overflow-hidden animate-slide-up animate-stagger-2 card-hover">
            <CardContent className="p-0">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Avatar className="animate-scale-in">
                      <AvatarImage src="/placeholder.svg?height=40&width=40" />
                      <AvatarFallback>MD</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold">Marie Dubois</div>
                      <div className="text-xs text-gray-500">Il y a 2 heures</div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                    >
                      <circle cx="12" cy="12" r="1" />
                      <circle cx="19" cy="12" r="1" />
                      <circle cx="5" cy="12" r="1" />
                    </svg>
                  </Button>
                </div>
                <div className="mb-4">
                  <p className="text-gray-700 mb-4">
                    J'ai découvert cette photo de notre arrière-grand-père lors de son service militaire en
                    1915. Incroyable de voir cette partie de notre histoire familiale !
                  </p>
                  <div className="rounded-lg overflow-hidden bg-gray-100 h-64 flex items-center justify-center animate-scale-in">
                    <img
                      src="/placeholder.svg?height=300&width=500"
                      alt="Photo historique"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div className="flex space-x-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-600 hover:text-blue-600 transition-colors duration-200"
                    >
                      <Heart className="h-4 w-4 mr-2" />
                      12
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-600 hover:text-blue-600 transition-colors duration-200"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />4
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-600 hover:text-blue-600 transition-colors duration-200"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Partager
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-0 overflow-hidden animate-slide-up animate-stagger-3 card-hover">
            <CardContent className="p-0">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Avatar className="animate-scale-in">
                      <AvatarImage src="/placeholder.svg?height=40&width=40" />
                      <AvatarFallback>PD</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold">Pierre Dupont</div>
                      <div className="text-xs text-gray-500">Hier</div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                    >
                      <circle cx="12" cy="12" r="1" />
                      <circle cx="19" cy="12" r="1" />
                      <circle cx="5" cy="12" r="1" />
                    </svg>
                  </Button>
                </div>
                <div className="mb-4">
                  <p className="text-gray-700">
                    Je viens de mettre à jour notre arbre généalogique avec les informations que j'ai trouvées
                    dans les archives départementales. Nous pouvons maintenant remonter jusqu'en 1820 !
                  </p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div className="flex space-x-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-600 hover:text-blue-600 transition-colors duration-200"
                    >
                      <Heart className="h-4 w-4 mr-2" />8
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-600 hover:text-blue-600 transition-colors duration-200"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />2
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-600 hover:text-blue-600 transition-colors duration-200"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Partager
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Suggestions */}
          <Card className="shadow-md border-0 animate-slide-up animate-stagger-1 card-hover">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Suggestions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between animate-slide-up animate-stagger-1">
                  <div className="flex items-center space-x-3">
                    <Avatar className="animate-scale-in">
                      <AvatarImage src="/placeholder.svg?height=40&width=40" />
                      <AvatarFallback>JM</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold">Jean Martin</div>
                      <div className="text-xs text-gray-500">Possible cousin</div>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="transition-colors duration-200 bg-transparent">
                    Voir
                  </Button>
                </div>
                <div className="flex items-center justify-between animate-slide-up animate-stagger-2">
                  <div className="flex items-center space-x-3">
                    <Avatar className="animate-scale-in">
                      <AvatarImage src="/placeholder.svg?height=40&width=40" />
                      <AvatarFallback>LD</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold">Lucie Dubois</div>
                      <div className="text-xs text-gray-500">Possible tante</div>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="transition-colors duration-200 bg-transparent">
                    Voir
                  </Button>
                </div>
              </div>
              <div className="mt-4 text-center">
                <Link href="/dashboard" onClick={() => setActiveTab("ai")}>
                  <Button variant="link" size="sm" className="text-blue-600 transition-colors duration-200">
                    Voir toutes les suggestions
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="shadow-md border-0 animate-slide-up animate-stagger-2 card-hover">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Activité récente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3 animate-slide-up animate-stagger-1">
                  <div className="w-1 h-1 rounded-full bg-blue-500 mt-2"></div>
                  <div>
                    <div className="text-sm">
                      <span className="font-semibold">Marie Dubois</span> a ajouté une nouvelle photo
                    </div>
                    <div className="text-xs text-gray-500">Il y a 2 heures</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3 animate-slide-up animate-stagger-2">
                  <div className="w-1 h-1 rounded-full bg-blue-500 mt-2"></div>
                  <div>
                    <div className="text-sm">
                      <span className="font-semibold">Pierre Dupont</span> a mis à jour l'arbre généalogique
                    </div>
                    <div className="text-xs text-gray-500">Hier</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3 animate-slide-up animate-stagger-3">
                  <div className="w-1 h-1 rounded-full bg-blue-500 mt-2"></div>
                  <div>
                    <div className="text-sm">
                      <span className="font-semibold">Sophie Dupont</span> a ajouté un nouveau membre
                    </div>
                    <div className="text-xs text-gray-500">Il y a 2 jours</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}